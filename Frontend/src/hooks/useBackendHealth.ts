import { useEffect, useState } from 'react'
import { api } from '../services/api'
import type { HealthStatus } from '../types/health'

type ConnectionState = 'loading' | 'connected' | 'error'

export function useBackendHealth() {
  const [state, setState] = useState<ConnectionState>('loading')
  const [apiHealth, setApiHealth] = useState<HealthStatus | null>(null)
  const [dbHealth, setDbHealth] = useState<HealthStatus | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function checkHealth() {
      try {
        const [apiRes, dbRes] = await Promise.all([
          api.get<HealthStatus>('/health'),
          api.get<HealthStatus>('/health/db'),
        ])
        if (cancelled) return
        setApiHealth(apiRes.data)
        setDbHealth(dbRes.data)
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

  return { state, apiHealth, dbHealth, errorMessage }
}
