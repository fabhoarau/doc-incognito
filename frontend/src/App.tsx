import { useState } from 'react'
import AnonymizeTab from './components/AnonymizeTab'
import PersonalDataTab from './components/PersonalDataTab'
import MetadataTab from './components/MetadataTab'

type Tab = 'anonymize' | 'personal' | 'metadata'

const TABS: { id: Tab; label: string }[] = [
  { id: 'anonymize', label: 'Anonymize' },
  { id: 'personal', label: 'My personal data' },
  { id: 'metadata', label: 'Metadata check' },
]

export default function App() {
  const [tab, setTab] = useState<Tab>('anonymize')

  return (
    <div className="app">
      <header>
        <h1>doc-incognito</h1>
        <p className="subtitle">Local-first anonymizer - 100% offline, nothing leaves this machine.</p>
      </header>
      <nav className="tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            className={tab === t.id ? 'tab active' : 'tab'}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>
      <main>
        {tab === 'anonymize' && <AnonymizeTab />}
        {tab === 'personal' && <PersonalDataTab />}
        {tab === 'metadata' && <MetadataTab />}
      </main>
    </div>
  )
}
