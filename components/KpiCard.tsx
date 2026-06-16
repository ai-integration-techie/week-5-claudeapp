'use client'

export default function KpiCard({
  label,
  value,
  loading,
}: {
  label: string
  value: string | number | null
  loading?: boolean
}) {
  return (
    <div className="rounded-lg border border-an-border bg-an-bg-surface p-4">
      <div className="text-label uppercase tracking-wide text-an-fg-muted">
        {label}
      </div>
      {loading ? (
        <div className="mt-2 h-7 w-16 rounded bg-an-bg-elevated animate-pulse" />
      ) : (
        <div className="mt-1 text-[26px] leading-tight font-medium text-an-fg-base">
          {value ?? '—'}
        </div>
      )}
    </div>
  )
}
