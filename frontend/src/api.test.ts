import { beforeEach, describe, expect, it, vi } from 'vitest'
import { anonymizeDocument, getPersonalData, savePersonalData } from './api'

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

beforeEach(() => {
  vi.unstubAllGlobals()
})

describe('api client', () => {
  it('POSTs the file as multipart to /api/anonymize', async () => {
    const payload = {
      input_name: 'doc.pdf',
      extraction_mode: 'pdf-text',
      total_replacements: 3,
      replacements: [],
      output_files: [],
      guardrail_passed: true,
      leaks: [],
    }
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(payload))
    vi.stubGlobal('fetch', fetchMock)

    const file = new File(['pdf'], 'doc.pdf')
    const result = await anonymizeDocument(file)

    expect(result.input_name).toBe('doc.pdf')
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('/api/anonymize')
    expect(init.method).toBe('POST')
    expect((init.body as FormData).get('file')).toBe(file)
  })

  it('throws the backend detail message on HTTP error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse({ detail: 'Unsupported file type: .txt' }, 422)),
    )
    await expect(anonymizeDocument(new File(['x'], 'a.txt'))).rejects.toThrow(
      'Unsupported file type: .txt',
    )
  })

  it('GETs /api/personal-data', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ content: 'ligne 1\n' }))
    vi.stubGlobal('fetch', fetchMock)
    const data = await getPersonalData()
    expect(data.content).toBe('ligne 1\n')
    expect(fetchMock.mock.calls[0][0]).toBe('/api/personal-data')
  })

  it('PUTs the content as JSON to /api/personal-data', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ content: 'abc' }))
    vi.stubGlobal('fetch', fetchMock)
    await savePersonalData('abc')
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('/api/personal-data')
    expect(init.method).toBe('PUT')
    expect(JSON.parse(init.body as string)).toEqual({ content: 'abc' })
  })
})
