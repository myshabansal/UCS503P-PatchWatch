import axios from 'axios';
import type { HealthCheckResponse } from '../types/health';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Attach Authorization Bearer token automatically if available
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('patchwatch_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 Unauthorized globally
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If unauthorized on protected calls, remove expired token
      if (localStorage.getItem('patchwatch_token')) {
        localStorage.removeItem('patchwatch_token');
      }
    }
    return Promise.reject(error);
  }
);

export const checkBackendHealth = async (): Promise<{
  data?: HealthCheckResponse;
  latencyMs: number;
  error?: string;
}> => {
  const startTime = performance.now();
  try {
    const response = await apiClient.get<HealthCheckResponse>('/health');
    const latencyMs = Math.round(performance.now() - startTime);
    return { data: response.data, latencyMs };
  } catch (err: unknown) {
    const latencyMs = Math.round(performance.now() - startTime);
    if (axios.isAxiosError(err)) {
      return {
        latencyMs,
        error: err.response?.data?.detail || err.response?.data?.message || err.message || 'Connection failed',
      };
    }
    return { latencyMs, error: 'Unknown connection error' };
  }
};
