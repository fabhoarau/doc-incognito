import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import en, { type Locale } from './en'
import fr from './fr'

const dictionaries: Record<LocaleCode, Locale> = { en, fr }

export const localeCodes = ['en', 'fr'] as const
export type LocaleCode = (typeof localeCodes)[number]

const STORAGE_KEY = 'doc-incognito-locale'

function detectLocale(): LocaleCode {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved && (localeCodes as readonly string[]).includes(saved)) return saved as LocaleCode
  } catch {
    // localStorage unavailable (tests, privacy mode) - fall through
  }
  return navigator.language.toLowerCase().startsWith('fr') ? 'fr' : 'en'
}

type I18nContextValue = {
  locale: LocaleCode
  setLocale: (locale: LocaleCode) => void
  t: Locale
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<LocaleCode>(detectLocale)
  // keep <html lang> in sync for screen readers
  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])
  const setLocale = (next: LocaleCode) => {
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // ignore persistence failures
    }
    setLocaleState(next)
  }
  const value = useMemo<I18nContextValue>(() => ({ locale, setLocale, t: dictionaries[locale] }), [locale])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}

/** Map a raw backend value to its localized label; falls back to the raw value. */
export function mapValue(map: Record<string, string>, key: string): string {
  return map[key] ?? key
}

/** Map a raw backend error message (matched by prefix); falls back to the raw message. */
export function mapError(t: Locale, message: string): string {
  for (const [prefix, mapped] of Object.entries(t.values.errorPrefix)) {
    if (message.startsWith(prefix)) return mapped
  }
  return message
}
