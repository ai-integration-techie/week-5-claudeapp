'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Circle,
  Loader2,
  CheckCircle2,
  AlertCircle,
  MoreHorizontal,
  Pin,
  PinOff,
  Pencil,
  Trash2,
} from 'lucide-react'
import { formatRelative } from '@/lib/format'
import type { Session, SessionStatus } from '@/lib/types'

function StatusIcon({ status }: { status: SessionStatus }) {
  switch (status) {
    case 'processing':
      return <Loader2 size={14} strokeWidth={1.5} className="text-an-accent animate-spin" />
    case 'completed':
      return <CheckCircle2 size={14} strokeWidth={1.5} className="text-an-success" />
    case 'error':
      return <AlertCircle size={14} strokeWidth={1.5} className="text-an-error" />
    default:
      return <Circle size={14} strokeWidth={1.5} className="text-an-fg-muted" />
  }
}

export default function SessionItem({
  session,
  active,
  onSelect,
  onRename,
  onTogglePin,
  onDelete,
}: {
  session: Session
  active: boolean
  onSelect: (id: string) => void
  onRename: (id: string, title: string) => void
  onTogglePin: (id: string, pinned: boolean) => void
  onDelete: (id: string) => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(session.title)
  const menuRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [menuOpen])

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  function commitRename() {
    const next = draft.trim()
    if (next && next !== session.title) onRename(session.id, next)
    else setDraft(session.title)
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="h-9 px-3 rounded-md bg-an-bg-elevated flex items-center">
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitRename}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitRename()
            if (e.key === 'Escape') {
              setDraft(session.title)
              setEditing(false)
            }
          }}
          className="flex-1 min-w-0 bg-transparent outline-none text-body-sm text-an-fg-base"
        />
      </div>
    )
  }

  return (
    <div
      className={`group relative h-9 px-3 rounded-md flex items-center gap-2 transition ${
        active
          ? 'bg-an-bg-elevated text-an-fg-base'
          : 'text-an-fg-subtle hover:bg-an-bg-surface hover:text-an-fg-base'
      }`}
    >
      <button
        onClick={() => onSelect(session.id)}
        className="flex-1 min-w-0 flex items-center gap-2 text-left"
      >
        <span className="shrink-0">
          <StatusIcon status={session.status} />
        </span>
        <span className="flex-1 min-w-0 truncate text-body-sm">{session.title}</span>
        {session.pinned && (
          <Pin size={11} strokeWidth={1.5} className="shrink-0 text-an-accent" />
        )}
      </button>

      <span className="text-caption text-an-fg-muted shrink-0 group-hover:hidden">
        {formatRelative(session.updated_at)}
      </span>

      <button
        onClick={() => setMenuOpen((o) => !o)}
        aria-label="Session options"
        className="hidden group-hover:flex text-an-fg-muted hover:text-an-fg-base shrink-0"
      >
        <MoreHorizontal size={16} strokeWidth={1.5} />
      </button>

      {menuOpen && (
        <div
          ref={menuRef}
          className="absolute right-2 top-9 z-20 w-40 rounded-md border border-an-border bg-an-bg-elevated py-1 shadow-lg an-fade-in"
        >
          <button
            onClick={() => {
              onTogglePin(session.id, !session.pinned)
              setMenuOpen(false)
            }}
            className="w-full px-3 py-1.5 flex items-center gap-2 text-body-sm text-an-fg-base hover:bg-an-bg-surface"
          >
            {session.pinned ? (
              <PinOff size={14} strokeWidth={1.5} />
            ) : (
              <Pin size={14} strokeWidth={1.5} />
            )}
            {session.pinned ? 'Unpin' : 'Pin'}
          </button>
          <button
            onClick={() => {
              setDraft(session.title)
              setEditing(true)
              setMenuOpen(false)
            }}
            className="w-full px-3 py-1.5 flex items-center gap-2 text-body-sm text-an-fg-base hover:bg-an-bg-surface"
          >
            <Pencil size={14} strokeWidth={1.5} />
            Rename
          </button>
          <button
            onClick={() => {
              onDelete(session.id)
              setMenuOpen(false)
            }}
            className="w-full px-3 py-1.5 flex items-center gap-2 text-body-sm text-an-error hover:bg-an-bg-surface"
          >
            <Trash2 size={14} strokeWidth={1.5} />
            Delete
          </button>
        </div>
      )}
    </div>
  )
}
