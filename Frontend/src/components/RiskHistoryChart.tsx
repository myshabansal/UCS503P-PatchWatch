import type { ScanHistoryPoint } from '../types/project'

// A lightweight inline chart — swap for the project's charting library
// (Section 3 lists one as part of the stack) once more chart types are needed
// in Phase 8. For a single trend line, hand-rolled SVG keeps this dependency-free.
export function RiskHistoryChart({ history }: { history: ScanHistoryPoint[] }) {
  if (history.length === 0) {
    return <p className="text-sm text-slate-400">No scans yet.</p>
  }

  const width = 480
  const height = 120
  const padding = 16
  const maxScore = 100

  const points = history.map((point, index) => {
    const x =
      history.length === 1
        ? width / 2
        : padding + (index / (history.length - 1)) * (width - padding * 2)
    const y = height - padding - (point.riskScore / maxScore) * (height - padding * 2)
    return { x, y, point }
  })

  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
      <line
        x1={padding}
        y1={height - padding}
        x2={width - padding}
        y2={height - padding}
        stroke="#e2e8f0"
      />
      <path d={path} fill="none" stroke="#4338ca" strokeWidth="2" strokeLinecap="round" />
      {points.map(({ x, y, point }) => (
        <g key={point.scanNumber}>
          <circle cx={x} cy={y} r="3.5" fill="#4338ca" />
          <text x={x} y={height - 2} textAnchor="middle" className="fill-slate-400 text-[9px]">
            {point.date}
          </text>
        </g>
      ))}
    </svg>
  )
}
