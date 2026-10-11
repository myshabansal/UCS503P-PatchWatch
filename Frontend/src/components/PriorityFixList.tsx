import type { PriorityFix } from '../types/project'
import { SeverityBadge } from './badges'

export function PriorityFixList({ fixes }: { fixes: PriorityFix[] }) {
  if (fixes.length === 0) {
    return <p className="text-sm text-slate-400">No priority fixes — nice work.</p>
  }

  return (
    <ol className="space-y-3">
      {fixes.map((fix, index) => (
        <li key={fix.id} className="flex items-start gap-3">
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 font-mono text-[11px] font-medium text-slate-500">
            {index + 1}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="truncate font-mono text-sm font-medium text-slate-900">
                {fix.dependencyName}
              </span>
              <SeverityBadge severity={fix.severity} />
            </div>
            <p className="mt-0.5 text-sm text-slate-500">{fix.reason}</p>
          </div>
        </li>
      ))}
    </ol>
  )
}
