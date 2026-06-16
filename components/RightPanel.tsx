'use client'

import { type ReactNode } from 'react'
import ExecutionSteps, { type ExecStep } from './ExecutionSteps'

export default function RightPanel({
  execStep,
  previewSlot,
}: {
  execStep: ExecStep
  previewSlot?: ReactNode
}) {
  return (
    <aside className="w-[304px] shrink-0 bg-an-bg-subtle border-l border-an-border flex flex-col">
      {/* Preview section */}
      <div className="flex-1 min-h-0 border-b border-an-border flex flex-col">
        <div className="px-4 py-3 border-b border-an-border">
          <h2 className="text-label uppercase tracking-wide text-an-fg-muted">
            Document
          </h2>
        </div>
        <div className="flex-1 min-h-0 overflow-hidden">
          {previewSlot ?? (
            <div className="h-full flex items-center justify-center px-6">
              <p className="text-body-sm text-an-fg-muted text-center">
                No document attached. Use the attach button in the composer.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Execution steps */}
      <div className="p-4 max-h-[40%] overflow-y-auto an-scroll">
        <h2 className="text-label uppercase tracking-wide text-an-fg-muted mb-3">
          Execution
        </h2>
        <ExecutionSteps step={execStep} />
      </div>
    </aside>
  )
}
