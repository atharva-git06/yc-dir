'use client'

export default function FormattedDate({ date }: { date: string }) {
  const formatted = new Date(date).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
  return <>{formatted}</>
}
