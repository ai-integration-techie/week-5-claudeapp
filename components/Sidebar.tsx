'use client'

import { useMemo, useState } from 'react'
import { Plus, LogOut, Search } from 'lucide-react'
import SessionItem from './SessionItem'
import type { Session } from '@/lib/types'

type Filter = 'All' | 'Pinned' | 'Recent' | 'Processing' | 'Completed' | 'Error'
const FILTERS: Filter[] = ['All', 'Pinned', 'Recent', 'Processing', 'Completed', 'Error']

function matchesFilter(s: Session, filter: Filter): boolean {
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  switch (filter) {
    case 'Pinned':
      return s.pinned
    case 'Recent':
      return new Date(s.updated_at).getTime() >= weekAgo
    case 'Processing':
      return s.status === 'processing'
    case 'Completed':
      return s.status === 'completed'
    case 'Error':
      return s.status === 'error'
    default:
      return true
  }
}

export default function Sidebar({
  sessions,
  activeId,
  email,
  onNewChat,
  onSelect,
  onLogout,
  onRename,
  onTogglePin,
  onDelete,
}: {
  sessions: Session[]
  activeId: string | null
  email: string | null
  onNewChat: () => void
  onSelect: (id: string) => void
  onLogout: () => void
  onRename: (id: string, title: string) => void
  onTogglePin: (id: string, pinned: boolean) => void
  onDelete: (id: string) => void
}) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('All')

  // Search composes with the active filter (FR-026/027)
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return sessions.filter(
      (s) => matchesFilter(s, filter) && (!q || s.title.toLowerCase().includes(q))
    )
  }, [sessions, query, filter])

  return (
    <aside className="w-[256px] shrink-0 bg-an-bg-subtle border-r border-an-border flex flex-col">
      <div className="px-6 pt-6 pb-3">
        <span className="font-display text-title text-an-fg-base">Contract Review</span>
      </div>

      <div className="px-3 pb-2">
        <button
          onClick={onNewChat}
          className="w-full h-9 px-3 inline-flex items-center gap-2 rounded-md bg-an-accent text-white text-body font-medium transition duration-150 ease-out hover:bg-an-accent-hover"
        >
          <Plus size={16} strokeWidth={1.5} />
          New chat
        </button>
      </div>

      {/* Search */}
      <div className="px-3 pb-2">
        <div className="h-9 px-3 rounded-md bg-an-bg-surface border border-an-border flex items-center gap-2">
          <Search size={14} strokeWidth={1.5} className="text-an-fg-muted shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search chats"
            className="flex-1 min-w-0 bg-transparent outline-none text-body-sm text-an-fg-base placeholder:text-an-fg-muted"
          />
        </div>
      </div>

      {/* Filter tabs */}
      <div className="px-3 pb-2 flex flex-wrap gap-1">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`h-6 px-2 rounded-full text-label uppercase tracking-wide transition ${
              filter === f
                ? 'bg-an-accent-subtle text-an-accent'
                : 'bg-an-bg-surface text-an-fg-muted hover:text-an-fg-subtle'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Session list */}
      <nav className="flex-1 overflow-y-auto an-scroll px-2 py-1">
        {visible.length === 0 ? (
          <p className="text-body-sm text-an-fg-muted px-3 py-4">
            {sessions.length === 0 ? 'No chats yet.' : 'No matching chats.'}
          </p>
        ) : (
          <div className="flex flex-col gap-0.5">
            {visible.map((s) => (
              <SessionItem
                key={s.id}
                session={s}
                active={s.id === activeId}
                onSelect={onSelect}
                onRename={onRename}
                onTogglePin={onTogglePin}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
      </nav>

      {/* User footer */}
      <div className="border-t border-an-border p-4 flex items-center gap-2">
        <div className="h-7 w-7 rounded-full bg-an-accent-subtle text-an-accent flex items-center justify-center text-label shrink-0">
          {(email ?? '?').charAt(0).toUpperCase()}
        </div>
        <span className="flex-1 min-w-0 truncate text-body-sm text-an-fg-subtle">
          {email ?? 'Signed in'}
        </span>
        <button
          onClick={onLogout}
          aria-label="Log out"
          className="text-an-fg-muted hover:text-an-fg-base transition"
        >
          <LogOut size={16} strokeWidth={1.5} />
        </button>
      </div>
    </aside>
  )
}
