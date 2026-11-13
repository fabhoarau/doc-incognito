import { describe, expect, it } from 'vitest'
import en from './en'
import fr from './fr'
import { mapError, mapValue } from './index'

function keys(value: unknown, prefix = ''): string[] {
  if (typeof value !== 'object' || value === null) return [prefix]
  return Object.entries(value as Record<string, unknown>).flatMap(([k, v]) =>
    keys(v, prefix ? `${prefix}.${k}` : k),
  )
}

describe('i18n dictionaries', () => {
  it('fr has exactly the same keys as en', () => {
    expect(keys(fr).sort()).toEqual(keys(en).sort())
  })

  it('maps backend values to localized labels, falling back to the raw value', () => {
    expect(mapValue(en.values.entityType, 'IBAN_FR')).toBe('IBAN (FR)')
    expect(mapValue(fr.values.entityType, 'ADRESSE')).toBe('Adresse postale')
    expect(mapValue(en.values.extractionMode, 'pdf-ocr')).toBe('OCR (scanned PDF)')
    expect(mapValue(en.values.outputLabel, 'Anonymized text (.txt)')).toContain('Download')
    expect(mapValue(fr.values.outputLabel, 'Anonymized text (.txt)')).toContain('Télécharger')
    expect(mapValue(en.values.entityType, 'BRAND_NEW_ENTITY')).toBe('BRAND_NEW_ENTITY')
  })

  it('maps backend error messages by prefix, falling back to the raw message', () => {
    expect(mapError(en, 'Unsupported file type: .txt')).toBe(
      'Unsupported file type — PDF, PNG or JPEG only.',
    )
    expect(mapError(fr, 'Unsupported file type: .txt')).toContain('PDF, PNG ou JPEG')
    expect(mapError(en, 'Redaction only supports images')).toContain('image')
    expect(mapError(en, 'some unexpected error')).toBe('some unexpected error')
  })
})
