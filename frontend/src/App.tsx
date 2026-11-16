import { useState } from 'react'
import AnonymizeTab from './components/AnonymizeTab'
import PersonalDataTab from './components/PersonalDataTab'
import MetadataTab from './components/MetadataTab'
import { localeCodes, useI18n, type LocaleCode } from './i18n'

type Tab = 'anonymize' | 'personal' | 'metadata'

export default function App() {
  const { t, locale, setLocale } = useI18n()
  const [tab, setTab] = useState<Tab>('anonymize')

  const tabs: { id: Tab; label: string }[] = [
    { id: 'anonymize', label: t.tabs.anonymize },
    { id: 'personal', label: t.tabs.personal },
    { id: 'metadata', label: t.tabs.metadata },
  ]

  return (
    <div className="app">
      <header>
        <div className="header-row">
          <div className="brand">
            <img src="/favicon.svg" alt="" className="brand-logo" />
            <div>
              <h1>doc-incognito</h1>
              <p className="subtitle">{t.header.subtitle}</p>
            </div>
          </div>
          <div className="header-side">
            <span className="offline-badge">{t.header.offline}</span>
            <select
              className="lang-switch"
              aria-label={t.meta.language}
              value={locale}
              onChange={(e) => setLocale(e.target.value as LocaleCode)}
            >
              {localeCodes.map((code) => (
                <option key={code} value={code}>
                  {code.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>
      <nav className="tabs" role="tablist">
        {tabs.map((tb) => (
          <button
            key={tb.id}
            id={`tab-${tb.id}`}
            role="tab"
            aria-selected={tab === tb.id}
            aria-controls={`panel-${tb.id}`}
            className={tab === tb.id ? 'tab active' : 'tab'}
            onClick={() => setTab(tb.id)}
          >
            {tb.label}
          </button>
        ))}
      </nav>
      <main>
        {tab === 'anonymize' && (
          <section role="tabpanel" id="panel-anonymize" aria-labelledby="tab-anonymize">
            <AnonymizeTab />
          </section>
        )}
        {tab === 'personal' && (
          <section role="tabpanel" id="panel-personal" aria-labelledby="tab-personal">
            <PersonalDataTab />
          </section>
        )}
        {tab === 'metadata' && (
          <section role="tabpanel" id="panel-metadata" aria-labelledby="tab-metadata">
            <MetadataTab />
          </section>
        )}
      </main>
    </div>
  )
}
