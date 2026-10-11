import { useEffect, useState } from 'react'
import { api } from '../services/api'
import type { HealthStatus } from '../types/health'

type ConnectionState = 'loading' | 'connected' | 'error'

// Note: the real backend (app/main.py) only exposes GET /health — there's no
// separate /health/db check, since it isn't using Postgres yet (see the
// backend-integration note on the dashboard for the full story).
export function useBackendHealth() {
  const [state, setState] = useState<ConnectionState>('loading')
  const [apiHealth, setApiHealth] = useState<HealthStatus | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function checkHealth() {
      try {
        const res = await api.get<HealthStatus>('/health')
        if (cancelled) return
        setApiHealth(res.data)
        setState('connected')
      } catch (err) {
        if (cancelled) return
        setErrorMessage(err instanceof Error ? err.message : 'Unknown error')
        setState('error')
      }
    }

    checkHealth()
    return () => {
      cancelled = true
    }
  }, [])

  return { state, apiHealth, errorMessage }
}
