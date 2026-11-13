import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { I18nProvider } from './i18n'

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function renderApp() {
  return render(
    <I18nProvider>
      <App />
    </I18nProvider>,
  )
}

beforeEach(() => {
  vi.unstubAllGlobals()
  localStorage.setItem('doc-incognito-locale', 'en')
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(jsonResponse({ content: 'TEST LINE\n' })),
  )
})

describe('App', () => {
  it('renders the three tabs (EN)', () => {
    renderApp()
    expect(screen.getByRole('tab', { name: 'Anonymize' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'My personal data' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Metadata check' })).toBeInTheDocument()
  })

  it('switches the whole UI to French', () => {
    renderApp()
    fireEvent.change(screen.getByLabelText('Language'), { target: { value: 'fr' } })
    expect(screen.getByRole('tab', { name: 'Anonymiser' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Mes données personnelles' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Métadonnées' })).toBeInTheDocument()
    expect(screen.getByText('Hors ligne · 100 % local')).toBeInTheDocument()
  })

  it('Anonymize tab: empty state explains the two actions', () => {
    renderApp()
    expect(screen.getByText(/Two ways to clean a document/)).toBeInTheDocument()
    expect(screen.getByText(/irreversible/)).toBeInTheDocument()
  })

  it('Anonymize tab: a PDF only offers text anonymization', () => {
    renderApp()
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(fileInput, { target: { files: [new File(['x'], 'doc.pdf')] } })
    expect(screen.getByRole('button', { name: 'Anonymize text' })).toBeEnabled()
    expect(screen.queryByRole('button', { name: /Black out image/ })).toBeNull()
  })

  it('Anonymize tab: an image offers both actions', () => {
    renderApp()
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(fileInput, { target: { files: [new File(['x'], 'shot.png')] } })
    expect(screen.getByRole('button', { name: 'Anonymize text' })).toBeEnabled()
    expect(screen.getByRole('button', { name: /Black out image/ })).toBeEnabled()
  })

  it('My personal data tab: loads perso.txt content into the editor', async () => {
    renderApp()
    fireEvent.click(screen.getByRole('tab', { name: 'My personal data' }))
    const textarea = (await screen.findByLabelText(
      'My personal data, one per line',
    )) as HTMLTextAreaElement
    await waitFor(() => expect(textarea.value).toBe('TEST LINE\n'))
  })

  it('Metadata check tab: shows the analyze action, disabled without a file', () => {
    renderApp()
    fireEvent.click(screen.getByRole('tab', { name: 'Metadata check' }))
    expect(screen.getByRole('button', { name: 'Analyze metadata' })).toBeDisabled()
    expect(document.querySelector('input[type="file"]')).not.toBeNull()
  })
})
