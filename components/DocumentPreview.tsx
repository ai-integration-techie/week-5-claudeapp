'use client'

import type { ParsedDocument } from '@/lib/parse'

const PREVIEW_TRUNCATE = 4000

export default function DocumentPreview({ doc }: { doc: ParsedDocument }) {
  const isPdf = doc.fileType === 'application/pdf'

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-2 border-b border-an-border">
        <p className="text-body-sm text-an-fg-base truncate" title={doc.filename}>
          {doc.filename}
        </p>
      </div>

      <div className="flex-1 min-h-0">
        {isPdf && doc.previewUrl ? (
          <iframe
            src={doc.previewUrl}
            title={doc.filename}
            className="w-full h-full border-0 bg-white"
          />
        ) : (
          <pre className="h-full overflow-auto an-scroll p-4 text-mono font-mono text-an-fg-subtle whitespace-pre-wrap break-words">
            {doc.text.slice(0, PREVIEW_TRUNCATE)}
            {doc.text.length > PREVIEW_TRUNCATE && '\n\n… (preview truncated)'}
          </pre>
        )}
      </div>
    </div>
  )
}
