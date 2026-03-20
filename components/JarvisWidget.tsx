"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Bot, Send } from "lucide-react";

type ChatMessage = {
  id: string;
  role: "user" | "jarvis";
  content: string;
};

type SimilarStartup = {
  title: string;
  url: string;
  score?: number;
  snippet?: string;
};

type JarvisResponse = {
  reply: string;
  matches?: SimilarStartup[];
};

const JARVIS_GREETING =
  "hi i am jarvis i am still in training period but you can try the limited abilities i have now.";

function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

export default function JarvisWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [idea, setIdea] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Initialize with greeting the first time the widget is opened.
  useEffect(() => {
    if (!open) return;
    if (messages.length > 0) return;
    setMessages([
      { id: uid(), role: "jarvis", content: JARVIS_GREETING },
      { id: uid(), role: "jarvis", content: "Tell me your startup idea. Then I will look on the internet for similar startups and links." },
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isThinking]);

  const canSend = useMemo(() => idea.trim().length > 0 && !isThinking, [idea, isThinking]);

  async function submitIdea() {
    const trimmed = idea.trim();
    if (!trimmed) return;

    setIdea("");
    const userMsg: ChatMessage = { id: uid(), role: "user", content: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setIsThinking(true);

    try {
      const res = await fetch("/api/jarvis", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ idea: trimmed }),
      });

      if (!res.ok) throw new Error(`Jarvis API failed: ${res.status}`);

      const data: JarvisResponse = await res.json();
      const jarvisMsg: ChatMessage = { id: uid(), role: "jarvis", content: data.reply };
      setMessages((prev) => [...prev, jarvisMsg]);

      // If we got matches, append them as a separate jarvis message.
      if (data.matches && data.matches.length > 0) {
        const lines = data.matches.slice(0, 4).map((m) => `- ${m.title}: ${m.url}`);
        setMessages((prev) => [
          ...prev,
          {
            id: uid(),
            role: "jarvis",
            content:
              "Similar startup(s) I found from the internet based on your idea:\n" + lines.join("\n"),
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: uid(),
          role: "jarvis",
          content:
            "Sorry, I couldn't search for similar startups right now. Please try again in a moment.",
        },
      ]);
    } finally {
      setIsThinking(false);
    }
  }

  return (
    <>
      <div className="fixed bottom-4 right-4 z-[60]">
        <div className="flex items-center gap-3">
          {open && (
            <div
              className="bg-white border-4 border-black shadow-[6px_6px_0px_black] rounded-2xl flex flex-col"
              style={{
                width: 320,
                maxWidth: "calc(100vw - 2rem)",
                height: "80vh",
                maxHeight: 560,
              }}
            >
              <div className="p-4 border-b-4 border-black flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bot className="size-6" />
                  <span className="font-bold">Jarvis</span>
                </div>
                <button
                  type="button"
                  className="font-bold text-sm underline"
                  onClick={() => setOpen(false)}
                  aria-label="Close Jarvis"
                >
                  Close
                </button>
              </div>

              <div className="p-4 overflow-y-auto flex-1">
                <div className="flex flex-col gap-3">
                  {messages.map((m) => (
                    <div
                      key={m.id}
                      className={m.role === "user" ? "self-end max-w-[85%]" : "self-start max-w-[85%]"}
                    >
                      <div
                        className="whitespace-pre-wrap px-3 py-2 rounded-2xl text-sm font-semibold break-all w-full"
                        style={{
                          backgroundColor: m.role === "user" ? "#EE2B69" : "#FBE843",
                          border: "2px solid black",
                          overflowWrap: "anywhere",
                        }}
                      >
                        {m.content}
                      </div>
                    </div>
                  ))}
                  {isThinking && (
                    <div className="self-start max-w-[85%]">
                      <div
                        className="whitespace-pre-wrap px-3 py-2 rounded-2xl text-sm font-semibold break-all w-full"
                        style={{
                          backgroundColor: "#FBE843",
                          border: "2px solid black",
                          overflowWrap: "anywhere",
                        }}
                      >
                        Thinking...
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              <div className="p-4 border-t-4 border-black">
                <label className="block text-sm font-bold mb-2">Your startup idea</label>
                <div className="flex gap-2">
                  <input
                    value={idea}
                    onChange={(e) => setIdea(e.target.value)}
                    placeholder="Tell Jarvis your startup idea..."
                    className="min-w-0 flex-1 border-3 border-black rounded-full px-4 py-2 font-semibold text-sm outline-none"
                  />
                  <button
                    type="button"
                    disabled={!canSend}
                    className="border-3 border-black rounded-full px-4 py-2 bg-black text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    onClick={submitIdea}
                    aria-label="Send idea"
                  >
                    <Send className="size-5" />
                  </button>
                </div>

                <p className="text-xs mt-2 text-black/70">
                  Tip: include the problem you solve + who it&apos;s for.
                </p>
              </div>
            </div>
          )}

          {!open && (
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="bg-black text-white border-4 border-black rounded-full p-3 shadow-md hover:opacity-90"
              aria-label="Open Jarvis chatbot"
            >
              <Bot className="size-7" />
            </button>
          )}
        </div>
      </div>
    </>
  );
}

