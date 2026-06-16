'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import MessageBubble, { type ChatMessage } from './MessageBubble'

export default function MessageList({
  messages,
  loading,
  emptyHint,
  renderAfter,
}: {
  messages: ChatMessage[]
  loading?: boolean
  emptyHint?: string
  renderAfter?: (message: ChatMessage) => ReactNode
}) {
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <span className="text-body-sm text-an-fg-muted">Loading conversation…</span>
      </div>
    )
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center px-6">
        <p className="text-body text-an-fg-muted text-center max-w-[420px]">
          {emptyHint ?? 'Attach a contract and ask a question to get started.'}
        </p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto an-scroll">
      <div className="max-w-[680px] mx-auto w-full px-4 py-6 flex flex-col gap-6">
        {messages.map((m) => (
          <div key={m.id} className="flex flex-col">
            <MessageBubble message={m} />
            {renderAfter?.(m)}
          </div>
        ))}
        <div ref={endRef} />
      </div>
    </div>
  )
}
