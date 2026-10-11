import axios from 'axios'

// Backend base URL — override via a .env file (VITE_API_BASE_URL=...) for
// non-local setups. Defaults to the local FastAPI dev server.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

export const TOKEN_KEY = 'patchwatch_token'
export const USER_KEY = 'patchwatch_current_user'

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
})

// Attach the JWT to every request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// If the token expired / is invalid, clear the session and go to the login page.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url: string = error.config?.url ?? ''
    const isAuthCall = url.includes('/auth/login') || url.includes('/auth/register')
    if (error.response?.status === 401 && !isAuthCall) {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
      window.location.assign('/login')
    }
    return Promise.reject(error)
  },
)

/** Turn an axios/FastAPI error into a readable message. */
export function getErrorMessage(err: unknown, fallback = 'Something went wrong. Try again.'): string {
  if (axios.isAxiosError(err)) {
    if (!err.response) return 'Cannot reach the server. Is the backend running?'
    const detail = err.response.data?.detail
    if (typeof detail === 'string') return detail
    if (Array.isArray(detail) && detail[0]?.msg) return String(detail[0].msg)
  }
  return err instanceof Error ? err.message : fallback
}
