import { useRef, useState } from 'react'
import { useI18n } from '../i18n'

type Props = {
  onFile: (file: File | null) => void
  file: File | null
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function Dropzone({ onFile, file }: Props) {
  const { t } = useI18n()
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  return (
    <>
      <div
        className={dragOver ? 'dropzone dragover' : 'dropzone'}
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click()
        }}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          onFile(e.dataTransfer.files?.[0] ?? null)
        }}
      >
        {file ? (
          <span className="file-chip">
            <span className="file-name">{file.name}</span>
            <span className="muted">{formatSize(file.size)}</span>
          </span>
        ) : (
          <>
            <p className="drop-choose">{t.anonymize.dropChoose}</p>
            <p className="muted">{t.anonymize.dropOr}</p>
          </>
        )}
        <p className="muted small">{t.anonymize.dropHint}</p>
      </div>
      {/* Visually hidden but kept in the DOM: stays accessible and tests
          query input[type="file"] directly. */}
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.png,.jpg,.jpeg"
        className="sr-only"
        aria-label={t.anonymize.dropChoose}
        onChange={(e) => onFile(e.target.files?.[0] ?? null)}
      />
      {file && (
        <div className="row">
          <button type="button" className="link" onClick={() => inputRef.current?.click()}>
            {t.anonymize.change}
          </button>
          <button type="button" className="link" onClick={() => onFile(null)}>
            {t.anonymize.remove}
          </button>
        </div>
      )}
    </>
  )
}
