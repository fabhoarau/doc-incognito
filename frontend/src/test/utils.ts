// Shared test helpers (avoid duplicating them in every test file).

import { vi } from 'vitest'

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

/** Stub fetch: serves `payload` on any URL containing `urlPart`, else { content: '' }. */
export function mockFetch(urlPart: string, payload: unknown, status = 200): void {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation((url: string) =>
      Promise.resolve(
        String(url).includes(urlPart)
          ? jsonResponse(payload, status)
          : jsonResponse({ content: '' }),
      ),
    ),
  )
}
