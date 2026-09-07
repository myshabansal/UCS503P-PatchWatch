import type { DependencyStatus, LicenseStatus, RiskCategory, Severity } from '../types/project'

const severityStyles: Record<Severity, string> = {
  critical: 'bg-red-50 text-severity-critical',
  high: 'bg-orange-50 text-severity-high',
  moderate: 'bg-amber-50 text-severity-moderate',
  low: 'bg-green-50 text-severity-low',
}

export function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 font-mono text-xs font-medium uppercase tracking-wide ${severityStyles[severity]}`}
    >
      {severity}
    </span>
  )
}

const riskCategoryStyles: Record<RiskCategory, string> = {
  Critical: 'bg-red-50 text-severity-critical',
  High: 'bg-orange-50 text-severity-high',
  Moderate: 'bg-amber-50 text-severity-moderate',
  Low: 'bg-green-50 text-severity-low',
}

export function RiskCategoryBadge({ category }: { category: RiskCategory }) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2.5 py-1 text-sm font-semibold ${riskCategoryStyles[category]}`}
    >
      {category}
    </span>
  )
}

const statusLabels: Record<DependencyStatus, string> = {
  'up-to-date': 'Up to date',
  patch: 'Patch update',
  minor: 'Minor update',
  major: 'Major update',
}

const statusStyles: Record<DependencyStatus, string> = {
  'up-to-date': 'bg-slate-100 text-slate-600',
  patch: 'bg-slate-100 text-slate-600',
  minor: 'bg-amber-50 text-amber-700',
  major: 'bg-orange-50 text-orange-700',
}

export function StatusBadge({ status }: { status: DependencyStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${statusStyles[status]}`}
    >
      {statusLabels[status]}
    </span>
  )
}

const licenseStyles: Record<LicenseStatus, string> = {
  allowed: 'text-slate-600',
  review: 'text-amber-700',
  unknown: 'text-slate-400',
}

export function LicenseLabel({ license, status }: { license: string; status: LicenseStatus }) {
  return <span className={`font-mono text-xs ${licenseStyles[status]}`}>{license}</span>
}
