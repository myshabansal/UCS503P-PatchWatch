import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { FileText } from 'lucide-react'
import { AppLayout } from '../layouts/AppLayout'
import { FileDropzone } from '../components/FileDropzone'
import { fetchProjectDashboard, getPriorScanHistory, saveScannedDashboard } from '../services/mockData'
import { uploadScan } from '../services/scanApi'
import { mapScanToDashboard } from '../utils/mapScanToDashboard'
import { previewPackageJson, type ParsedDependency } from '../utils/parsePackageJson'
import type { Project } from '../types/project'

export function UploadDependenciesPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()

  const [project, setProject] = useState<Project | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<ParsedDependency[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isScanning, setIsScanning] = useState(false)

  useEffect(() => {
    if (!projectId) return
    fetchProjectDashboard(projectId)
      .then((dashboard) => setProject(dashboard.project))
      .catch(() => setProject(null))
  }, [projectId])

  async function handleFileSelected(selected: File) {
    setFile(selected)
    setError(null)
    setPreview(null)
    try {
      const result = await previewPackageJson(selected)
      setPreview(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not read that file')
    }
  }

  async function handleRunScan() {
    if (!projectId || !file) return
    setIsScanning(true)
    setError(null)
    try {
      // Real call — uploads to the FastAPI backend, which parses the file,
      // queries OSV.dev for each dependency, and persists the scan.
      const scan = await uploadScan(file)
      const priorHistory = getPriorScanHistory(projectId)
      const dashboard = mapScanToDashboard(
        projectId,
        project?.name ?? file.name,
        project?.description,
        scan,
        priorHistory,
      )
      await saveScannedDashboard(projectId, dashboard)
      navigate(`/dashboard/${projectId}`)
    } catch (err) {
      setError(
        err instanceof Error
          ? `Scan failed: ${err.message}. Make sure the backend is running at the configured API URL.`
          : 'Scan failed',
      )
      setIsScanning(false)
    }
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl px-8 py-10">
        <h1 className="text-2xl font-semibold text-slate-900">Upload dependencies</h1>
        <p className="mt-1 text-sm text-slate-500">
          Upload <span className="font-mono">package.json</span> to scan this project for known
          vulnerabilities via OSV.dev.
        </p>

        <div className="mt-6">
          <FileDropzone onFileSelected={handleFileSelected} />
        </div>

        {error && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        {file && preview && (
          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
              <FileText className="h-4 w-4 text-slate-400" strokeWidth={2} />
              {file.name}
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Found {preview.length} {preview.length === 1 ? 'dependency' : 'dependencies'}
            </p>

            <ul className="mt-3 max-h-48 divide-y divide-slate-100 overflow-y-auto">
              {preview.slice(0, 20).map((dep) => (
                <li
                  key={dep.name}
                  className="flex items-center justify-between py-1.5 font-mono text-xs"
                >
                  <span className="text-slate-700">{dep.name}</span>
                  <span className="text-slate-400">{dep.declaredVersion}</span>
                </li>
              ))}
            </ul>
            {preview.length > 20 && (
              <p className="mt-2 text-xs text-slate-400">+{preview.length - 20} more</p>
            )}

            <button
              onClick={handleRunScan}
              disabled={isScanning}
              className="mt-4 w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isScanning ? 'Scanning with OSV.dev…' : 'Run scan'}
            </button>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
