'use client'

import { useRef, useState, type ReactNode } from 'react'
import { ArrowUp } from 'lucide-react'

export default function Composer({
  onSend,
  isLoading,
  disabled,
  attachButton,
  fileChip,
  placeholder = 'Ask a question about the contract…',
}: {
  onSend: (text: string) => void
  isLoading?: boolean
  disabled?: boolean
  attachButton?: ReactNode
  fileChip?: ReactNode
  placeholder?: string
}) {
  const [text, setText] = useState('')
  const taRef = useRef<HTMLTextAreaElement>(null)

  const canSend = text.trim().length > 0 && !isLoading && !disabled

  function autoGrow() {
    const el = taRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`
  }

  function submit() {
    if (!canSend) return
    onSend(text.trim())
    setText('')
    if (taRef.current) taRef.current.style.height = 'auto'
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <div className="w-full max-w-[680px] mx-auto px-4 pb-6">
      {fileChip}
      <div className="rounded-[12px] border border-an-border bg-an-bg-surface px-4 py-3 flex items-end gap-2">
        {attachButton}
        <textarea
          ref={taRef}
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            autoGrow()
          }}
          onKeyDown={onKeyDown}
          rows={1}
          placeholder={placeholder}
          className="flex-1 bg-transparent resize-none outline-none text-body text-an-fg-base placeholder:text-an-fg-muted max-h-[200px] an-scroll"
        />
        <button
          type="button"
          onClick={submit}
          disabled={!canSend}
          aria-label="Send"
          className="h-8 w-8 shrink-0 rounded-full bg-an-accent text-white flex items-center justify-center transition duration-150 ease-out hover:bg-an-accent-hover disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ArrowUp size={16} strokeWidth={2} />
        </button>
      </div>
    </div>
  )
}
