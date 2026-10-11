import { useRef, useState, type DragEvent } from 'react'
import { UploadCloud } from 'lucide-react'

export function FileDropzone({ onFileSelected }: { onFileSelected: (file: File) => void }) {
  const [isDragging, setIsDragging] = useState(false)
  const [rejectionMessage, setRejectionMessage] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFile(file: File | undefined) {
    if (!file) return
    // Restricted to package.json: the backend's scanner only parses that
    // format right now (no package-lock.json or requirements.txt support yet).
    if (file.name.toLowerCase() !== 'package.json') {
      setRejectionMessage(
        `"${file.name}" isn't supported yet. PatchWatch currently only scans package.json.`,
      )
      return
    }
    setRejectionMessage(null)
    onFileSelected(file)
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDragging(false)
    handleFile(event.dataTransfer.files[0])
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors ${
          isDragging ? 'border-brand bg-brand-light' : 'border-slate-300 hover:border-slate-400'
        }`}
      >
        <UploadCloud
          className={`h-8 w-8 ${isDragging ? 'text-brand' : 'text-slate-400'}`}
          strokeWidth={1.5}
        />
        <p className="mt-3 text-sm font-medium text-slate-700">
          Drag package.json here, or click to browse
        </p>
        <p className="mt-1 font-mono text-xs text-slate-400">
          package.json only, for now — package-lock.json and requirements.txt are next
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>
      {rejectionMessage && <p className="mt-2 text-sm text-red-600">{rejectionMessage}</p>}
    </div>
  )
}
