import { auth } from "@/auth";
import { clientFresh } from "@/sanity/lib/client";
import { AUTHOR_BY_ID_QUERY } from "@/sanity/lib/queries";
import { notFound } from "next/navigation";
import Image from "next/image";
import UserStartups from "@/components/UserStartups";
import { Suspense } from "react";
import { StartupCardSkeleton } from "@/components/StartupCard";

export const dynamic = "force-dynamic";

const Page = async ({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ debug?: string }>
}) => {
  const id = (await params).id
  const { debug: debugParam } = await searchParams
  const session = await auth()

  const user = await clientFresh.fetch(AUTHOR_BY_ID_QUERY, { id })
  if (!user) return notFound()

  return (
    <>
      <section className="profile_container">
        <div className="profile_card">
          <div className="profile_title">
            <h3 className="text-24-black uppercase text-center line-clamp-1">
              {user.name}
            </h3>
          </div>

          <Image
            src={user.image}
            alt={user.name}
            width={220}
            height={220}
            className="profile_image"
          />

          <p className="text-30-extrabold mt-7 text-center">
            @{user?.username}
          </p>
          <p className="mt-1 text-center text-14-normal">{user?.bio}</p>
        </div>

        <div className="flex-1 flex flex-col gap-5 lg:-mt-5">
          <div className="p-4 mb-4 rounded bg-amber-200 border-2 border-amber-500 text-sm font-mono">
            <p className="font-bold mb-2">[Live Debug - remove after fixing] build: profile-with-startups-v2</p>
            <p>projectId: {process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? "(missing)"}</p>
            <p>dataset: {process.env.NEXT_PUBLIC_SANITY_DATASET ?? "(missing)"}</p>
            <p>author id: {id}</p>
            <p>githubId: {String(user?.id ?? "(missing)")}</p>
          </div>
          <p className="text-30-bold">
            {session?.id === id ? "Your" : "All"} Startups
          </p>
          <ul className="card_grid-sm">
            <Suspense fallback={<StartupCardSkeleton />}>
              <UserStartups
                id={id}
                githubId={user.id}
                debug={debugParam === "1"}
              />
            </Suspense>
          </ul>
        </div>
      </section>
    </>
  )
}

export default Page;