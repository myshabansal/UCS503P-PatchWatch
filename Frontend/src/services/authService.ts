import { api, getErrorMessage } from './api'
import type { AuthResponse, LoginPayload, RegisterPayload, User } from '../types/auth'

interface BackendUser {
  id: number
  email: string
  full_name: string | null
}

function toUser(u: BackendUser): User {
  return { id: String(u.id), name: u.full_name || u.email, email: u.email }
}

export async function fetchCurrentUser(token?: string): Promise<User> {
  try {
    const { data } = await api.get<BackendUser>(
      '/api/v1/auth/me',
      token ? { headers: { Authorization: `Bearer ${token}` } } : undefined,
    )
    return toUser(data)
  } catch (err) {
    throw new Error(getErrorMessage(err))
  }
}

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  try {
    const { data } = await api.post<{ access_token: string }>('/api/v1/auth/login', payload)
    const user = await fetchCurrentUser(data.access_token)
    return { user, token: data.access_token }
  } catch (err) {
    throw new Error(getErrorMessage(err))
  }
}

export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  try {
    // The backend's register endpoint returns the user but no token, so log in right after.
    await api.post('/api/v1/auth/register', {
      email: payload.email,
      password: payload.password,
      full_name: payload.name,
    })
  } catch (err) {
    throw new Error(getErrorMessage(err))
  }
  return login({ email: payload.email, password: payload.password })
}
