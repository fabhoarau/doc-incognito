import type {
  AnonymizationResult,
  MetadataReport,
  PersonalDataContent,
  RedactionResult,
} from './types'

// All calls go through the Vite dev proxy (/api -> 127.0.0.1:8000), so they
// are same-origin and the backend's relative download_url values work as-is.

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let detail = `HTTP ${res.status}`
    try {
      const body = await res.json()
      if (body && typeof body.detail === 'string') detail = body.detail
    } catch {
      // keep the HTTP status as the message
    }
    throw new Error(detail)
  }
  return (await res.json()) as T
}

function postFile(url: string, file: File): Promise<Response> {
  const form = new FormData()
  form.append('file', file)
  return fetch(url, { method: 'POST', body: form })
}

export function anonymizeDocument(file: File): Promise<AnonymizationResult> {
  return postFile('/api/anonymize', file).then((r) => handle<AnonymizationResult>(r))
}

export function redactImage(file: File): Promise<RedactionResult> {
  return postFile('/api/redact', file).then((r) => handle<RedactionResult>(r))
}

export function inspectMetadata(file: File): Promise<MetadataReport> {
  return postFile('/api/metadata/inspect', file).then((r) => handle<MetadataReport>(r))
}

export async function getPersonalData(): Promise<PersonalDataContent> {
  return handle<PersonalDataContent>(await fetch('/api/personal-data'))
}

export async function savePersonalData(content: string): Promise<PersonalDataContent> {
  return handle<PersonalDataContent>(
    await fetch('/api/personal-data', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    }),
  )
}
