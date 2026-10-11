import { api } from './api'
import type { AuthResponse, LoginPayload, RegisterPayload, User } from '../types/auth'

/**
 * Auth service.
 *
 * Phase 2 (backend auth: POST /auth/register, POST /auth/login) isn't built yet,
 * so this talks to an in-browser mock instead of the real API. The function
 * signatures match what the real backend will return, so switching over later
 * is a matter of deleting the mock block and uncommenting the `api.post` calls
 * below each function — nothing that imports this file needs to change.
 */

const MOCK_LATENCY_MS = 400
const MOCK_USERS_KEY = 'patchwatch_mock_users'

interface MockUserRecord extends User {
  password: string
}

function readMockUsers(): MockUserRecord[] {
  const raw = localStorage.getItem(MOCK_USERS_KEY)
  return raw ? (JSON.parse(raw) as MockUserRecord[]) : []
}

function writeMockUsers(users: MockUserRecord[]) {
  localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(users))
}

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), MOCK_LATENCY_MS))
}

function makeMockToken(userId: string): string {
  return `mock.${userId}.${Date.now()}`
}

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  // Real implementation (Phase 2):
  // const { data } = await api.post<AuthResponse>('/auth/login', payload)
  // return data

  const users = readMockUsers()
  const match = users.find((u) => u.email === payload.email)
  if (!match || match.password !== payload.password) {
    return delay(Promise.reject(new Error('Invalid email or password')) as never)
  }
  const { password: _password, ...user } = match
  return delay({ user, token: makeMockToken(user.id) })
}

export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  // Real implementation (Phase 2):
  // const { data } = await api.post<AuthResponse>('/auth/register', payload)
  // return data

  const users = readMockUsers()
  if (users.some((u) => u.email === payload.email)) {
    throw new Error('An account with this email already exists')
  }
  const user: User = { id: crypto.randomUUID(), name: payload.name, email: payload.email }
  writeMockUsers([...users, { ...user, password: payload.password }])
  return delay({ user, token: makeMockToken(user.id) })
}

export async function fetchCurrentUser(): Promise<User> {
  // Real implementation (Phase 2), once a token is stored:
  // const { data } = await api.get<User>('/auth/me')
  // return data

  const raw = localStorage.getItem('patchwatch_current_user')
  if (!raw) throw new Error('Not authenticated')
  return delay(JSON.parse(raw) as User)
}

// Referenced so the `api` import (used by the real calls above) isn't flagged
// as unused while the mock is active.
void api
