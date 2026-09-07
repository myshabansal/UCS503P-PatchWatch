export function StatCard({
  label,
  value,
  tone = 'default',
}: {
  label: string
  value: number
  tone?: 'default' | 'critical' | 'high'
}) {
  const valueTone =
    tone === 'critical'
      ? 'text-severity-critical'
      : tone === 'high'
        ? 'text-severity-high'
        : 'text-slate-900'

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className={`mt-1.5 font-mono text-2xl font-semibold ${valueTone}`}>{value}</p>
    </div>
  )
}
