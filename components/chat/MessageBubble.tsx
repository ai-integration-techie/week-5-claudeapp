'use client'

import { formatMessageTime } from '@/lib/format'
import type { MessageRole } from '@/lib/types'

export interface ChatMessage {
  id: string
  role: MessageRole
  content: string
  created_at: string
  pending?: boolean
}

export default function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'

  if (isUser) {
    return (
      <div className="flex flex-col items-end an-fade-in">
        <div className="max-w-[75%] rounded-[12px_12px_4px_12px] border border-[rgba(217,119,87,0.20)] bg-an-accent-subtle px-4 py-3">
          <p className="text-body text-an-fg-base whitespace-pre-wrap break-words">
            {message.content}
          </p>
        </div>
        <span className="text-caption text-an-fg-muted mt-1 mr-1">
          {formatMessageTime(message.created_at)}
        </span>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-start an-fade-in">
      <div className="flex gap-2.5 max-w-full">
        <span className="mt-1.5 h-2 w-2 rounded-full bg-an-accent shrink-0" />
        <div className="min-w-0">
          <p
            className={`text-body whitespace-pre-wrap break-words ${
              message.pending ? 'text-an-fg-subtle' : 'text-an-fg-base'
            }`}
          >
            {message.content || (message.pending ? 'Thinking…' : '')}
          </p>
          {!message.pending && (
            <span className="block text-caption text-an-fg-muted mt-1">
              {formatMessageTime(message.created_at)}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
