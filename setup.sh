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
