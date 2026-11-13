import { useEffect, useState } from 'react'
import { getPersonalData, savePersonalData } from '../api'
import { useI18n } from '../i18n'

export default function PersonalDataTab() {
  const { t } = useI18n()
  const [content, setContent] = useState('')
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getPersonalData()
      .then((data) => setContent(data.content))
      .catch((err) => setError(err instanceof Error ? err.message : String(err)))
      .finally(() => setLoading(false))
  }, [])

  async function save() {
    setSaving(true)
    setError(null)
    setStatus(null)
    try {
      await savePersonalData(content)
      setStatus(t.personal.saved)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p>{t.common.loading}</p>

  const lineCount = content.split('\n').filter((line) => line.trim()).length

  return (
    <>
      <p className="hint">{t.personal.help}</p>
      <textarea
        rows={14}
        aria-label={t.personal.label}
        value={content}
        placeholder={t.personal.placeholder}
        onChange={(e) => setContent(e.target.value)}
      />
      <div className="row">
        <button type="button" className="primary" disabled={saving} onClick={save}>
          {saving ? t.personal.saving : t.personal.save}
        </button>
        <span className="muted" aria-live="polite">
          {t.personal.lines(lineCount)}
        </span>
      </div>
      {lineCount === 0 && <p className="warn">{t.personal.emptyWarn}</p>}
      {status && <p className="ok">{status}</p>}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </>
  )
}
