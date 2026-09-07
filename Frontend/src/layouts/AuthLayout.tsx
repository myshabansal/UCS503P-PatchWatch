import type { ReactNode } from 'react'
import { ShieldHalf } from 'lucide-react'

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string
  subtitle: string
  children: ReactNode
  footer: ReactNode
}) {
  return (
    <div
      className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12"
      style={{
        backgroundImage:
          'radial-gradient(circle, #e2e8f0 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }}
    >
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900">
            <ShieldHalf className="h-5 w-5 text-white" strokeWidth={2} />
          </span>
          <span className="text-lg font-semibold tracking-tight text-slate-900">PatchWatch</span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>

          <div className="mt-6">{children}</div>
        </div>

        <p className="mt-6 text-center text-sm text-slate-500">{footer}</p>
      </div>
    </div>
  )
}
