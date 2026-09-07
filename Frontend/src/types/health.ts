export interface HealthStatus {
  status: 'ok' | 'error'
  database?: 'connected' | 'unreachable'
  detail?: string
}
