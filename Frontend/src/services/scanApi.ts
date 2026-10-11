import { api } from './api'
import type { ScanDetail, ScanSummary } from '../types/scan'

/**
 * Real backend calls — this talks to the actual FastAPI service your
 * teammate built (backend/app/main.py), not a mock. That backend currently:
 *   - only parses package.json (no package-lock.json / requirements.txt yet)
 *   - has no concept of users or projects — every scan is global
 *   - returns OSV vulnerability findings only — no license info, no
 *     latest-version / outdated detection, no 0–100 risk score
 * Projects/auth stay mocked in the UI until those land on the backend; this
 * file is only for the parts that are real today.
 */

export async function uploadScan(file: File): Promise<ScanDetail> {
  const formData = new FormData()
  formData.append('file', file)
  const { data } = await api.post<ScanDetail>('/scan', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000, // OSV lookups for every dependency can take a while
  })
  return data
}

export async function listScans(): Promise<ScanSummary[]> {
  const { data } = await api.get<ScanSummary[]>('/scans')
  return data
}

export async function getScan(scanId: number): Promise<ScanDetail> {
  const { data } = await api.get<ScanDetail>(`/scans/${scanId}`)
  return data
}

export async function deleteScan(scanId: number): Promise<void> {
  await api.delete(`/scans/${scanId}`)
}
