# doc-incognito

Local-first document anonymizer: redact PDFs and images before sending them
to AI. Everything runs on your machine - no network calls, nothing leaves.

## What it does

- Text pipeline: extract text (native PDF text, OCR for scanned PDFs and
  images via ocrmypdf/tesseract), replace your personal data with [PERSO n]
  tokens, then detect and anonymize French PII with Microsoft Presidio.
  Produces an anonymized .txt and, for PDFs, a rebuilt metadata-free PDF.
- Image redaction: irreversible black-rectangle redaction of sensitive zones
  detected by OCR + Presidio, re-saved as a fresh metadata-free PNG.
- Metadata inspector: report PDF metadata and image EXIF fields, flagging
  potential identity leaks.
- Guardrail: after anonymization, verifies that none of your personal data
  entries remain in the output. Fails loudly if anything survived.

## Architecture

    doc-incognito/
    |- backend/
    |  |- app/
    |  |  |- core/            # config, French regex patterns, Presidio engine (singleton)
    |  |  |- schemas/         # Pydantic models
    |  |  |- services/        # business logic (no duplication, shared by API and CLI)
    |  |  |- routers/         # FastAPI endpoints
    |  |  |- main.py          # FastAPI app factory (127.0.0.1 only)
    |  |- scripts/            # CLI entry points
    |  |- requirements.txt
    |- frontend/              # Vite + React + TS web UI (dev server on 5173)
    |- perso.txt.example      # template: copy to perso.txt and fill in your own data
    |- uploads/ output/       # gitignored runtime directories

## Requirements

- Python 3.12+
- Homebrew: tesseract (with French language data) and ocrmypdf
  (installed via Homebrew, not pip)

    brew install tesseract ocrmypdf
    # French language data for tesseract (if not already present):
    # copy fra.traineddata into /opt/homebrew/share/tessdata/

## Installation

    git clone https://github.com/fabhoarau/doc-incognito.git
    cd doc-incognito/backend
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    python -m spacy download fr_core_news_lg

Copy the personal data template (repo root) and fill it with YOUR data,
one entry per line. This file is gitignored and never leaves your machine:

    cp perso.txt.example perso.txt

## Usage

Start the local API (from backend/, venv active):

    uvicorn app.main:app --reload

Interactive docs: http://127.0.0.1:8000/api/docs

Web UI (from frontend/):

    npm install
    npm run dev

Then open http://127.0.0.1:5173 - the Vite dev server proxies /api to the
backend on 127.0.0.1:8000. Three tabs: Anonymize (text pipeline + image
redaction), My personal data (perso.txt editor), Metadata check.

CLI - text pipeline (anonymized .txt + metadata-free PDF):

    python -m scripts.anonymize_document path/to/statement.pdf

CLI - irreversible image redaction:

    python -m scripts.redact_image path/to/screenshot.png

## Configuration

All settings live in backend/app/core/config.py (override with ANON_
prefixed environment variables): language, spaCy model, Presidio score
threshold, paths.

## Security notes

- The server binds to 127.0.0.1 only; the tool makes no outbound network call.
- perso.txt is gitignored: it must contain your real data only locally.
- Rebuilt PDFs are written with empty metadata; redacted images are fresh
  RGB PNGs with zero EXIF.
- The guardrail is the final safety net: if any personal entry survives,
  the process reports it explicitly.
