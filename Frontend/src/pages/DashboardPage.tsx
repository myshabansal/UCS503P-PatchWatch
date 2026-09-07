import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { Waypoints } from 'lucide-react'
import { AppLayout } from '../layouts/AppLayout'
import { StatCard } from '../components/StatCard'
import { RiskScoreCard } from '../components/RiskScoreCard'
import { RiskHistoryChart } from '../components/RiskHistoryChart'
import { PriorityFixList } from '../components/PriorityFixList'
import { DependencyTable } from '../components/DependencyTable'
import { useBackendHealth } from '../hooks/useBackendHealth'
import { fetchProjectDashboard } from '../services/mockData'
import type { ProjectDashboardData } from '../types/project'

function BackendStatusPill() {
  const { state } = useBackendHealth()
  const label =
    state === 'loading' ? 'Checking API…' : state === 'connected' ? 'API connected' : 'API offline'
  const dotColor =
    state === 'connected' ? 'bg-green-500' : state === 'error' ? 'bg-red-400' : 'bg-slate-300'

  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
      <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
      {label}
    </span>
  )
}

export function DashboardPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const [data, setData] = useState<ProjectDashboardData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!projectId) return
    setData(null)
    setError(null)
    fetchProjectDashboard(projectId)
      .then((result) => setData(result))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load project'))
  }, [projectId])

  if (!projectId) {
    return <Navigate to="/dashboard/proj-1" replace />
  }

  if (error) {
    return (
      <AppLayout>
        <div className="mx-auto max-w-4xl px-8 py-10">
          <p className="text-sm text-slate-500">
            {error}.{' '}
            <Link to="/projects" className="text-brand hover:underline">
              Back to projects
            </Link>
          </p>
        </div>
      </AppLayout>
    )
  }

  if (!data) {
    return (
      <AppLayout>
        <div className="mx-auto max-w-5xl space-y-6 px-8 py-10">
          <div className="h-8 w-64 animate-pulse rounded bg-slate-100" />
          <div className="h-32 animate-pulse rounded-xl bg-slate-100" />
          <div className="h-48 animate-pulse rounded-xl bg-slate-100" />
        </div>
      </AppLayout>
    )
  }

  const { project, summary, priorityFixes, dependencies, scanHistory } = data

  return (
    <AppLayout>
      <div className="mx-auto max-w-5xl px-8 py-10">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-slate-400">
              <Link to="/projects" className="hover:text-slate-600">
                Projects
              </Link>{' '}
              / {project.name}
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-slate-900">{project.name}</h1>
            {project.description && (
              <p className="mt-1 text-sm text-slate-500">{project.description}</p>
            )}
          </div>
          <button className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Rescan
          </button>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[auto_1fr]">
          <RiskScoreCard score={project.riskScore} category={project.riskCategory} />

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <StatCard label="Dependencies" value={summary.totalDependencies} />
            <StatCard label="Vulnerable" value={summary.vulnerableDependencies} tone="high" />
            <StatCard label="Critical" value={summary.criticalCount} tone="critical" />
            <StatCard label="High" value={summary.highCount} tone="high" />
            <StatCard label="Outdated" value={summary.outdatedCount} />
            <StatCard label="License warnings" value={summary.licenseWarnings} />
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-slate-900">Priority fixes</h2>
            <div className="mt-4">
              <PriorityFixList fixes={priorityFixes} />
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-slate-900">Risk over time</h2>
            <div className="mt-4">
              <RiskHistoryChart history={scanHistory} />
            </div>
          </div>
        </div>

        <div className="mt-6">
          <h2 className="text-sm font-semibold text-slate-900">Dependencies</h2>
          <div className="mt-3">
            <DependencyTable dependencies={dependencies} />
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3 rounded-xl border border-dashed border-slate-200 px-5 py-6 text-slate-400">
          <Waypoints className="h-5 w-5" strokeWidth={1.5} />
          <p className="text-sm">
            Dependency graph — available once the graph visualization phase ships. It&apos;ll show
            how vulnerable and outdated packages connect through the dependency tree.
          </p>
        </div>

        <div className="mt-8 flex justify-end">
          <BackendStatusPill />
        </div>
      </div>
    </AppLayout>
  )
}
