import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AppLayout } from '../layouts/AppLayout'
import { RiskCategoryBadge } from '../components/badges'
import { createProject, fetchProjects } from '../services/projectService'
import { getErrorMessage } from '../services/api'
import type { Project } from '../types/project'

export function ProjectsPage() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState<Project[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchProjects()
      .then(setProjects)
      .catch((err) => setLoadError(getErrorMessage(err, 'Failed to load projects')))
  }, [])

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    setFormError(null)
    setSaving(true)
    try {
      const created = await createProject(name.trim(), description.trim())
      navigate(`/dashboard/${created.id}`)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not create project')
      setSaving(false)
    }
  }

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
          <button
            onClick={() => setShowForm((v) => !v)}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            {showForm ? 'Cancel' : 'New project'}
          </button>
        </div>

        {showForm && (
          <form
            onSubmit={handleCreate}
            className="mt-6 space-y-3 rounded-xl border border-slate-200 bg-white p-5"
          >
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Project name"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description (optional)"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            {formError && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</p>
            )}
            <button
              disabled={saving}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {saving ? 'Creating…' : 'Create project'}
            </button>
          </form>
        )}

        <div className="mt-6 space-y-3">
          {loadError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{loadError}</p>
          )}

          {projects === null &&
            !loadError &&
            [0, 1, 2].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl bg-slate-100" />
            ))}

          {projects?.length === 0 && (
            <p className="rounded-xl border border-dashed border-slate-200 px-5 py-8 text-center text-sm text-slate-400">
              No projects yet. Create one, then upload a package.json to scan it.
            </p>
          )}

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
                  {project.lastScanAt
                    ? `Last scan ${new Date(project.lastScanAt).toLocaleDateString()}`
                    : 'Not scanned yet'}
                </span>
                {project.lastScanAt && <RiskCategoryBadge category={project.riskCategory} />}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </AppLayout>
  )
}
