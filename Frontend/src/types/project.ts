export type Severity = 'critical' | 'high' | 'moderate' | 'low'
export type RiskCategory = 'Low' | 'Moderate' | 'High' | 'Critical'
export type DependencyStatus = 'up-to-date' | 'patch' | 'minor' | 'major' | 'unknown'
export type LicenseStatus = 'allowed' | 'review' | 'unknown'

export interface Project {
  id: string
  name: string
  description?: string
  riskScore: number
  riskCategory: RiskCategory
  lastScanAt: string | null
}

export interface Dependency {
  id: string
  name: string
  version: string
  latestVersion: string | null
  ecosystem: 'npm' | 'pypi'
  status: DependencyStatus
  vulnerabilityCount: number
  highestSeverity: Severity | null
  license: string
  licenseStatus: LicenseStatus
  riskScore: number
}

export interface PriorityFix {
  id: string
  dependencyName: string
  reason: string
  severity: Severity
}

export interface ScanHistoryPoint {
  scanNumber: number
  date: string
  riskScore: number
}

export interface ProjectDashboardData {
  project: Project
  summary: {
    totalDependencies: number
    vulnerableDependencies: number
    criticalCount: number
    highCount: number
    // Not available from the backend yet (no outdated-version check, no
    // license policy engine) — null rather than a fabricated 0.
    outdatedCount: number | null
    licenseWarnings: number | null
  }
  priorityFixes: PriorityFix[]
  dependencies: Dependency[]
  scanHistory: ScanHistoryPoint[]
}
