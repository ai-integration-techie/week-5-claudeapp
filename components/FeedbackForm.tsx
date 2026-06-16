'use client'

import { useEffect, useState } from 'react'
import { Star } from 'lucide-react'
import { apiFetch } from '@/lib/api'

// Self-contained: owns its rating/comment/submitted state. The parent only
// supplies the ids. Confirmation auto-dismisses after a short delay (FR-019).
export default function FeedbackForm({
  sessionId,
  messageId,
}: {
  sessionId: string
  messageId: string
}) {
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!done) return
    const t = setTimeout(() => setDismissed(true), 2500)
    return () => clearTimeout(t)
  }, [done])

  if (dismissed) return null

  if (done) {
    return (
      <div className="mt-2 text-caption text-an-success an-fade-in">
        Thanks for your feedback.
      </div>
    )
  }

  async function submit() {
    if (rating < 1 || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await apiFetch('/api/feedback', {
        method: 'POST',
        body: JSON.stringify({ sessionId, messageId, rating, comment }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Could not save feedback.')
        return
      }
      setDone(true)
    } catch {
      setError('Network error saving feedback.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mt-3 rounded-lg border border-an-border bg-an-bg-surface p-3 max-w-[420px] an-fade-in">
      <div className="flex items-center gap-2">
        <span className="text-caption text-an-fg-subtle mr-1">Rate this answer</span>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onClick={() => setRating(n)}
            aria-label={`${n} star${n > 1 ? 's' : ''}`}
            className="text-an-fg-muted transition"
          >
            <Star
              size={16}
              strokeWidth={1.5}
              className={
                (hover || rating) >= n ? 'fill-an-accent text-an-accent' : 'text-an-fg-muted'
              }
            />
          </button>
        ))}
      </div>

      {rating > 0 && (
        <div className="mt-2.5 flex flex-col gap-2">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={2}
            placeholder="Add a comment (optional)"
            className="w-full resize-none rounded-md bg-an-bg-base border border-an-border px-2.5 py-1.5 text-body-sm text-an-fg-base placeholder:text-an-fg-muted outline-none focus:border-an-border-strong"
          />
          {error && <p className="text-caption text-an-error">{error}</p>}
          <button
            type="button"
            onClick={submit}
            disabled={submitting}
            className="self-start h-7 px-3 rounded-md bg-an-accent text-white text-label transition hover:bg-an-accent-hover disabled:opacity-60"
          >
            {submitting ? 'Saving…' : 'Submit'}
          </button>
        </div>
      )}
    </div>
  )
}
