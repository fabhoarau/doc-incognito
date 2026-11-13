// Mirrors backend/app/schemas/*.py

export type ExtractionMode = 'pdf-text' | 'pdf-ocr' | 'image-ocr'

export interface ReplacementSummary {
  entity_type: string
  count: number
}

export interface OutputFile {
  filename: string
  label: string
  download_url: string
}

export interface AnonymizationResult {
  input_name: string
  extraction_mode: ExtractionMode
  total_replacements: number
  replacements: ReplacementSummary[]
  output_files: OutputFile[]
  guardrail_passed: boolean
  leaks: string[]
}

export interface RedactionResult {
  input_name: string
  output_file: OutputFile
  redacted_zone_count: number
}

export interface MetadataField {
  name: string
  value: string
  is_leak: boolean
}

export interface MetadataReport {
  filename: string
  fields: MetadataField[]
  leak_count: number
  is_clean: boolean
}

export interface PersonalDataContent {
  content: string
}
