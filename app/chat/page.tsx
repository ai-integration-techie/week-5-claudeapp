'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuthGuard } from '@/lib/useAuthGuard'
import { apiFetch } from '@/lib/api'
import { clearSession, getUserEmail } from '@/lib/session'
import Sidebar from '@/components/Sidebar'
import RightPanel from '@/components/RightPanel'
import DocumentPreview from '@/components/DocumentPreview'
import MessageList from '@/components/chat/MessageList'
import Composer from '@/components/chat/Composer'
import FileAttach from '@/components/chat/FileAttach'
import FeedbackForm from '@/components/FeedbackForm'
import type { ChatMessage } from '@/components/chat/MessageBubble'
import type { ExecStep } from '@/components/ExecutionSteps'
import type { ParsedDocument } from '@/lib/parse'
import { X } from 'lucide-react'
import type { Session } from '@/lib/types'

function ChatWorkspace() {
  const userId = useAuthGuard()
  const router = useRouter()
  const params = useSearchParams()
  const sessionParam = params.get('session')

  const [sessions, setSessions] = useState<Session[]>([])
  const [activeId, setActiveId] = useState<string | null>(sessionParam)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [execStep, setExecStep] = useState<ExecStep>('idle')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [doc, setDoc] = useState<ParsedDocument | null>(null)

  const email = typeof window !== 'undefined' ? getUserEmail() : null

  const loadSessions = useCallback(async () => {
    const res = await apiFetch('/api/sessions')
    if (res.ok) {
      const data = await res.json()
      setSessions(data.sessions)
    }
  }, [])

  useEffect(() => {
    if (userId) loadSessions()
  }, [userId, loadSessions])

  // Load history when the active session changes (clear stale first — FR-028)
  useEffect(() => {
    if (!userId || !activeId) {
      setMessages([])
      return
    }
    let active = true
    setMessages([])
    setLoadingMessages(true)
    setExecStep('idle')
    // Document is session-scoped and not reloaded on reopen (FR-029)
    setDoc((prev) => {
      if (prev?.previewUrl) URL.revokeObjectURL(prev.previewUrl)
      return null
    })
    ;(async () => {
      try {
        const res = await apiFetch(`/api/messages?sessionId=${activeId}`)
        const data = await res.json()
        if (!active) return
        if (res.ok) setMessages(data.messages)
        else setError(data.error ?? 'Could not load conversation.')
      } catch {
        if (active) setError('Network error loading conversation.')
      } finally {
        if (active) setLoadingMessages(false)
      }
    })()
    return () => {
      active = false
    }
  }, [userId, activeId])

  async function handleNewChat() {
    const res = await apiFetch('/api/sessions', { method: 'POST' })
    if (res.ok) {
      const data = await res.json()
      await loadSessions()
      selectSession(data.session.id)
    }
  }

  function selectSession(id: string) {
    setActiveId(id)
    router.replace(`/chat?session=${id}`)
  }

  function handleLogout() {
    clearSession()
    router.replace('/login')
  }

  async function handleRename(id: string, title: string) {
    setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, title } : s)))
    await apiFetch(`/api/sessions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ title }),
    })
  }

  async function handleTogglePin(id: string, pinned: boolean) {
    setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, pinned } : s)))
    await apiFetch(`/api/sessions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ pinned }),
    })
    loadSessions() // re-sort: pinned first
  }

  async function handleDelete(id: string) {
    if (
      !window.confirm(
        'Delete this chat? This permanently removes its messages and feedback.'
      )
    ) {
      return
    }
    await apiFetch(`/api/sessions/${id}`, { method: 'DELETE' })
    if (activeId === id) {
      setActiveId(null)
      router.replace('/chat')
    }
    loadSessions()
  }

  function handleFileLoaded(newDoc: ParsedDocument) {
    setError(null)
    setDoc((prev) => {
      if (prev?.previewUrl) URL.revokeObjectURL(prev.previewUrl)
      return newDoc
    })
  }

  function removeFile() {
    setDoc((prev) => {
      if (prev?.previewUrl) URL.revokeObjectURL(prev.previewUrl)
      return null
    })
  }

  async function sendMessage(text: string) {
    if (!activeId || sending) return
    if (!doc) {
      setError('Attach a PDF or DOCX contract before asking a question.')
      return
    }
    setError(null)
    const now = new Date().toISOString()
    const tempUser: ChatMessage = {
      id: `optimistic-${Date.now()}`,
      role: 'user',
      content: text,
      created_at: now,
    }
    const pendingId = `pending-${Date.now()}`
    const tempAssistant: ChatMessage = {
      id: pendingId,
      role: 'assistant',
      content: '',
      created_at: now,
      pending: true,
    }
    setMessages((prev) => [...prev, tempUser, tempAssistant])
    setSending(true)
    setExecStep('sending')

    try {
      // The /api/chat route persists both the user and assistant messages.
      const res = await apiFetch('/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          sessionId: activeId,
          contractText: doc.text,
          userMessage: text,
        }),
      })
      setExecStep('waiting')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'The assistant could not respond.')

      setExecStep('completed')
      const completedAt = new Date().toISOString()
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id === tempUser.id && data.userMessageId) {
            return { ...m, id: data.userMessageId }
          }
          if (m.id === pendingId) {
            return {
              id: data.assistantMessageId,
              role: 'assistant',
              content: data.assistantMessage,
              created_at: completedAt,
            }
          }
          return m
        })
      )
      loadSessions()
    } catch (e) {
      setExecStep('error')
      setMessages((prev) => prev.filter((m) => m.id !== pendingId))
      setError(e instanceof Error ? e.message : 'Something went wrong.')
    } finally {
      setSending(false)
    }
  }

  if (!userId) return null

  return (
    <div className="h-screen flex overflow-hidden">
      <Sidebar
        sessions={sessions}
        activeId={activeId}
        email={email}
        onNewChat={handleNewChat}
        onSelect={selectSession}
        onLogout={handleLogout}
        onRename={handleRename}
        onTogglePin={handleTogglePin}
        onDelete={handleDelete}
      />

      {/* Center */}
      <main className="flex-1 min-w-0 flex flex-col bg-an-bg-base">
        <div className="h-12 shrink-0 border-b border-an-border flex items-center px-6">
          <span className="text-body-sm text-an-fg-subtle">
            {activeId ? 'Conversation' : 'Select or start a chat'}
          </span>
        </div>

        {error && (
          <div className="px-6 py-2 text-body-sm text-an-error border-b border-an-border">
            {error}
          </div>
        )}

        <MessageList
          messages={messages}
          loading={loadingMessages}
          renderAfter={(m) =>
            m.role === 'assistant' &&
            !m.pending &&
            !m.id.startsWith('pending-') &&
            activeId ? (
              <FeedbackForm sessionId={activeId} messageId={m.id} />
            ) : null
          }
        />

        <Composer
          onSend={sendMessage}
          isLoading={sending}
          disabled={!activeId}
          attachButton={
            <FileAttach
              onFileLoaded={handleFileLoaded}
              onError={setError}
              disabled={!activeId}
            />
          }
          fileChip={
            doc ? (
              <div className="mb-2 inline-flex items-center gap-2 rounded-md border border-an-border bg-an-bg-surface px-3 h-7">
                <span className="text-body-sm text-an-fg-subtle truncate max-w-[280px]">
                  {doc.filename}
                </span>
                <button
                  onClick={removeFile}
                  aria-label="Remove document"
                  className="text-an-fg-muted hover:text-an-fg-base transition"
                >
                  <X size={14} strokeWidth={1.5} />
                </button>
              </div>
            ) : null
          }
        />
        <p className="text-caption text-an-fg-muted text-center pb-3 px-4">
          AI-generated analysis only. Always consult a qualified professional
          before acting on the findings.
        </p>
      </main>

      <RightPanel
        execStep={execStep}
        previewSlot={doc ? <DocumentPreview doc={doc} /> : undefined}
      />
    </div>
  )
}

export default function ChatPage() {
  return (
    <Suspense fallback={null}>
      <ChatWorkspace />
    </Suspense>
  )
}
