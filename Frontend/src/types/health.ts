export interface HealthStatus {
  status: string
  database?: 'connected' | 'unreachable'
  detail?: string
}
