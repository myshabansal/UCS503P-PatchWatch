import { api, getErrorMessage } from './api'
import type { Project, ProjectDashboardData } from '../types/project'

export type ScanStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled'

export async function fetchProjects(): Promise<Project[]> {
  const { data } = await api.get<Project[]>('/api/v1/dashboard/projects')
  return data
}

export async function fetchProjectDashboard(projectId: string): Promise<ProjectDashboardData> {
  try {
    const { data } = await api.get<ProjectDashboardData>(`/api/v1/dashboard/projects/${projectId}`)
    return data
  } catch (err) {
    throw new Error(getErrorMessage(err, 'Failed to load project'))
  }
}

export async function createProject(name: string, description?: string): Promise<{ id: number }> {
  try {
    const { data } = await api.post<{ id: number }>('/api/v1/projects/', {
      name,
      description: description || null,
    })
    return data
  } catch (err) {
    throw new Error(getErrorMessage(err))
  }
}

/** Upload a package.json / requirements.txt; returns the new scan id. */
export async function uploadScan(projectId: string, file: File): Promise<number> {
  const form = new FormData()
  form.append('file', file)
  try {
    const { data } = await api.post<{ id: number }>(`/api/v1/projects/${projectId}/scans`, form)
    return data.id
  } catch (err) {
    throw new Error(getErrorMessage(err))
  }
}

/** Poll until the background worker finishes the scan (or fails / times out). */
export async function waitForScan(scanId: number, timeoutMs = 120_000): Promise<void> {
  const started = Date.now()
  while (Date.now() - started < timeoutMs) {
    const { data } = await api.get<{ status: ScanStatus; error_message?: string }>(
      `/api/v1/scans/${scanId}`,
    )
    if (data.status === 'completed') return
    if (data.status === 'failed' || data.status === 'cancelled') {
      throw new Error(data.error_message || `Scan ${data.status}`)
    }
    await new Promise((r) => setTimeout(r, 1500))
  }
  throw new Error('Scan is taking too long. Is the Celery worker running?')
}
