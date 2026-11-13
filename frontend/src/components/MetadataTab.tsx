import { useState } from 'react'
import { inspectMetadata } from '../api'
import type { MetadataReport } from '../types'

export default function MetadataTab() {
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [report, setReport] = useState<MetadataReport | null>(null)

  async function inspect() {
    if (!file) return
    setBusy(true)
    setError(null)
    setReport(null)
    try {
      setReport(await inspectMetadata(file))
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section>
      <p className="hint">
        Inspect the PDF metadata or image EXIF of a file before sending it. Fields flagged as
        leaks may reveal your identity (author, GPS coordinates, device, …).
      </p>
      <div className="row">
        <input
          type="file"
          accept=".pdf,.png,.jpg,.jpeg"
          onChange={(e) => {
            setFile(e.target.files?.[0] ?? null)
            setReport(null)
            setError(null)
          }}
        />
        <button disabled={!file || busy} onClick={inspect}>
          {busy ? 'Inspecting…' : 'Inspect'}
        </button>
      </div>

      {error && <p className="error">Error: {error}</p>}

      {report && (
        <div className="card">
          <h2>{report.filename}</h2>
          <p className={report.is_clean ? 'ok' : 'error'}>
            {report.is_clean
              ? 'Clean - no leak detected'
              : `${report.leak_count} potential leak(s) detected`}
          </p>
          {report.fields.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Field</th>
                  <th>Value</th>
                  <th>Leak</th>
                </tr>
              </thead>
              <tbody>
                {report.fields.map((f, i) => (
                  <tr key={i} className={f.is_leak ? 'leak' : undefined}>
                    <td>{f.name}</td>
                    <td className="value">{f.value}</td>
                    <td>{f.is_leak ? 'yes' : 'no'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="muted">No metadata fields found.</p>
          )}
        </div>
      )}
    </section>
  )
}
