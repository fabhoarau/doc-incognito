import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import App from './App'
import { I18nProvider } from './i18n'
import { mockFetch } from './test/utils'

function renderApp() {
  return render(
    <I18nProvider>
      <App />
    </I18nProvider>,
  )
}

const ANONYMIZE_SUCCESS = {
  input_name: 'doc.pdf',
  extraction_mode: 'pdf-text',
  total_replacements: 43,
  replacements: [{ entity_type: 'PERSON', count: 4 }],
  output_files: [
    {
      filename: 'doc_anonymized.txt',
      label: 'Anonymized text (.txt)',
      download_url: '/api/files/doc_anonymized.txt',
    },
    {
      filename: 'doc_anonymized.pdf',
      label: 'Anonymized PDF (metadata-free)',
      download_url: '/api/files/doc_anonymized.pdf',
    },
  ],
  guardrail_passed: true,
  leaks: [],
}

const ANONYMIZE_GUARDRAIL_FAILURE = {
  ...ANONYMIZE_SUCCESS,
  total_replacements: 2,
  replacements: [],
  output_files: [],
  guardrail_passed: false,
  leaks: ['Ma…'],
}

beforeEach(() => {
  localStorage.setItem('doc-incognito-locale', 'en')
  mockFetch('', { content: 'TEST LINE\n' })
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
    expect(document.documentElement.lang).toBe('fr')
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

  it('result card (PDF success): ready badge, PDF as primary CTA, details collapsed, no raw filename in the heading', async () => {
    mockFetch('/api/anonymize', ANONYMIZE_SUCCESS)
    renderApp()
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(fileInput, { target: { files: [new File(['x'], 'doc.pdf')] } })
    fireEvent.click(screen.getByRole('button', { name: 'Anonymize text' }))

    expect(await screen.findByRole('status')).toHaveTextContent('Ready — leak check passed')
    const heading = screen.getByRole('heading', { name: /Result/ })
    expect(heading).not.toHaveTextContent('doc.pdf')
    const primary = screen.getByRole('link', { name: 'Download the anonymized PDF' })
    expect(primary).toHaveAttribute('href', '/api/files/doc_anonymized.pdf')
    expect(screen.getByRole('link', { name: 'Also download the .txt' })).toHaveAttribute(
      'href',
      '/api/files/doc_anonymized.txt',
    )
    const summary = screen.getByText('See details (1 type)')
    expect(summary.closest('details')).not.toHaveAttribute('open')
  })

  it('result card (guardrail failure): alert shown, leak values never in the DOM, no download CTA', async () => {
    mockFetch('/api/anonymize', ANONYMIZE_GUARDRAIL_FAILURE)
    renderApp()
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(fileInput, { target: { files: [new File(['x'], 'doc.pdf')] } })
    fireEvent.click(screen.getByRole('button', { name: 'Anonymize text' }))

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Leak check FAILED')
    // the raw leak value must never be rendered (mock sends a masked one, but
    // the frontend masks again defensively - see maskLeak)
    expect(screen.queryByText(/Marie Dupont/)).toBeNull()
    expect(screen.queryByRole('link', { name: /Download/ })).toBeNull()
  })
})
