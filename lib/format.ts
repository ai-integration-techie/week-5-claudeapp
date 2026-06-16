// Shared formatting helpers.

export function formatRelative(iso: string): string {
  const then = new Date(iso).getTime()
  const diff = Date.now() - then
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'just now'
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  const day = Math.floor(hr / 24)
  if (day === 1) return 'yesterday'
  if (day < 7) return `${day}d ago`
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}

// HH:MM for today's messages; full date for older (FR-032)
export function formatMessageTime(iso: string): string {
  const d = new Date(iso)
  const isToday = new Date().toDateString() === d.toDateString()
  const time = d.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  })
  if (isToday) return time
  return `${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} ${time}`
}
