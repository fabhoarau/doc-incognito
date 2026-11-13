import { useState } from 'react'
import { anonymizeDocument, redactImage } from '../api'
import { mapError, mapValue, useI18n } from '../i18n'
import type { AnonymizationResult, OutputFile, RedactionResult } from '../types'
import Dropzone from './Dropzone'

const IMAGE_RE = /\.(png|jpe?g)$/i

function maskLeak(leak: string): string {
  return leak.length <= 2 ? '••' : `${leak.slice(0, 2)}…`
}

function downloadLabel(t: ReturnType<typeof useI18n>['t'], file: OutputFile): string {
  if (file.filename.endsWith('.pdf')) return t.anonymize.downloadPdf
  if (file.filename.endsWith('.txt')) return t.anonymize.downloadTxt
  if (file.filename.endsWith('.png')) return t.anonymize.downloadImage
  return mapValue(t.values.outputLabel, file.label)
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

  // Primary download = rebuilt PDF when present (same format as the input),
  // otherwise the .txt; the remaining file becomes a discreet secondary link.
  const primary = result?.output_files.find((f) => f.filename.endsWith('.pdf')) ?? result?.output_files[0]
  const secondary =
    result && primary && primary.filename.endsWith('.pdf')
      ? result.output_files.find((f) => f.filename.endsWith('.txt'))
      : undefined

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
          {result.guardrail_passed ? (
            <p className="status-badge ok" role="status">
              {t.anonymize.resultReady}
            </p>
          ) : (
            <div className="status-badge danger" role="alert">
              <strong>{t.anonymize.resultFailed(result.leaks.length)}</strong>
              <p>{t.anonymize.resultFailedAction}</p>
              {result.leaks.length > 0 && (
                <p className="leak-masked">{result.leaks.map(maskLeak).join(', ')}</p>
              )}
            </div>
          )}
          <h2 className="result-title">
            {t.anonymize.result}
            <span className="pill">{mapValue(t.values.extractionMode, result.extraction_mode)}</span>
          </h2>
          <p className="muted small mono">{result.input_name}</p>
          <p className="stat-line">
            {t.anonymize.statsLine(result.total_replacements, result.replacements.length)}
          </p>

          {result.guardrail_passed && primary && (
            <div className="download">
              <a
                className="btn primary block"
                href={primary.download_url}
                download
                title={mapValue(t.values.outputLabel, primary.label)}
              >
                {downloadLabel(t, primary)}
              </a>
              <span className="muted small mono">{primary.filename}</span>
              {secondary && (
                <a className="link" href={secondary.download_url} download>
                  {t.anonymize.downloadAlsoTxt}
                </a>
              )}
            </div>
          )}

          {result.replacements.length > 0 && (
            <details className="details">
              <summary>{t.anonymize.detailSummary(result.replacements.length)}</summary>
              <div className="chips">
                {result.replacements.map((r) => (
                  <span key={r.entity_type} className="chip">
                    {mapValue(t.values.entityType, r.entity_type)} ×{r.count}
                  </span>
                ))}
              </div>
            </details>
          )}
        </div>
      )}

      {redaction && (
        <div className="card ok-border">
          <p className="status-badge warn" role="status">
            {t.anonymize.redactionBadge}
          </p>
          <h2 className="result-title">{t.anonymize.result}</h2>
          <p className="muted small mono">{redaction.input_name}</p>
          <p className="stat-line">{t.anonymize.redactionDone(redaction.redacted_zone_count)}</p>
          <div className="download">
            <a
              className="btn primary block"
              href={redaction.output_file.download_url}
              download
              title={mapValue(t.values.outputLabel, redaction.output_file.label)}
            >
              {downloadLabel(t, redaction.output_file)}
            </a>
            <span className="muted small mono">{redaction.output_file.filename}</span>
          </div>
        </div>
      )}
    </>
  )
}
