import { clientFresh } from '@/sanity/lib/client'
import { STARTUPS_BY_AUTHOR_QUERY } from '@/sanity/lib/queries'
import React from 'react'
import StartupCard, { StartupTypeCard } from './StartupCard'

const UserStartups = async ({ id }: { id: string }) => {
  if (!id) {
    return <p className="no-result">No posts yet</p>
  }
  const startups = await clientFresh.fetch(STARTUPS_BY_AUTHOR_QUERY, { id })
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
