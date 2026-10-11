import { useState, type FormEvent } from 'react'
import { Modal } from './Modal'
import { FormField } from './FormField'
import { createProject } from '../services/mockData'
import type { Project } from '../types/project'

export function CreateProjectModal({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: (project: Project) => void
}) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!name.trim()) {
      setError('Give your project a name')
      return
    }
    setError(null)
    setIsSubmitting(true)
    try {
      const project = await createProject({ name: name.trim(), description: description.trim() })
      onCreated(project)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Try again.')
      setIsSubmitting(false)
    }
  }

  return (
    <Modal title="New project" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField
          id="project-name"
          label="Project name"
          placeholder="checkout-service"
          required
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <FormField
          id="project-description"
          label="Description (optional)"
          placeholder="What does this project do?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Creating…' : 'Create project'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
