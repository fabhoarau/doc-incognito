"""Application settings - single source of truth for configuration."""

from pathlib import Path

from pydantic_settings import BaseSettings

# backend/app/core/config.py -> repo root
BASE_DIR = Path(__file__).resolve().parents[3]


class Settings(BaseSettings):
    """All runtime configuration. Override with ANON_ prefixed env vars."""

    # Local-only HTTP server (never exposed to the network).
    # WARNING: ANON_HOST=0.0.0.0 would expose the API (and the perso.txt
    # editor endpoints) to the local network - never do that.
    host: str = "127.0.0.1"
    port: int = 8000
    cors_origins: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]

    # Uploads are read in memory (bounded), then written to disk
    max_upload_bytes: int = 50 * 1024 * 1024

    # Presidio / NLP
    language: str = "fr"
    spacy_model: str = "fr_core_news_lg"
    score_threshold: float = 0.5
    pattern_score: float = 0.9
    tesseract_lang: str = "fra"
    ocrmypdf_lang: str = "fra"

    # Paths
    base_dir: Path = BASE_DIR
    personal_data_file: Path = BASE_DIR / "perso.txt"
    upload_dir: Path = BASE_DIR / "uploads"
    output_dir: Path = BASE_DIR / "output"

    model_config = {"env_prefix": "ANON_"}


# No filesystem side effect at import time: writers create the dirs on demand
# (keeps tests and imports clean - see conftest.py).
settings = Settings()
