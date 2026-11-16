# doc-incognito

<img src="frontend/public/favicon.svg" width="96" alt="doc-incognito logo" />

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Tests](https://img.shields.io/badge/tests-35%20pytest%20%2B%2017%20vitest-green.svg)]()

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
    |- Dockerfile             # multi-stage image: frontend build + backend runtime
    |- docker-compose.yml     # publishes 127.0.0.1:8000 only, mounts perso.txt read-only
    |- .dockerignore          # keeps perso.txt, uploads/, output/, venv out of the image
    |- LICENSE                # MIT
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

- Docker Desktop (macOS / Windows) or Docker Engine + Compose v2 (Linux).
  That is all: the image bundles Python 3.12, tesseract **with the French
  language data** (`fra`), ghostscript, ocrmypdf and the spaCy model.

## Installation (Docker only)

Everything (Python, tesseract+french, ghostscript, ocrmypdf, spaCy model, built
UI) ships in one image. The container publishes on your loopback only, and
`perso.txt` is mounted read-only - it is never baked into the image.

    git clone https://github.com/fabhoarau/doc-incognito.git
    cd doc-incognito
    cp perso.txt.example perso.txt     # fill in your personal data, one entry per line
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
(~2.7 GB) because of the spaCy `fr_core_news_lg` model. perso.txt is
gitignored and never leaves your machine.

## Usage

With `docker compose up --build` (see Installation), everything is served by
one process:

- Web UI: http://127.0.0.1:8000
- Interactive API docs: http://127.0.0.1:8000/api/docs

The UI has three tabs: Anonymize (text pipeline + image redaction), My
personal data (perso.txt editor), Metadata check. It is multilingual
(English/French, auto-detected from the browser language, switchable in the
header). To add a language, add a locale file in frontend/src/i18n/ and
register it in localeCodes.

## CLI

Inside the running container (files under /app/uploads, results land in
/app/output = ./output on your host):

    docker compose exec doc-incognito python -m scripts.anonymize_document /app/uploads/statement.pdf
    docker compose exec doc-incognito python -m scripts.redact_image /app/uploads/screenshot.png

## Tests

Contributors run the suites natively (the app itself always runs in Docker).
Bootstrap a dev venv once (Python 3.11-3.14 - presidio rejects 3.15+; the OCR
tests also need tesseract with `fra` + ghostscript + ocrmypdf on the dev
machine: `brew install tesseract tesseract-lang ocrmypdf ghostscript` on
macOS, `sudo apt install tesseract-ocr tesseract-ocr-fra ocrmypdf ghostscript`
on Linux):

    python3 -m venv backend/venv
    backend/venv/bin/pip install -r backend/requirements.txt -r backend/requirements-dev.txt ocrmypdf
    backend/venv/bin/python -m spacy download fr_core_news_lg

Backend (pytest, isolated tmp dirs - the real perso.txt is never touched):

    cd backend && ./venv/bin/python -m pytest tests -q

Frontend (vitest + Testing Library, API mocked):

    cd frontend && npm install && npm test && npm run build

## Configuration

All settings live in backend/app/core/config.py (override with ANON_
prefixed environment variables): language, spaCy model, Presidio score
threshold, paths, max upload size (ANON_MAX_UPLOAD_BYTES, default 50 MB),
and ANON_FRONTEND_DIST (built UI served at / when the directory exists -
default frontend/dist, used by the Docker image).

## Security hardening

- `GET /api/files/{name}` is strictly confined to `output/` (path resolved and
  checked, suffix allowlist, served as attachment) - traversal attempts 404.
- Uploads are validated (PDF/PNG/JPEG only, size-capped) and stored under a
  sanitized file name; domain errors return 422, never a raw 500.
- If the guardrail detects a surviving personal entry, no output file is
  written and the leaked values are masked in the API response and CLI output.

## Security notes

- Native: the server binds to 127.0.0.1 only. Docker: uvicorn binds 0.0.0.0
  *inside the container* (required for port forwarding), but compose publishes
  `127.0.0.1:8000:8000` - never change that to `0.0.0.0:...`. Either way the
  tool makes no outbound network call and is unreachable from the network.
- perso.txt is gitignored: it must contain your real data only locally.
- Rebuilt PDFs are written with empty metadata; redacted images are fresh
  RGB PNGs with zero EXIF.
- The guardrail is the final safety net: if any personal entry survives,
  the process reports it explicitly.
