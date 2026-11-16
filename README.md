# doc-incognito

<img src="frontend/public/favicon.svg" width="96" alt="doc-incognito logo" />

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Tests](https://img.shields.io/badge/tests-37%20pytest%20%2B%2017%20vitest-green.svg)]()

Local-first document anonymizer: redact PDFs and images before sending them
to AI. Everything runs on your machine - no network calls, nothing leaves.

*Keywords: privacy, PII redaction, PDF anonymization, image redaction, OCR,
Presidio, spaCy, local-first, self-hosted, offline, GDPR, French documents.*

## What it does

- Text pipeline: extract text (native PDF text, OCR for scanned PDFs and
  images via ocrmypdf/tesseract), replace your personal data with [PERSO1],
  [PERSO2]… tokens (longest entries first), then detect and anonymize French
  PII with Microsoft Presidio. Produces an anonymized .txt and, for PDFs, a
  rebuilt metadata-free PDF.
- Image redaction: irreversible black-rectangle redaction of sensitive zones
  detected by OCR + Presidio, re-saved as a fresh metadata-free PNG.
- Metadata inspector: report PDF metadata and image EXIF fields, flagging
  potential identity leaks.
- Guardrail: after anonymization, verifies that none of your personal data
  entries remain in the output. Fails loudly if anything survived: no output
  file is written and the leaked values are masked.

## Architecture

    doc-incognito/
    |- AGENTS.md              # project context for AI agents (conventions, invariants)
    |- backend/
    |  |- app/
    |  |  |- core/            # config, French regex patterns, Presidio engine (singleton)
    |  |  |- schemas/         # Pydantic models
    |  |  |- services/        # business logic (no duplication, shared by API and CLI)
    |  |  |- routers/         # FastAPI endpoints
    |  |  |- main.py          # FastAPI app factory (127.0.0.1 only)
    |  |- scripts/            # CLI entry points
    |  |- tests/              # pytest suite (runs on isolated tmp dirs)
    |  |- requirements.txt
    |  |- requirements-dev.txt  # + pytest, httpx (tests)
    |- frontend/              # Vite + React + TS web UI (dev server on 5173, i18n in src/i18n/)
    |- perso.txt.example      # template: copy to perso.txt and fill in your own data
    |- uploads/ output/       # gitignored runtime directories

## Requirements

- Python 3.11-3.14 (presidio 2.2.366 does not support Python 3.15+)
- tesseract **with the French language data** (`fra`) and ocrmypdf + ghostscript
  (installed system-wide, not via pip - OCR runs with `-l fra`)

Per OS:

```
# macOS (Homebrew)
brew install tesseract tesseract-lang ocrmypdf ghostscript
# tesseract-lang installs all language models, incl. fra.traineddata, into
# /opt/homebrew/share/tessdata/ (Apple Silicon; /usr/local/... on Intel).

# Linux (Debian/Ubuntu)
sudo apt install tesseract-ocr tesseract-ocr-fra ocrmypdf ghostscript

# Windows (PowerShell, winget)
winget install Python.Python.3.12 UB-Mannheim.TesseractOCR ArtifexSoftware.Ghostscript
# add the "fra" language in the Tesseract installer, or drop fra.traineddata into
#   C:\Program Files\Tesseract-OCR\tessdata\
# ocrmypdf on Windows: pip install ocrmypdf (done by setup.ps1)
```

Verify the French model on any OS with `tesseract --list-langs` — it must list `fra`.

## Installation

### Docker (recommended - zero host install)

Everything (Python, tesseract+french, ghostscript, ocrmypdf, spaCy model, built
UI) ships in one image. The container publishes on your loopback only, and
`perso.txt` is mounted read-only - it is never baked into the image.

    git clone https://github.com/fabhoarau/doc-incognito.git
    cd doc-incognito
    cp perso.txt.example perso.txt     # fill in your personal data
    docker compose up --build
    open http://127.0.0.1:8000         # UI + API on the same origin

Equivalent `docker run`:

    docker build -t doc-incognito .
    docker run --rm -p 127.0.0.1:8000:8000 \
      -v "$PWD/perso.txt:/app/perso.txt:ro" \
      -v "$PWD/uploads:/app/uploads" -v "$PWD/output:/app/output" \
      doc-incognito

(Windows PowerShell: `-v "${PWD}\perso.txt:/app/perso.txt:ro"`.)
Anonymized files land in `./output/` on your host. The image is large
(~2.7 GB) because of the spaCy `fr_core_news_lg` model.

### Native (macOS / Linux / Windows)

One-shot setup (creates backend/venv with a Python 3.11-3.14, installs deps,
downloads the spaCy model, creates perso.txt from the template):

    git clone https://github.com/fabhoarau/doc-incognito.git
    cd doc-incognito
    ./setup.sh                                   # macOS / Linux (bash)
    powershell -ExecutionPolicy Bypass -File .\setup.ps1   # Windows

Or manually:

    cd backend
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    python -m spacy download fr_core_news_lg

Then fill in your personal data (one entry per line). perso.txt is gitignored
and never leaves your machine:

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
The UI is multilingual (English/French, auto-detected from the browser
language, switchable in the header). To add a language, add a locale file in
frontend/src/i18n/ and register it in localeCodes.

## CLI

Text pipeline (anonymized .txt + metadata-free PDF), from backend/ with the
venv active:

    python -m scripts.anonymize_document path/to/statement.pdf

Irreversible image redaction:

    python -m scripts.redact_image path/to/screenshot.png

## Tests

Backend (pytest, isolated tmp dirs - the real perso.txt is never touched):

    cd backend
    pip install -r requirements-dev.txt
    python -m pytest tests -q

Frontend (vitest + Testing Library, API mocked):

    cd frontend && npm test

## Configuration

All settings live in backend/app/core/config.py (override with ANON_
prefixed environment variables): language, spaCy model, Presidio score
threshold, paths, max upload size (ANON_MAX_UPLOAD_BYTES, default 50 MB).

## Security hardening

- `GET /api/files/{name}` is strictly confined to `output/` (path resolved and
  checked, suffix allowlist, served as attachment) - traversal attempts 404.
- Uploads are validated (PDF/PNG/JPEG only, size-capped) and stored under a
  sanitized file name; domain errors return 422, never a raw 500.
- If the guardrail detects a surviving personal entry, no output file is
  written and the leaked values are masked in the API response and CLI output.

## Security notes

- The server binds to 127.0.0.1 only; the tool makes no outbound network call.
- perso.txt is gitignored: it must contain your real data only locally.
- Rebuilt PDFs are written with empty metadata; redacted images are fresh
  RGB PNGs with zero EXIF.
- The guardrail is the final safety net: if any personal entry survives,
  the process reports it explicitly.
