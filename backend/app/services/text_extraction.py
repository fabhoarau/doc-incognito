"""Text extraction: native PDF text, scanned PDFs (ocrmypdf), images (tesseract)."""

import subprocess
import tempfile
from enum import Enum
from pathlib import Path

import pymupdf as fitz
import pytesseract
from PIL import Image

from app.core.config import settings


class ExtractionMode(str, Enum):
    """How the text was obtained from the input file."""

    PDF_TEXT = "pdf-text"
    PDF_OCR = "pdf-ocr"
    IMAGE_OCR = "image-ocr"


def extract_text(path: Path) -> tuple[str, ExtractionMode]:
    """Return the raw text of a document plus its extraction mode."""
    if path.suffix.lower() == ".pdf":
        text = "\n".join(page.get_text() for page in fitz.open(path))
        if text.strip():
            return text, ExtractionMode.PDF_TEXT
        return _ocr_pdf(path), ExtractionMode.PDF_OCR
    return _ocr_image(path), ExtractionMode.IMAGE_OCR


def _ocr_pdf(path: Path) -> str:
    """OCR a scanned PDF with ocrmypdf (installed via Homebrew, not pip)."""
    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
        tmp_path = tmp.name
    try:
        subprocess.run(
            ["ocrmypdf", "-l", settings.ocrmypdf_lang, "--deskew", "--rotate-pages",
             str(path), tmp_path],
            check=True,
            capture_output=True,
        )
        return "\n".join(page.get_text() for page in fitz.open(tmp_path))
    finally:
        Path(tmp_path).unlink(missing_ok=True)


def _ocr_image(path: Path) -> str:
    """OCR an image with tesseract (French)."""
    return pytesseract.image_to_string(Image.open(path), lang=settings.tesseract_lang)
