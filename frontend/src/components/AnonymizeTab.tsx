import { useState } from 'react'
import { anonymizeDocument, redactImage } from '../api'
import { mapError, mapValue, useI18n } from '../i18n'
import type { AnonymizationResult, RedactionResult } from '../types'
import Dropzone from './Dropzone'

const IMAGE_RE = /\.(png|jpe?g)$/i

function maskLeak(leak: string): string {
  return leak.length <= 2 ? '••' : `${leak.slice(0, 2)}…`
}

export default function AnonymizeTab() {
  const { t } = useI18n()
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState<'anonymize' | 'redact' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<AnonymizationResult | null>(null)
  const [redaction, setRedaction] = useState<RedactionResult | null>(null)

  const isImage = file ? IMAGE_RE.test(file.name) : false

  function pick(next: File | null) {
    setFile(next)
    setResult(null)
    setRedaction(null)
    setError(null)
  }

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
    <>
      <Dropzone onFile={pick} file={file} />

      {!file && !result && !redaction && (
        <div className="explain">
          <p>{t.anonymize.intro}</p>
          <div className="explain-grid">
            <div className="explain-card">
              <h3>1. {t.anonymize.anonymizeText}</h3>
              <p>{t.anonymize.anonymizeTextHelp}</p>
            </div>
            <div className="explain-card">
              <h3>
                2. {t.anonymize.redact}{' '}
                <span className="badge-warn">{t.anonymize.irreversible}</span>
              </h3>
              <p>{t.anonymize.redactHelp}</p>
            </div>
          </div>
        </div>
      )}

      {file && !result && !redaction && (
        <div className="actions">
          <p className="muted">{isImage ? t.anonymize.isImage : t.anonymize.isPdf}</p>
          <button
            type="button"
            className="primary"
            disabled={busy !== null}
            onClick={() => run('anonymize')}
          >
            {busy === 'anonymize' ? t.anonymize.anonymizing : t.anonymize.anonymizeText}
          </button>
          <p className="help">{t.anonymize.anonymizeTextHelp}</p>
          {isImage && (
            <>
              <button
                type="button"
                className="ghost"
                disabled={busy !== null}
                onClick={() => run('redact')}
              >
                {busy === 'redact' ? t.anonymize.redacting : t.anonymize.redact}{' '}
                <span className="badge-warn">{t.anonymize.irreversible}</span>
              </button>
              <p className="help">{t.anonymize.redactHelp}</p>
            </>
          )}
        </div>
      )}

      {busy && (
        <div className="progress" aria-live="polite">
          <div className="progress-bar" />
          <p className="muted small">{t.anonymize.progress}</p>
        </div>
      )}

      {error && (
        <div className="alert" role="alert">
          <strong>{t.common.errorTitle}:</strong> {mapError(t, error)}
        </div>
      )}

      {result && (
        <div className={result.guardrail_passed ? 'card ok-border' : 'card err-border'}>
          <h2>
            {t.anonymize.result} — {result.input_name}
          </h2>
          <div className="stats">
            <div className="stat">
              <span className="stat-num">{result.total_replacements}</span>
              <span className="stat-label">{t.anonymize.statsReplacements(result.total_replacements)}</span>
            </div>
            <div className="stat">
              <span className="stat-num">{result.replacements.length}</span>
              <span className="stat-label">{t.anonymize.statsEntityTypes(result.replacements.length)}</span>
            </div>
          </div>
          <p className="muted small">
            {t.anonymize.extraction}:{' '}
            <code>{mapValue(t.values.extractionMode, result.extraction_mode)}</code>
          </p>
          {result.replacements.length > 0 && (
            <>
              <p className="downloads-title">{t.anonymize.detail}</p>
              <div className="chips">
                {result.replacements.map((r) => (
                  <span key={r.entity_type} className="chip">
                    {mapValue(t.values.entityType, r.entity_type)} ×{r.count}
                  </span>
                ))}
              </div>
            </>
          )}
          <p className={result.guardrail_passed ? 'ok' : 'error'}>
            {result.guardrail_passed
              ? t.anonymize.guardrailOk
              : t.anonymize.guardrailFail(result.leaks.length)}
          </p>
          {!result.guardrail_passed && result.leaks.length > 0 && (
            <p className="muted small">
              {result.leaks.map((leak) => maskLeak(leak)).join(', ')}
            </p>
          )}
          <p className="downloads-title">{t.anonymize.downloads}</p>
          {result.output_files.map((f) => (
            <div key={f.filename} className="download">
              <a className="btn primary block" href={f.download_url} download>
                {mapValue(t.values.outputLabel, f.label)}
              </a>
              <span className="muted small">{f.filename}</span>
            </div>
          ))}
        </div>
      )}

      {redaction && (
        <div className="card">
          <h2>
            {t.anonymize.result} — {redaction.input_name}
          </h2>
          <div className="stats">
            <div className="stat">
              <span className="stat-num">{redaction.redacted_zone_count}</span>
              <span className="stat-label">
                {t.anonymize.statsZones(redaction.redacted_zone_count)} · {t.anonymize.zonesIrreversible}
              </span>
            </div>
          </div>
          <p className="downloads-title">{t.anonymize.downloads}</p>
          <div className="download">
            <a className="btn primary block" href={redaction.output_file.download_url} download>
              {mapValue(t.values.outputLabel, redaction.output_file.label)}
            </a>
            <span className="muted small">{redaction.output_file.filename}</span>
          </div>
        </div>
      )}
    </>
  )
}
