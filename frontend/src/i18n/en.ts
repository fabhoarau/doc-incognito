// English dictionary - the source of truth for the Locale type.
// Add a new locale by copying this file and translating it (see fr.ts).

const en = {
  meta: {
    language: 'Language',
  },
  header: {
    subtitle:
      'Anonymize your documents before sending them to an AI — 100% local, nothing leaves this machine.',
    offline: 'Offline · 100% local',
  },
  tabs: {
    anonymize: 'Anonymize',
    personal: 'My personal data',
    metadata: 'Metadata check',
  },
  common: {
    loading: 'Loading…',
    errorTitle: 'An error occurred',
  },
  anonymize: {
    intro: 'Two ways to clean a document:',
    dropChoose: 'Choose a file',
    dropOr: 'or drag and drop it here',
    dropHint: 'PDF, PNG or JPEG — processed 100% locally',
    change: 'Change',
    remove: 'Remove',
    isPdf: 'This is a PDF: one action is available.',
    isImage:
      'This is an image: you can anonymize its text (OCR) or black out the sensitive zones for good.',
    anonymizeText: 'Anonymize text',
    anonymizing: 'Anonymizing…',
    anonymizeTextHelp:
      'Extracts the text, replaces your personal data and sensitive information → .txt file (+ rebuilt metadata-free PDF for a PDF).',
    redact: 'Black out image (pixels)',
    redacting: 'Redacting…',
    redactHelp:
      'Covers sensitive zones with permanent black rectangles. Irreversible: the hidden pixels are destroyed.',
    irreversible: 'irreversible',
    progress:
      'Extracting text and analyzing — OCR on a scanned PDF or an image can take a few seconds.',
    result: 'Result',
    extraction: 'Extraction',
    statsReplacements: (n: number) => `${n} replacement${n === 1 ? '' : 's'}`,
    statsEntityTypes: (n: number) => `${n} type${n === 1 ? '' : 's'} found`,
    statsZones: (n: number) => `${n} zone${n === 1 ? '' : 's'} blacked out`,
    zonesIrreversible: 'pixels destroyed, irreversible',
    detail: 'Details',
    guardrailOk:
      'Leak check passed — none of your personal entries appear in the output files.',
    guardrailFail: (n: number) =>
      `Leak check FAILED — ${n} personal ${
        n === 1 ? 'entry is' : 'entries are'
      } still present (values hidden). Do not share these files: complete “My personal data” and run again.`,
    downloads: 'Downloads',
  },
  personal: {
    help: 'Enter here what identifies you — one piece of information per line (name, address, IBAN, phone…). Before any analysis, each line is replaced by a [PERSO1], [PERSO2]… token, and the leak check then verifies that none of them reappears in the output. The perso.txt file stays on this machine: it is never sent or versioned.',
    label: 'My personal data, one per line',
    placeholder: 'John Smith\n12 Baker Street, London\njohn.smith@example.com',
    lines: (n: number) => `${n} filled line${n === 1 ? '' : 's'}`,
    emptyWarn:
      'No data entered: the leak check will have nothing to verify. Add at least your name and your IBAN.',
    save: 'Save',
    saving: 'Saving…',
    saved: 'Saved locally (perso.txt) — never sent anywhere.',
  },
  metadata: {
    help: 'Before sending a file, check what it reveals about you: author, camera model, GPS coordinates… This metadata (image EXIF, PDF fields) can identify you even when the document content is anonymized.',
    inspect: 'Analyze metadata',
    inspecting: 'Analyzing…',
    result: 'Result',
    risky: (leaks: number, total: number) => `${leaks} risky field${leaks === 1 ? '' : 's'} out of ${total}`,
    clean: 'Clean file — no risky field detected.',
    noFields: 'No metadata found in this file.',
    field: 'Field',
    value: 'Value',
    risk: 'Risk',
    atRisk: 'At risk',
    advice: 'Tip: produce a cleaned version from the “Anonymize” tab (text or image blackout).',
  },
  // Mappings of raw backend values -> display strings. Fallback: the raw value.
  values: {
    extractionMode: {
      'pdf-text': 'Native PDF text',
      'pdf-ocr': 'OCR (scanned PDF)',
      'image-ocr': 'OCR (image)',
    },
    entityType: {
      PERSON: 'Person',
      ORGANIZATION: 'Organization',
      LOCATION: 'Location',
      DATE_TIME: 'Date/time',
      PHONE_NUMBER: 'Phone number',
      EMAIL_ADDRESS: 'Email',
      IBAN_CODE: 'IBAN',
      CREDIT_CARD_NUMBER: 'Credit card',
      IP_ADDRESS: 'IP address',
      URL: 'URL',
      DATE_FR: 'Date',
      NUM_CONTRAT: 'Contract no.',
      RCS_SIRET: 'RCS / SIRET',
      TEL_FR: 'Phone (FR)',
      CODE_POSTAL_VILLE: 'Postal code + city',
      NUM_LONG: 'Long number',
      HEX_ID: 'Technical ID',
      IBAN_FR: 'IBAN (FR)',
      EMAIL: 'Email',
      ADRESSE: 'Postal address',
    },
    outputLabel: {
      'Anonymized text (.txt)': 'Download anonymized text (.txt)',
      'Anonymized PDF (metadata-free)': 'Download rebuilt PDF (no metadata)',
      'Redacted image (metadata-free PNG)': 'Download blacked-out image (PNG, no metadata)',
    },
    metadataField: {
      format: 'Format',
      version: 'PDF version',
      encryption: 'Encryption',
      author: 'Author',
      creator: 'Creator',
      producer: 'Producer',
      title: 'Title',
      subject: 'Subject',
      keywords: 'Keywords',
      creationDate: 'Creation date',
      modDate: 'Modification date',
      'EXIF 271': 'Device make',
      'EXIF 272': 'Device model',
      'EXIF 305': 'Software',
      'EXIF 306': 'Date/time',
      'EXIF 33432': 'Copyright',
      'EXIF 36864': 'EXIF version',
      'EXIF 36867': 'Photo date',
      'EXIF 34853': 'GPS data',
      'EXIF 37510': 'Comment',
    },
    errorPrefix: {
      'Unsupported file type': 'Unsupported file type — PDF, PNG or JPEG only.',
      'Redaction only supports images': 'Pixel redaction only works on an image.',
      'No text could be extracted': 'No text could be extracted from the document.',
    },
  },
}

export type Locale = typeof en
export default en
