export function StatCard({
  label,
  value,
  tone = 'default',
  unavailableHint,
}: {
  label: string
  value: number | null | undefined
  tone?: 'default' | 'critical' | 'high'
  /** Shown instead of a dash title when `value` is null/undefined, e.g. "not available yet". */
  unavailableHint?: string
}) {
  const valueTone =
    tone === 'critical'
      ? 'text-severity-critical'
      : tone === 'high'
        ? 'text-severity-high'
        : 'text-slate-900'

  const isUnavailable = value === null || value === undefined

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p
        className={`mt-1.5 font-mono text-2xl font-semibold ${isUnavailable ? 'text-slate-300' : valueTone}`}
        title={isUnavailable ? unavailableHint : undefined}
      >
        {isUnavailable ? '—' : value}
      </p>
    </div>
  )
}
