'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { EyeIcon, Heart } from 'lucide-react'
import { getEngagement, incrementView, toggleLike } from '@/lib/actions'

export default function Engagement({
  startupId,
  authorId,
  initialViews = 0,
  initialLikeCount = 0,
  initialLiked = false,
  incrementOnMount = false,
}: {
  startupId: string
  authorId?: string | null
  initialViews?: number
  initialLikeCount?: number
  initialLiked?: boolean
  incrementOnMount?: boolean
}) {
  type GetEngagementResponse = {
    status?: string
    views?: number
    likeCount?: number
    likedByMe?: boolean
  }

  type IncrementViewResponse = {
    status?: string
  }

  type ToggleLikeResponse = {
    status?: string
    liked?: boolean
    likeCount?: number
  }

  const [views, setViews] = useState<number>(Number(initialViews ?? 0))
  const [likeCount, setLikeCount] = useState<number>(Number(initialLikeCount ?? 0))
  const [liked, setLiked] = useState<boolean>(Boolean(initialLiked))
  const [isPending, startTransition] = useTransition()
  const mounted = useRef(false)

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined

    const refresh = async () => {
      const res = (await getEngagement(startupId)) as GetEngagementResponse
      if (res?.status === "SUCCESS") {
        setViews(Number(res.views ?? 0))
        setLikeCount(Number(res.likeCount ?? 0))
        setLiked(Boolean(res.likedByMe))
      }
    }

    ;(async () => {
      if (!mounted.current) {
        mounted.current = true
        if (incrementOnMount) {
          // Deduplicate views per browser so repeated visits don't inflate `views`.
          // This is per-user in practice (browser identity), and avoids server cookie edge-cases.
          const key = `viewed_v2_${startupId}`
          const alreadyViewed = window.localStorage.getItem(key) === "1"
          if (!alreadyViewed) {
            const incRes = (await incrementView(startupId, authorId ?? null)) as IncrementViewResponse
            if (incRes?.status === "SUCCESS") {
              window.localStorage.setItem(key, "1")
            }
          }
        }
        await refresh()
      }
      interval = setInterval(refresh, 2500)
    })()

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [startupId, authorId, incrementOnMount])

  const onToggleLike = () => {
    startTransition(async () => {
      const prevLiked = liked
      const prevCount = likeCount
      const nextLiked = !prevLiked
      setLiked(nextLiked)
      setLikeCount(prevCount + (nextLiked ? 1 : -1))

      const res = (await toggleLike(startupId)) as ToggleLikeResponse
      if (res?.status !== 'SUCCESS') {
        setLiked(prevLiked)
        setLikeCount(prevCount)
        return
      }
      setLiked(Boolean(res.liked))
      setLikeCount(Number(res.likeCount ?? 0))
    })
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex gap-1.5">
        <EyeIcon className="size-6 text-primary" />
        <span className="text-16-medium">{views}</span>
      </div>

      <button
        type="button"
        onClick={onToggleLike}
        disabled={isPending}
        className="inline-flex items-center gap-1.5 disabled:opacity-60"
        aria-pressed={liked}
        aria-label={liked ? 'Unlike' : 'Like'}
      >
        <Heart className={liked ? 'size-6 fill-red-500 text-red-500' : 'size-6 text-primary'} />
        <span className="text-16-medium">{likeCount}</span>
      </button>
    </div>
  )
}

