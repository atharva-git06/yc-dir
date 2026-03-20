import { NextResponse } from "next/server";

type TavilySearchResult = {
  title?: string;
  url?: string;
  content?: string;
  score?: number;
};

function tokenize(text: string) {
  const stop = new Set([
    "the",
    "and",
    "for",
    "with",
    "that",
    "this",
    "from",
    "into",
    "using",
    "use",
    "your",
    "you",
    "are",
    "our",
    "their",
    "they",
    "will",
    "can",
    "could",
    "should",
    "would",
    "about",
    "startup",
    "app",
    "platform",
    "service",
    "solution",
    "company",
    "business",
    "and",
    "or",
    "to",
    "of",
    "in",
    "on",
    "at",
    "by",
    "as",
    "be",
    "is",
    "it",
    "we",
    "i",
    "a",
    "an",
  ]);

  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 3 && !stop.has(t));
}

function jaccard(a: string[], b: string[]) {
  const setA = new Set(a);
  const setB = new Set(b);
  if (setA.size === 0 || setB.size === 0) return 0;
  let inter = 0;
  for (const token of setA) {
    if (setB.has(token)) inter++;
  }
  const union = setA.size + setB.size - inter;
  return union === 0 ? 0 : inter / union;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { idea?: string };
    const idea = (body.idea ?? "").trim();
    if (!idea) {
      return NextResponse.json({ reply: "Please tell me your startup idea first." }, { status: 400 });
    }

    const apiKey = process.env.TAVILY_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { reply: "Search is not configured. Missing TAVILY_API_KEY on the server." },
        { status: 500 }
      );
    }

    let ideaTokens = tokenize(idea);
    if (ideaTokens.length === 0) {
      // Fallback: if tokenization yields nothing (e.g. very short ideas), use raw words.
      ideaTokens = idea
        .toLowerCase()
        .split(/\s+/)
        .map((t) => t.replace(/[^a-z0-9-]/g, ""))
        .filter((t) => t.length >= 2);
    }

    const ideaLower = idea.toLowerCase();

    const petKeywords = [
      "pet",
      "pets",
      "dog",
      "dogs",
      "cat",
      "cats",
      "puppy",
      "kitten",
      "animal",
      "animals",
      "pet-friendly",
    ];
    const socialKeywords = [
      "social",
      "social media",
      "instagram",
      "snapchat",
      "tiktok",
      "twitter",
      "facebook",
      "community",
      "network",
      "platform",
    ];
    const competitorKeywords = ["app", "platform", "startup", "company", "network", "community", "product"];
    const excludeTitlePatterns: RegExp[] = [
      /how to/i,
      /guide/i,
      /tips?/i,
      /ideas?/i,
      /come up/i,
      /next great idea/i,
      /inspiration/i,
    ];

    const containsAny = (haystack: string, needles: string[]) =>
      needles.some((n) => haystack.includes(n));

    const petTheme = containsAny(ideaLower, petKeywords);
    const socialTheme = containsAny(ideaLower, socialKeywords);
    const instagramTheme = ideaLower.includes("instagram");

    // Craft a more targeted query so Tavily returns competitors/products, not generic "idea" articles.
    let query = "";
    if (petTheme && (socialTheme || instagramTheme)) {
      query = `${idea} "pet social media" "pet social network" competitors startups app platform`;
      if (instagramTheme) query += ` "instagram for pets"`;
    } else {
      query = `${idea} competitors similar startups companies app platform`;
    }

    // Keep query length reasonable.
    query = query.trim().slice(0, 220);

    const tavilyRes = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        query,
        max_results: 8,
        search_depth: "basic",
        include_answer: false,
      }),
    });

    if (!tavilyRes.ok) {
      return NextResponse.json(
        { reply: "Sorry, I couldn't search the internet right now." },
        { status: 500 }
      );
    }

    const tavilyJson = (await tavilyRes.json()) as { results?: TavilySearchResult[] };
    const results = Array.isArray(tavilyJson.results) ? tavilyJson.results : [];

    const scored = results
      .filter((r) => Boolean(r.title && r.url))
      .map((r) => {
        const title = r.title ?? "";
        const url = r.url ?? "";
        const content = r.content ?? "";

        const titleLower = title.toLowerCase();
        const urlLower = url.toLowerCase();
        // Exclude "how to come up with ideas" and similar pages.
        if (urlLower.includes("quora.com")) return { ...r, score: -1 };
        if (excludeTitlePatterns.some((p) => p.test(titleLower))) return { ...r, score: -1 };

        const candidateText = [title, content].filter(Boolean).join(" ");
        const candidateTokens = tokenize(candidateText);
        const baseScore = jaccard(ideaTokens, candidateTokens);

        const candidateHasPet = containsAny(candidateText.toLowerCase(), petKeywords);
        const candidateHasSocial = containsAny(candidateText.toLowerCase(), socialKeywords);

        // If the user clearly described a pet social media idea, require at least one "pet" and one "social" match.
        if (petTheme && socialTheme) {
          if (!candidateHasPet || !candidateHasSocial) return { ...r, score: -1 };
        }

        const candidateHasCompetitorWords = containsAny(
          `${title} ${url} ${content}`,
          competitorKeywords
        );

        const bonus = (candidateHasCompetitorWords ? 0.05 : 0) + (candidateHasPet ? 0.03 : 0) + (candidateHasSocial ? 0.02 : 0);
        const score = baseScore + bonus;
        return { ...r, score };
      })
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

    const top = scored.filter((s) => (s.score ?? 0) >= 0.05).slice(0, 4);

    if (top.length === 0) {
      return NextResponse.json({ reply: "looks like your startup is unique.", matches: [] });
    }

    return NextResponse.json({
      reply: "I found similar startups based on your idea. Check these out:",
      matches: top.map((t) => ({
        title: t.title ?? "Untitled startup",
        url: t.url!,
        score: t.score,
      })),
    });
  } catch {
    return NextResponse.json(
      { reply: "Sorry, I couldn't search for similar startups right now." },
      { status: 500 }
    );
  }
}

