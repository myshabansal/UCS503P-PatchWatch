import type { Dependency } from '../types/project'
import { LicenseLabel, SeverityBadge, StatusBadge } from './badges'

export function DependencyTable({ dependencies }: { dependencies: Dependency[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead>
          <tr className="text-left text-xs font-medium uppercase tracking-wide text-slate-400">
            <th className="px-4 py-3">Package</th>
            <th className="px-4 py-3">Version</th>
            <th className="px-4 py-3">Latest</th>
            <th className="px-4 py-3">Vulnerabilities</th>
            <th className="px-4 py-3">License</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Risk</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {dependencies.map((dep) => (
            <tr key={dep.id} className="hover:bg-slate-50">
              <td className="px-4 py-3">
                <span className="font-mono font-medium text-slate-900">{dep.name}</span>
                <span className="ml-2 text-xs text-slate-400">{dep.ecosystem}</span>
              </td>
              <td className="px-4 py-3 font-mono text-slate-600">{dep.version}</td>
              <td className="px-4 py-3 font-mono text-slate-600">
                {dep.latestVersion ?? <span className="text-slate-400">—</span>}
              </td>
              <td className="px-4 py-3">
                {dep.highestSeverity ? (
                  <SeverityBadge severity={dep.highestSeverity} />
                ) : (
                  <span className="text-slate-400">None</span>
                )}
              </td>
              <td className="px-4 py-3">
                <LicenseLabel license={dep.license} status={dep.licenseStatus} />
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={dep.status} />
              </td>
              <td className="px-4 py-3 font-mono text-slate-600">{dep.riskScore}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
