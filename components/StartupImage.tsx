'use client'

import { useState } from 'react'

type Props = {
  src: string | null | undefined
  alt: string
  className?: string
  width?: number
  height?: number
}

export default function StartupImage({ src, alt, className, width, height }: Props) {
  const [failed, setFailed] = useState(false)

  if (!src?.trim() || failed) {
    return (
      <div
        className={className}
        style={width && height ? { width, height } : undefined}
        role="img"
        aria-label="No image"
      >
        <div className="w-full h-full min-h-[120px] bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
          No image
        </div>
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      width={width}
      height={height}
      onError={() => setFailed(true)}
    />
  )
}
