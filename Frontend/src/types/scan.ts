// Mirrors the backend's actual response shapes (backend/app/main.py `serialize_scan`).
// Backend severities are UPPERCASE strings; the backend currently only scans
// package.json (npm) — no license info, latest-version lookup, or outdated
// detection yet, so those fields don't exist here.

export type BackendSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN'

export interface ScanFinding {
  package: string
  version: string
  id: string
  summary: string
  severity: BackendSeverity
  fixed_versions: string[]
  aliases: string[]
}

export interface ScanError {
  package: string
  error: string
}

export interface SeverityCounts {
  critical: number
  high: number
  medium: number
  low: number
}

export interface ScanSummary {
  id: number
  filename: string
  created_at: string
  total_deps: number
  skipped_deps: number
  vulnerable_deps: number
  severity_counts: SeverityCounts
}

export interface ScanDetail extends ScanSummary {
  findings: ScanFinding[]
  errors?: ScanError[]
}
