import { useState } from 'react'
import { anonymizeDocument, redactImage } from '../api'
import type { AnonymizationResult, RedactionResult } from '../types'

const IMAGE_RE = /\.(png|jpe?g)$/i

export default function AnonymizeTab() {
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState<'anonymize' | 'redact' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<AnonymizationResult | null>(null)
  const [redaction, setRedaction] = useState<RedactionResult | null>(null)

  const isImage = file ? IMAGE_RE.test(file.name) : false

  async function run(kind: 'anonymize' | 'redact') {
    if (!file) return
    setBusy(kind)
    setError(null)
    setResult(null)
    setRedaction(null)
    try {
      if (kind === 'anonymize') {
        setResult(await anonymizeDocument(file))
      } else {
        setRedaction(await redactImage(file))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(null)
    }
  }

  return (
    <section>
      <p className="hint">
        PDF, PNG or JPEG. The text pipeline produces an anonymized .txt (plus a metadata-free
        PDF for PDFs); image redaction paints irreversible black rectangles over sensitive zones.
      </p>
      <div className="row">
        <input
          type="file"
          accept=".pdf,.png,.jpg,.jpeg"
          onChange={(e) => {
            setFile(e.target.files?.[0] ?? null)
            setResult(null)
            setRedaction(null)
            setError(null)
          }}
        />
      </div>
      <div className="row">
        <button disabled={!file || busy !== null} onClick={() => run('anonymize')}>
          {busy === 'anonymize' ? 'Anonymizing…' : 'Anonymize'}
        </button>
        <button disabled={!file || !isImage || busy !== null} onClick={() => run('redact')}>
          {busy === 'redact' ? 'Redacting…' : 'Redact image'}
        </button>
      </div>

      {error && <p className="error">Error: {error}</p>}

      {result && (
        <div className="card">
          <h2>{result.input_name}</h2>
          <p>
            Extraction: <code>{result.extraction_mode}</code> — {result.total_replacements}{' '}
            replacement{result.total_replacements === 1 ? '' : 's'}
          </p>
          {result.replacements.length > 0 && (
            <table>
              <thead>
                <tr>
                  <th>Entity</th>
                  <th>Count</th>
                </tr>
              </thead>
              <tbody>
                {result.replacements.map((r) => (
                  <tr key={r.entity_type}>
                    <td>{r.entity_type}</td>
                    <td>{r.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <p className={result.guardrail_passed ? 'ok' : 'error'}>
            Guardrail: {result.guardrail_passed ? 'passed - no personal data survived' : 'FAILED'}
          </p>
          {!result.guardrail_passed && result.leaks.length > 0 && (
            <ul className="error">
              {result.leaks.map((leak, i) => (
                <li key={i}>leaked: {leak}</li>
              ))}
            </ul>
          )}
          <ul>
            {result.output_files.map((f) => (
              <li key={f.filename}>
                <a href={f.download_url} download>
                  Download {f.label}
                </a>{' '}
                <span className="muted">({f.filename})</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {redaction && (
        <div className="card">
          <h2>{redaction.input_name}</h2>
          <p>{redaction.redacted_zone_count} zone(s) redacted.</p>
          <ul>
            <li>
              <a href={redaction.output_file.download_url} download>
                Download {redaction.output_file.label}
              </a>{' '}
              <span className="muted">({redaction.output_file.filename})</span>
            </li>
          </ul>
        </div>
      )}
    </section>
  )
}
