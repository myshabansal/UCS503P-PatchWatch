import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { FolderKanban, LayoutDashboard, LogOut, ShieldHalf } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/projects', label: 'Projects', icon: FolderKanban },
]

export function AppLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth()

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="flex w-60 shrink-0 flex-col bg-slate-900 text-slate-300">
        <div className="flex items-center gap-2.5 px-5 py-5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
            <ShieldHalf className="h-4.5 w-4.5 text-white" strokeWidth={2} />
          </span>
          <span className="text-sm font-semibold tracking-tight text-white">PatchWatch</span>
        </div>

        <nav className="mt-4 flex flex-1 flex-col gap-1 px-3">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-white/10 text-white'
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                }`
              }
            >
              <Icon className="h-4 w-4" strokeWidth={2} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/10 px-3 py-3">
          <div className="flex items-center justify-between rounded-lg px-2 py-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-200">{user?.name}</p>
              <p className="truncate text-xs text-slate-500">{user?.email}</p>
            </div>
            <button
              onClick={logout}
              aria-label="Log out"
              title="Log out"
              className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
            >
              <LogOut className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}
