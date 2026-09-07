import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AppLayout } from '../layouts/AppLayout'
import { RiskCategoryBadge } from '../components/badges'
import { fetchProjects } from '../services/mockData'
import type { Project } from '../types/project'

export function ProjectsPage() {
  const [projects, setProjects] = useState<Project[] | null>(null)

  useEffect(() => {
    fetchProjects().then(setProjects)
  }, [])

  return (
    <AppLayout>
      <div className="mx-auto max-w-4xl px-8 py-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Projects</h1>
            <p className="mt-1 text-sm text-slate-500">
              {projects?.length ?? '…'} tracked projects
            </p>
          </div>
          <button className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
            New project
          </button>
        </div>

        <div className="mt-6 space-y-3">
          {projects === null &&
            [0, 1, 2].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl bg-slate-100" />
            ))}

          {projects?.map((project) => (
            <Link
              key={project.id}
              to={`/dashboard/${project.id}`}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-4 transition-colors hover:border-slate-300"
            >
              <div>
                <p className="font-medium text-slate-900">{project.name}</p>
                {project.description && (
                  <p className="mt-0.5 text-sm text-slate-500">{project.description}</p>
                )}
              </div>
              <div className="flex items-center gap-4">
                <span className="font-mono text-sm text-slate-400">
                  Last scan {new Date(project.lastScanAt).toLocaleDateString()}
                </span>
                <RiskCategoryBadge category={project.riskCategory} />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </AppLayout>
  )
}
