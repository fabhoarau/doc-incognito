import { useState } from 'react'
import { inspectMetadata } from '../api'
import { mapValue, useI18n } from '../i18n'
import type { MetadataReport } from '../types'
import Dropzone from './Dropzone'

export default function MetadataTab() {
  const { t } = useI18n()
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [report, setReport] = useState<MetadataReport | null>(null)

  function pick(next: File | null) {
    setFile(next)
    setReport(null)
    setError(null)
  }

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
    <>
      <p className="hint">{t.metadata.help}</p>
      <Dropzone onFile={pick} file={file} />
      <div className="row">
        <button type="button" className="primary" disabled={!file || busy} onClick={inspect}>
          {busy ? t.metadata.inspecting : t.metadata.inspect}
        </button>
      </div>

      {error && (
        <div className="alert" role="alert">
          <strong>{t.common.errorTitle}:</strong> {error}
        </div>
      )}

      {report && (
        <div className={report.is_clean ? 'card ok-border' : 'card err-border'}>
          <h2>
            {t.metadata.result} — {report.filename}
          </h2>
          {report.is_clean ? (
            <p className="ok">{t.metadata.clean}</p>
          ) : (
            <p className="error">{t.metadata.risky(report.leak_count, report.fields.length)}</p>
          )}
          {report.fields.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>{t.metadata.field}</th>
                  <th>{t.metadata.value}</th>
                  <th>{t.metadata.risk}</th>
                </tr>
              </thead>
              <tbody>
                {report.fields.map((f, i) => (
                  <tr key={i} className={f.is_leak ? 'leak' : undefined}>
                    <td>{mapValue(t.values.metadataField, f.name)}</td>
                    <td className="value">{f.value}</td>
                    <td>
                      {f.is_leak ? (
                        <span className="badge-risk">{t.metadata.atRisk}</span>
                      ) : (
                        <span className="muted">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="muted">{t.metadata.noFields}</p>
          )}
          {!report.is_clean && <p className="hint">{t.metadata.advice}</p>}
        </div>
      )}
    </>
  )
}
