'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, MessageSquare, LogOut } from 'lucide-react'
import { useAuthGuard } from '@/lib/useAuthGuard'
import { apiFetch } from '@/lib/api'
import { clearSession, getUserEmail } from '@/lib/session'
import { formatRelative } from '@/lib/format'
import KpiCard from '@/components/KpiCard'
import type { DashboardKpis, Session } from '@/lib/types'

export default function DashboardPage() {
  const userId = useAuthGuard()
  const router = useRouter()
  const [kpis, setKpis] = useState<DashboardKpis | null>(null)
  const [recent, setRecent] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const email = typeof window !== 'undefined' ? getUserEmail() : null

  useEffect(() => {
    if (!userId) return
    let active = true
    ;(async () => {
      try {
        const res = await apiFetch('/api/dashboard')
        const data = await res.json()
        if (!active) return
        if (!res.ok) {
          setError(data.error ?? 'Could not load dashboard.')
          return
        }
        setKpis(data.kpis)
        setRecent(data.recentSessions)
      } catch {
        if (active) setError('Network error loading dashboard.')
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [userId])

  async function handleNewChat() {
    setCreating(true)
    try {
      const res = await apiFetch('/api/sessions', { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        router.push(`/chat?session=${data.session.id}`)
      } else {
        setError(data.error ?? 'Could not start a new chat.')
        setCreating(false)
      }
    } catch {
      setError('Network error starting a new chat.')
      setCreating(false)
    }
  }

  function handleLogout() {
    clearSession()
    router.replace('/login')
  }

  if (!userId) return null

  const cards: { label: string; value: string | number | null }[] = [
    { label: 'Documents', value: kpis?.totalDocuments ?? null },
    { label: 'Today', value: kpis?.documentsToday ?? null },
    { label: 'Total queries', value: kpis?.totalQueries ?? null },
    { label: 'Queries this week', value: kpis?.queriesThisWeek ?? null },
    { label: 'Active sessions', value: kpis?.activeSessions ?? null },
    { label: 'Pinned chats', value: kpis?.pinnedChats ?? null },
    {
      label: 'Avg rating',
      value: kpis?.avgRating != null ? kpis.avgRating.toFixed(1) : '—',
    },
    { label: 'Failed jobs', value: kpis?.failedJobs ?? null },
  ]

  return (
    <main className="min-h-screen bg-an-bg-base">
      <div className="max-w-[1080px] mx-auto px-8 py-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="font-display text-display">Dashboard</h1>
            <p className="text-body-sm text-an-fg-subtle mt-1">
              {email ?? 'Signed in'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleNewChat}
              disabled={creating}
              className="h-9 px-4 inline-flex items-center gap-2 rounded-md bg-an-accent text-white text-body font-medium transition duration-150 ease-out hover:bg-an-accent-hover disabled:opacity-60"
            >
              <Plus size={16} strokeWidth={1.5} />
              {creating ? 'Starting…' : 'New chat'}
            </button>
            <button
              onClick={handleLogout}
              className="h-9 px-3 inline-flex items-center gap-2 rounded-md border border-an-border text-an-fg-subtle text-body transition hover:bg-an-bg-surface hover:text-an-fg-base"
            >
              <LogOut size={16} strokeWidth={1.5} />
              Log out
            </button>
          </div>
        </div>

        {error && (
          <p className="text-body-sm text-an-error mb-6" role="alert">
            {error}
          </p>
        )}

        {/* KPI grid */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
          {cards.map((c) => (
            <KpiCard key={c.label} label={c.label} value={c.value} loading={loading} />
          ))}
        </section>

        {/* Recent chats */}
        <section>
          <h2 className="text-title mb-3">Recent chats</h2>
          {loading ? (
            <div className="text-body-sm text-an-fg-muted">Loading…</div>
          ) : recent.length === 0 ? (
            <div className="rounded-lg border border-an-border bg-an-bg-surface p-6 text-center">
              <p className="text-body text-an-fg-subtle">
                No chats yet. Start a new chat to analyze your first contract.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {recent.map((s) => (
                <button
                  key={s.id}
                  onClick={() => router.push(`/chat?session=${s.id}`)}
                  className="flex items-center gap-3 rounded-lg border border-an-border bg-an-bg-surface p-4 text-left transition hover:bg-an-bg-elevated"
                >
                  <MessageSquare
                    size={18}
                    strokeWidth={1.5}
                    className="text-an-fg-muted shrink-0"
                  />
                  <span className="flex-1 min-w-0">
                    <span className="block text-body text-an-fg-base truncate">
                      {s.title}
                    </span>
                    <span className="block text-caption text-an-fg-muted">
                      {formatRelative(s.updated_at)}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
