import { useEffect, useState } from 'react'
import { getPersonalData, savePersonalData } from '../api'

export default function PersonalDataTab() {
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
      setStatus('Saved locally (perso.txt). Never sent anywhere.')
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p>Loading…</p>

  return (
    <section>
      <p className="hint">
        One entry per line. These values are replaced with <code>[PERSO n]</code> tokens before
        any analysis, and the guardrail verifies none of them survives in the output. The file
        stays on this machine (gitignored).
      </p>
      <textarea
        rows={14}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={'Jane Dupont\n12 rue de la Paix, Paris\nFR76 3000 6000 0000 0000 0000 000'}
      />
      <div className="row">
        <button disabled={saving} onClick={save}>
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
      {status && <p className="ok">{status}</p>}
      {error && <p className="error">Error: {error}</p>}
    </section>
  )
}
