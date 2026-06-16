'use client'

import { Check, Loader2, Circle, AlertCircle } from 'lucide-react'

// Pipeline stages shown in the right panel (FR-015).
export type ExecStep = 'idle' | 'parsing' | 'sending' | 'waiting' | 'completed' | 'error'

const STEPS: { key: Exclude<ExecStep, 'idle' | 'error'>; label: string }[] = [
  { key: 'parsing', label: 'Parsing document' },
  { key: 'sending', label: 'Sending to AI agent' },
  { key: 'waiting', label: 'Waiting for response' },
  { key: 'completed', label: 'Response received' },
]

const ORDER: Record<string, number> = {
  parsing: 0,
  sending: 1,
  waiting: 2,
  completed: 3,
}

export default function ExecutionSteps({ step }: { step: ExecStep }) {
  if (step === 'idle') {
    return (
      <p className="text-body-sm text-an-fg-muted">
        Execution steps will appear here while the assistant works.
      </p>
    )
  }

  const current = step === 'error' ? -1 : ORDER[step]

  return (
    <ul className="flex flex-col gap-3">
      {STEPS.map((s) => {
        const idx = ORDER[s.key]
        let state: 'done' | 'active' | 'pending' | 'error' = 'pending'
        if (step === 'error' && idx >= 0) {
          state = idx < (current < 0 ? 99 : current) ? 'done' : 'error'
        }
        if (step !== 'error') {
          if (idx < current) state = 'done'
          else if (idx === current) state = 'active'
        }
        // On error, mark the failing step
        const showError = step === 'error' && s.key === 'waiting'

        return (
          <li key={s.key} className="flex items-center gap-2.5">
            {showError ? (
              <AlertCircle size={16} strokeWidth={1.5} className="text-an-error" />
            ) : state === 'done' ? (
              <Check size={16} strokeWidth={1.5} className="text-an-success" />
            ) : state === 'active' ? (
              <Loader2 size={16} strokeWidth={1.5} className="text-an-accent animate-spin" />
            ) : (
              <Circle size={16} strokeWidth={1.5} className="text-an-fg-muted" />
            )}
            <span
              className={`text-body-sm ${
                showError
                  ? 'text-an-error'
                  : state === 'pending'
                    ? 'text-an-fg-muted'
                    : 'text-an-fg-base'
              }`}
            >
              {showError ? 'Request failed' : s.label}
            </span>
          </li>
        )
      })}
    </ul>
  )
}
