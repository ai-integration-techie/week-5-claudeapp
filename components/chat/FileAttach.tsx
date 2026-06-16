'use client'

import { useRef, useState } from 'react'
import { Paperclip, Loader2 } from 'lucide-react'
import { parseFile, ParseError, type ParsedDocument } from '@/lib/parse'

// Holds no document state — parses and hands the result up via onFileLoaded.
export default function FileAttach({
  onFileLoaded,
  onError,
  disabled,
}: {
  onFileLoaded: (doc: ParsedDocument) => void
  onError: (message: string) => void
  disabled?: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [parsing, setParsing] = useState(false)

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    // reset so the same file can be re-selected later
    e.target.value = ''
    if (!file) return

    setParsing(true)
    try {
      const doc = await parseFile(file)
      onFileLoaded(doc)
    } catch (err) {
      onError(
        err instanceof ParseError
          ? err.message
          : 'Could not read this file. Try another document.'
      )
    } finally {
      setParsing(false)
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx"
        onChange={handleChange}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled || parsing}
        aria-label="Attach a document"
        className="h-8 w-8 shrink-0 rounded-md flex items-center justify-center text-an-fg-subtle transition hover:bg-an-bg-elevated hover:text-an-fg-base disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {parsing ? (
          <Loader2 size={18} strokeWidth={1.5} className="animate-spin" />
        ) : (
          <Paperclip size={18} strokeWidth={1.5} />
        )}
      </button>
    </>
  )
}
