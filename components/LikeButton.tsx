'use client'

import { useTransition, useState } from 'react'
import { Heart } from 'lucide-react'
import { toggleLike } from '@/lib/actions'

export default function LikeButton({
  startupId,
  initialLiked,
  initialCount,
}: {
  startupId: string
  initialLiked?: boolean
  initialCount?: number
}) {
  const [isPending, startTransition] = useTransition()
  const [liked, setLiked] = useState(Boolean(initialLiked))
  const [count, setCount] = useState(Number(initialCount ?? 0))

  const onClick = () => {
    startTransition(async () => {
      const prevLiked = liked
      const prevCount = count
      const nextLiked = !prevLiked
      setLiked(nextLiked)
      setCount(prevCount + (nextLiked ? 1 : -1))

      const res: any = await toggleLike(startupId)
      if (res?.status !== 'SUCCESS') {
        setLiked(prevLiked)
        setCount(prevCount)
        return
      }
      setLiked(Boolean(res.liked))
      setCount(Number(res.likeCount ?? 0))
    })
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isPending}
      className="inline-flex items-center gap-1.5 disabled:opacity-60"
      aria-pressed={liked}
      aria-label={liked ? 'Unlike' : 'Like'}
    >
      <Heart className={liked ? 'size-6 fill-red-500 text-red-500' : 'size-6 text-primary'} />
      <span className="text-16-medium">{count}</span>
    </button>
  )
}

