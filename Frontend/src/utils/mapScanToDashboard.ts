import type { Dependency, PriorityFix, ProjectDashboardData, Severity } from '../types/project'
import type { BackendSeverity, ScanDetail } from '../types/scan'

/**
 * Maps a real backend ScanDetail (backend/app/main.py `serialize_scan`) onto
 * the dashboard's display shape. The backend only returns *findings*
 * (vulnerable packages) plus a total count — it doesn't return every scanned
 * dependency's name/version, so the dependency table below can only show
 * packages that have at least one finding. Non-vulnerable dependencies are
 * summarized as a count, never invented as rows.
 *
 * Fields the backend doesn't provide yet (license, latest version, outdated
 * status, a 0–100 risk score) are left null/unknown rather than faked.
 */

const SEVERITY_RANK: Record<BackendSeverity, number> = {
  CRITICAL: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
  UNKNOWN: 0,
}

function toFrontendSeverity(severity: BackendSeverity): Severity | null {
  switch (severity) {
    case 'CRITICAL':
      return 'critical'
    case 'HIGH':
      return 'high'
    case 'MEDIUM':
      return 'moderate'
    case 'LOW':
      return 'low'
    default:
      return null
  }
}

// Local heuristic only — the backend has no risk-scoring engine yet. Mirrors
// the categories in the project brief (0-24 Low, 25-49 Moderate, 50-74 High,
// 75-100 Critical) so the UI has *something* to show, clearly documented as
// an approximation rather than attributed to the backend.
const SEVERITY_POINTS: Record<BackendSeverity, number> = {
  CRITICAL: 90,
  HIGH: 70,
  MEDIUM: 45,
  LOW: 20,
  UNKNOWN: 10,
}

function riskCategoryFor(score: number): ProjectDashboardData['project']['riskCategory'] {
  if (score >= 75) return 'Critical'
  if (score >= 50) return 'High'
  if (score >= 25) return 'Moderate'
  return 'Low'
}

export function mapScanToDependencies(scan: ScanDetail): Dependency[] {
  const byPackage = new Map<string, Dependency>()
  // Tracked alongside `byPackage` because Dependency.highestSeverity stores the
  // frontend (lowercase) severity, but merging needs the backend rank to compare.
  const highestBackendSeverity = new Map<string, BackendSeverity>()

  for (const finding of scan.findings) {
    const key = `${finding.package}@${finding.version}`
    const existing = byPackage.get(key)

    if (!existing) {
      byPackage.set(key, {
        id: key,
        name: finding.package,
        version: finding.version,
        latestVersion: null, // not available — backend doesn't check for updates yet
        ecosystem: 'npm', // backend currently only scans package.json
        status: 'unknown', // outdated detection not implemented yet
        vulnerabilityCount: 1,
        highestSeverity: toFrontendSeverity(finding.severity),
        license: 'Unknown',
        licenseStatus: 'unknown', // license analysis not implemented yet
        riskScore: SEVERITY_POINTS[finding.severity],
      })
      highestBackendSeverity.set(key, finding.severity)
    } else {
      existing.vulnerabilityCount += 1
      const currentHighest = highestBackendSeverity.get(key) ?? 'UNKNOWN'
      if (SEVERITY_RANK[finding.severity] > SEVERITY_RANK[currentHighest]) {
        existing.highestSeverity = toFrontendSeverity(finding.severity)
        highestBackendSeverity.set(key, finding.severity)
      }
      existing.riskScore = Math.max(existing.riskScore, SEVERITY_POINTS[finding.severity])
    }
  }

  return [...byPackage.values()].sort((a, b) => b.riskScore - a.riskScore)
}

export function mapScanToPriorityFixes(scan: ScanDetail): PriorityFix[] {
  return [...scan.findings]
    .sort((a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity])
    .slice(0, 3)
    .map((finding) => ({
      id: `${finding.package}-${finding.id}`,
      dependencyName: finding.package,
      reason:
        finding.fixed_versions.length > 0
          ? `${finding.summary} — fixed in ${finding.fixed_versions[0]}`
          : finding.summary,
      severity: toFrontendSeverity(finding.severity) ?? 'low',
    }))
}

export function computeOverallRisk(scan: ScanDetail): { score: number; category: ReturnType<typeof riskCategoryFor> } {
  if (scan.findings.length === 0) {
    return { score: 0, category: 'Low' }
  }
  const points = scan.findings.map((f) => SEVERITY_POINTS[f.severity])
  const score = Math.round(points.reduce((sum, p) => sum + p, 0) / points.length)
  return { score, category: riskCategoryFor(score) }
}

export function mapScanToDashboard(
  projectId: string,
  projectName: string,
  projectDescription: string | undefined,
  scan: ScanDetail,
  priorScanHistory: ProjectDashboardData['scanHistory'],
): ProjectDashboardData {
  const { score, category } = computeOverallRisk(scan)
  const dependencies = mapScanToDependencies(scan)
  const priorityFixes = mapScanToPriorityFixes(scan)

  const nextScanNumber = priorScanHistory.length + 1
  const scanHistory = [
    ...priorScanHistory,
    { scanNumber: nextScanNumber, date: scan.created_at.slice(0, 10), riskScore: score },
  ]

  return {
    project: {
      id: projectId,
      name: projectName,
      description: projectDescription,
      riskScore: score,
      riskCategory: category,
      lastScanAt: scan.created_at,
    },
    summary: {
      totalDependencies: scan.total_deps,
      vulnerableDependencies: scan.vulnerable_deps,
      criticalCount: scan.severity_counts.critical,
      highCount: scan.severity_counts.high,
      outdatedCount: null, // not implemented on the backend yet
      licenseWarnings: null, // not implemented on the backend yet
    },
    priorityFixes,
    dependencies,
    scanHistory,
  }
}
