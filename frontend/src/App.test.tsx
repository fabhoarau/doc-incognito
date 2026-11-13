import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

beforeEach(() => {
  vi.unstubAllGlobals()
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(jsonResponse({ content: 'LIGNE TEST\n' })),
  )
})

describe('App', () => {
  it('renders the three tabs', () => {
    render(<App />)
    expect(screen.getByRole('tab', { name: 'Anonymize' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'My personal data' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Metadata check' })).toBeInTheDocument()
  })

  it('Anonymize tab: actions disabled until a file is selected', () => {
    render(<App />)
    expect(screen.getByRole('button', { name: 'Anonymize' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Redact image' })).toBeDisabled()

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(fileInput, { target: { files: [new File(['x'], 'doc.pdf')] } })
    expect(screen.getByRole('button', { name: 'Anonymize' })).toBeEnabled()
    // a PDF cannot be redacted as an image
    expect(screen.getByRole('button', { name: 'Redact image' })).toBeDisabled()
  })

  it('My personal data tab: loads perso.txt content into the editor', async () => {
    render(<App />)
    fireEvent.click(screen.getByRole('tab', { name: 'My personal data' }))
    const textarea = (await screen.findByRole('textbox')) as HTMLTextAreaElement
    await waitFor(() => expect(textarea.value).toBe('LIGNE TEST\n'))
  })

  it('Metadata check tab: shows the inspect form', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('tab', { name: 'Metadata check' }))
    expect(screen.getByRole('button', { name: 'Inspect' })).toBeDisabled()
    expect(document.querySelector('input[type="file"]')).not.toBeNull()
  })
})
