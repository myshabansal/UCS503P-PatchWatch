import type { Project, ProjectDashboardData } from '../types/project'

/**
 * Mock data layer.
 *
 * The scanning/risk-engine endpoints (GET /projects, GET /projects/{id}/risk, etc.)
 * don't exist on the backend yet, so the dashboard is built against this instead.
 * Each function mirrors the shape of the eventual API response — once Phase
 * 5–8 land on the backend, swap the body of each function for an `api.get(...)`
 * call; the pages consuming these don't need to change.
 */

const MOCK_LATENCY_MS = 300

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), MOCK_LATENCY_MS))
}

const mockProjects: Project[] = [
  {
    id: 'proj-1',
    name: 'checkout-service',
    description: 'Payments and checkout API',
    riskScore: 72,
    riskCategory: 'High',
    lastScanAt: '2026-09-05T14:20:00Z',
  },
  {
    id: 'proj-2',
    name: 'internal-admin-dashboard',
    description: 'Internal ops tooling',
    riskScore: 31,
    riskCategory: 'Moderate',
    lastScanAt: '2026-09-06T09:00:00Z',
  },
  {
    id: 'proj-3',
    name: 'marketing-site',
    description: undefined,
    riskScore: 12,
    riskCategory: 'Low',
    lastScanAt: '2026-09-01T11:45:00Z',
  },
]

const mockDashboards: Record<string, ProjectDashboardData> = {
  'proj-1': {
    project: mockProjects[0],
    summary: {
      totalDependencies: 84,
      vulnerableDependencies: 9,
      criticalCount: 2,
      highCount: 3,
      outdatedCount: 21,
      licenseWarnings: 1,
    },
    priorityFixes: [
      {
        id: 'fix-1',
        dependencyName: 'lodash',
        reason: 'Critical vulnerability with a fixed version available',
        severity: 'critical',
      },
      {
        id: 'fix-2',
        dependencyName: 'axios',
        reason: 'High-severity SSRF vulnerability',
        severity: 'high',
      },
      {
        id: 'fix-3',
        dependencyName: 'minimist',
        reason: 'Major version outdated, prototype pollution history',
        severity: 'moderate',
      },
    ],
    dependencies: [
      {
        id: 'dep-1',
        name: 'lodash',
        version: '4.17.19',
        latestVersion: '4.17.21',
        ecosystem: 'npm',
        status: 'patch',
        vulnerabilityCount: 2,
        highestSeverity: 'critical',
        license: 'MIT',
        licenseStatus: 'allowed',
        riskScore: 88,
      },
      {
        id: 'dep-2',
        name: 'axios',
        version: '0.21.1',
        latestVersion: '1.7.2',
        ecosystem: 'npm',
        status: 'major',
        vulnerabilityCount: 1,
        highestSeverity: 'high',
        license: 'MIT',
        licenseStatus: 'allowed',
        riskScore: 74,
      },
      {
        id: 'dep-3',
        name: 'express',
        version: '4.18.2',
        latestVersion: '4.19.2',
        ecosystem: 'npm',
        status: 'minor',
        vulnerabilityCount: 0,
        highestSeverity: null,
        license: 'MIT',
        licenseStatus: 'allowed',
        riskScore: 12,
      },
      {
        id: 'dep-4',
        name: 'minimist',
        version: '0.0.8',
        latestVersion: '1.2.8',
        ecosystem: 'npm',
        status: 'major',
        vulnerabilityCount: 1,
        highestSeverity: 'moderate',
        license: 'MIT',
        licenseStatus: 'allowed',
        riskScore: 52,
      },
      {
        id: 'dep-5',
        name: 'flask-restrictedpython',
        version: '2.1',
        latestVersion: null,
        ecosystem: 'pypi',
        status: 'up-to-date',
        vulnerabilityCount: 0,
        highestSeverity: null,
        license: 'Unknown',
        licenseStatus: 'unknown',
        riskScore: 18,
      },
    ],
    scanHistory: [
      { scanNumber: 1, date: '2026-08-01', riskScore: 32 },
      { scanNumber: 2, date: '2026-08-15', riskScore: 51 },
      { scanNumber: 3, date: '2026-09-05', riskScore: 72 },
    ],
  },
}

const SCANNED_DASHBOARDS_KEY = 'patchwatch_scanned_dashboards'

function readScannedDashboards(): Record<string, ProjectDashboardData> {
  try {
    const raw = localStorage.getItem(SCANNED_DASHBOARDS_KEY)
    return raw ? (JSON.parse(raw) as Record<string, ProjectDashboardData>) : {}
  } catch {
    return {}
  }
}

function writeScannedDashboard(projectId: string, dashboard: ProjectDashboardData) {
  const all = readScannedDashboards()
  all[projectId] = dashboard
  try {
    localStorage.setItem(SCANNED_DASHBOARDS_KEY, JSON.stringify(all))
  } catch {
    // best-effort only — a full dashboard still renders from in-memory state this session
  }
}

export async function fetchProjects(): Promise<Project[]> {
  // Real implementation (Phase 3): const { data } = await api.get('/projects'); return data
  const scanned = readScannedDashboards()
  const merged = mockProjects.map((p) => scanned[p.id]?.project ?? p)
  const createdOnly = Object.values(scanned)
    .map((d) => d.project)
    .filter((p) => !mockProjects.some((mp) => mp.id === p.id))
  return delay([...merged, ...createdOnly])
}

export async function fetchProjectDashboard(projectId: string): Promise<ProjectDashboardData> {
  // Real implementation (Phase 7/8): const { data } = await api.get(`/projects/${projectId}/risk`)
  const scanned = readScannedDashboards()[projectId]
  if (scanned) return delay(scanned)

  const dashboard = mockDashboards[projectId]
  if (!dashboard) throw new Error('Project not found')
  return delay(dashboard)
}

export async function createProject(payload: {
  name: string
  description?: string
}): Promise<Project> {
  // Real implementation (Phase 3): const { data } = await api.post('/projects', payload)
  const project: Project = {
    id: crypto.randomUUID(),
    name: payload.name,
    description: payload.description || undefined,
    riskScore: 0,
    riskCategory: 'Low',
    lastScanAt: null,
  }
  const emptyDashboard: ProjectDashboardData = {
    project,
    summary: {
      totalDependencies: 0,
      vulnerableDependencies: 0,
      criticalCount: 0,
      highCount: 0,
      outdatedCount: null,
      licenseWarnings: null,
    },
    priorityFixes: [],
    dependencies: [],
    scanHistory: [],
  }
  writeScannedDashboard(project.id, emptyDashboard)
  return delay(project)
}

/** Persists a dashboard built from a real backend scan (see utils/mapScanToDashboard.ts). */
export async function saveScannedDashboard(
  projectId: string,
  dashboard: ProjectDashboardData,
): Promise<void> {
  writeScannedDashboard(projectId, dashboard)
}

export function getPriorScanHistory(projectId: string): ProjectDashboardData['scanHistory'] {
  return readScannedDashboards()[projectId]?.scanHistory ?? []
}
