export interface DatabaseStatus {
  status: 'connected' | 'disconnected';
  dialect: string;
  host?: string | null;
  database?: string | null;
  error?: string | null;
}

export interface HealthCheckResponse {
  status: string;
  app_name: string;
  version: string;
  environment: string;
  timestamp: string;
  database: DatabaseStatus;
}
