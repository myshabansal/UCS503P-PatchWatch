import { createContext, useContext, useState, type ReactNode } from 'react'
import * as authService from '../services/authService'
import type { LoginPayload, RegisterPayload, User } from '../types/auth'

const TOKEN_KEY = 'patchwatch_token'
const USER_KEY = 'patchwatch_current_user'

interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (payload: LoginPayload) => Promise<void>
  register: (payload: RegisterPayload) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function readStoredUser(): User | null {
  const token = localStorage.getItem(TOKEN_KEY)
  const storedUser = localStorage.getItem(USER_KEY)
  return token && storedUser ? (JSON.parse(storedUser) as User) : null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(readStoredUser)
  const [isLoading] = useState(false)

  function persistSession(nextUser: User, token: string) {
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser))
    setUser(nextUser)
  }

  async function login(payload: LoginPayload) {
    const { user: loggedInUser, token } = await authService.login(payload)
    persistSession(loggedInUser, token)
  }

  async function register(payload: RegisterPayload) {
    const { user: newUser, token } = await authService.register(payload)
    persistSession(newUser, token)
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: user !== null, isLoading, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}
