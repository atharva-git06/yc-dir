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
  const startups = githubId
    ? await clientFresh.fetch(STARTUPS_BY_AUTHOR_GITHUB_ID_QUERY, {
        githubId,
      })
    : await clientFresh.fetch(STARTUPS_BY_AUTHOR_QUERY, { id })
  const list = Array.isArray(startups) ? startups : []

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
