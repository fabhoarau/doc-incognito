# syntax=docker/dockerfile:1
#
# doc-incognito - single local-only container (API + built UI on port 8000).
# perso.txt is NEVER baked into the image: mount it read-only at runtime.
#
# Build:  docker build -t doc-incognito .
# Run:    docker run --rm -p 127.0.0.1:8000:8000 \
#           -v "$PWD/perso.txt:/app/perso.txt:ro" \
#           -v "$PWD/output:/app/output" -v "$PWD/uploads:/app/uploads" \
#           doc-incognito
# Or simply: docker compose up --build   (see docker-compose.yml)

# ---- Stage 1: build the frontend (Vite -> static dist) ----
FROM node:22-alpine AS frontend-build
WORKDIR /build
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY frontend/ ./
RUN npm run build

# ---- Stage 2: Python backend + system OCR tools ----
FROM python:3.12-slim-bookworm AS runtime
ENV DEBIAN_FRONTEND=noninteractive \
    PIP_NO_CACHE_DIR=1 \
    PYTHONDONTWRITEBYTECODE=1

# ocrmypdf shells out to tesseract + ghostscript; poppler-utils provides
# pdfinfo/pdfimages. tesseract-ocr-fra ships fra.traineddata (OCR runs -l fra).
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       tesseract-ocr tesseract-ocr-fra ghostscript poppler-utils \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app/backend
COPY backend/requirements.txt ./requirements.txt
RUN pip install --upgrade pip \
    && pip install -r requirements.txt \
    && pip install ocrmypdf \
    && python -m spacy download fr_core_news_lg

COPY backend/app ./app
COPY --from=frontend-build /build/dist /app/frontend/dist

# Runtime layout mirrors the repo root so config paths resolve to /app:
#   /app/perso.txt (mounted ro), /app/uploads, /app/output, /app/frontend/dist
RUN useradd -m appuser \
    && mkdir -p /app/uploads /app/output \
    && chown -R appuser /app
USER appuser

# 0.0.0.0 INSIDE the container only: the port is published on the host's
# loopback (127.0.0.1:8000:8000), so nothing is reachable from the network.
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --start-period=90s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/api/docs')" || exit 1

CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
