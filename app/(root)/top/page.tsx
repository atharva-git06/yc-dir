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
    <section className="section_container">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-30-bold">Top Startups</h1>
        <p className="text-16-medium text-black-300">
          Showing the startup with the highest views.
        </p>
      </div>

      <ul className="mt-2 card_grid">
        {posts.length > 0 ? (
          posts.map((post: StartupTypeCard) => (
            <StartupCard key={post._id} post={post} />
          ))
        ) : (
          <p className="no-results">No startups yet</p>
        )}
      </ul>
    </section>
  );
}

