import { unstable_noStore as noStore } from 'next/cache'
import { clientFresh } from '@/sanity/lib/client'
import {
  STARTUPS_BY_AUTHOR_QUERY,
  STARTUPS_BY_AUTHOR_GITHUB_ID_QUERY,
} from '@/sanity/lib/queries'
import React from 'react'
import StartupCard, { StartupTypeCard } from './StartupCard'

const UserStartups = async ({
  id,
  githubId,
  debug = false,
}: {
  id: string
  githubId?: string | null
  debug?: boolean
}) => {
  noStore()

  if (!id && !githubId) {
    return (
      <>
        {debug && (
          <li className="col-span-full p-4 mb-4 rounded bg-gray-100 text-sm font-mono">
            <p className="font-bold mb-2">[Debug] Your Startups</p>
            <p>early return: no id and no githubId</p>
          </li>
        )}
        <p className="no-result">No posts yet</p>
      </>
    )
  }

  let list: StartupTypeCard[] = []
  let byRefList: StartupTypeCard[] = []
  let byGitHubList: StartupTypeCard[] = []
  let errorMsg: string | null = null
  try {
    const byRef = id
      ? await clientFresh.fetch(STARTUPS_BY_AUTHOR_QUERY, { id })
      : []
    const byGitHubId =
      githubId != null && githubId !== ''
        ? await clientFresh.fetch(STARTUPS_BY_AUTHOR_GITHUB_ID_QUERY, {
            githubId: Number(githubId) || githubId,
          })
        : []
    byRefList = Array.isArray(byRef) ? byRef : []
    byGitHubList = Array.isArray(byGitHubId) ? byGitHubId : []
    const seen = new Set<string>()
    for (const s of [...byRefList, ...byGitHubList]) {
      if (s?._id && !seen.has(s._id)) {
        seen.add(s._id)
        list.push(s)
      }
    }
    list.sort(
      (a, b) =>
        new Date(b._createdAt).getTime() - new Date(a._createdAt).getTime()
    )
  } catch (err) {
    list = []
    errorMsg = err instanceof Error ? err.message : String(err)
  }

  return (
    <>
      {debug && (
        <li className="col-span-full p-4 mb-4 rounded bg-gray-100 text-sm font-mono">
          <p className="font-bold mb-2">[Debug] Your Startups</p>
          <p>projectId: {process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? "(missing)"}</p>
          <p>dataset: {process.env.NEXT_PUBLIC_SANITY_DATASET ?? "(missing)"}</p>
          <p>author id (from URL): {id}</p>
          <p>author githubId: {String(githubId)}</p>
          <p>by author._ref: {byRefList.length} startups</p>
          <p>by author→id: {byGitHubList.length} startups</p>
          <p>merged total: {list.length}</p>
          {errorMsg && <p className="text-red-600">error: {errorMsg}</p>}
        </li>
      )}
      {list.length > 0 ? (
        list.map((startup: StartupTypeCard) => (
          <StartupCard key={startup._id} post={startup} />
        ))
      ) : (
        <p className="no-result">No posts yet</p>
      )}
    </>
  )
}

export default UserStartups
