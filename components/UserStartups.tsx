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
}: {
  id: string
  githubId?: string | null
}) => {
  if (!id && !githubId) {
    return <p className="no-result">No posts yet</p>
  }

  let list: StartupTypeCard[] = []
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
    const byRefList = Array.isArray(byRef) ? byRef : []
    const byGitHubList = Array.isArray(byGitHubId) ? byGitHubId : []
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
  } catch {
    list = []
  }

  return (
    <>
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
