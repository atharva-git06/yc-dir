import { auth } from "@/auth";
import StartupCard, { StartupTypeCard } from "@/components/StartupCard";
import { clientFresh } from "@/sanity/lib/client";
import { TOP_STARTUPS_QUERY } from "@/sanity/lib/queries";

export default async function TopStartupsPage() {
  const session = await auth();
  const posts: StartupTypeCard[] = await clientFresh.fetch(TOP_STARTUPS_QUERY, {
    userId: session?.id ?? null,
  });

  return (
    <>
      <section className="pink_container">
        <h1 className="heading">Top Startups</h1>
        <p className="sub-heading !max-w-3xl">
          Startups with the most views in the directory.
        </p>
      </section>

      <section className="section_container">
        <p className="text-30-semibold">Top Startups</p>
        <ul className="mt-7 card_grid">
          {posts.length > 0 ? (
            posts.map((post: StartupTypeCard) => (
              <StartupCard key={post._id} post={post} />
            ))
          ) : (
            <p className="no-results">No startups yet</p>
          )}
        </ul>
      </section>
    </>
  );
}

