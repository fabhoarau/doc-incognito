#!/usr/bin/env bash
# One-shot setup for doc-incognito (backend).
# Requires Python 3.11-3.14: presidio 2.2.366 does not support Python 3.15+.
set -euo pipefail
cd "$(dirname "$0")"

PY=""
for candidate in python3.14 python3.13 python3.12 python3.11; do
  if command -v "$candidate" >/dev/null 2>&1; then PY="$candidate"; break; fi
done
if [ -z "$PY" ]; then
  echo "ERROR: no Python 3.11-3.14 found. Install one (brew install python@3.14) and retry."
  exit 1
fi
echo "Using $($PY --version)"

# OCR tools (installed system-wide, not via pip - see README > Requirements)
for tool in tesseract ocrmypdf; do
  if ! command -v "$tool" >/dev/null 2>&1; then
    echo "WARNING: '$tool' not found on PATH - OCR will fail."
    case "$(uname -s)" in
      Darwin) echo "  macOS:        brew install tesseract tesseract-lang ocrmypdf" ;;
      Linux)  echo "  Debian/Ubuntu: sudo apt install tesseract-ocr tesseract-ocr-fra ocrmypdf ghostscript" ;;
    esac
  fi
done
if command -v tesseract >/dev/null 2>&1 && ! tesseract --list-langs 2>/dev/null | grep -q '^fra$'; then
  echo "WARNING: tesseract has no 'fra' language - OCR runs with -l fra (see README)."
fi

cd backend
rm -rf venv
"$PY" -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
python -m spacy download fr_core_news_lg

cd ..
if [ ! -f perso.txt ]; then
  cp perso.txt.example perso.txt
  echo "Created perso.txt - fill it with your personal data."
fi

echo ""
echo "Setup complete. Start the API with:"
echo "  source backend/venv/bin/activate"
echo "  cd backend && uvicorn app.main:app --reload"
