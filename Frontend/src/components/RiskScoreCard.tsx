import type { RiskCategory } from '../types/project'
import { RiskCategoryBadge } from './badges'

const categoryRingColor: Record<RiskCategory, string> = {
  Low: '#16a34a',
  Moderate: '#d97706',
  High: '#ea580c',
  Critical: '#dc2626',
}

export function RiskScoreCard({ score, category }: { score: number; category: RiskCategory }) {
  const circumference = 2 * Math.PI * 54
  const offset = circumference * (1 - score / 100)

  return (
    <div className="flex items-center gap-6 rounded-xl border border-slate-200 bg-white p-6">
      <div className="relative h-32 w-32 shrink-0">
        <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
          <circle cx="60" cy="60" r="54" fill="none" stroke="#e2e8f0" strokeWidth="10" />
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke={categoryRingColor[category]}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-3xl font-semibold text-slate-900">{score}</span>
          <span className="text-xs text-slate-400">/ 100</span>
        </div>
      </div>

      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
          PatchWatch risk
        </p>
        <div className="mt-2">
          <RiskCategoryBadge category={category} />
        </div>
        <p className="mt-3 max-w-[16rem] text-sm text-slate-500">
          A PatchWatch-specific score based on vulnerability severity, staleness, and license
          policy — not an industry-standard rating.
        </p>
      </div>
    </div>
  )
}
