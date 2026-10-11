// Matches the real backend's GET /health response (app/main.py): {"status": "healthy"}
export interface HealthStatus {
  status: string
}
