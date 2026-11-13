"""Metadata inspection for PDFs (pymupdf) and images (EXIF via Pillow)."""

from pathlib import Path

import pymupdf as fitz
from PIL import Image

from app.schemas.metadata import MetadataField, MetadataReport

# Generic technical PDF fields are not personal-data leaks.
_PDF_NEUTRAL_FIELDS = {"format", "encryption", "version"}


def inspect(path: Path) -> MetadataReport:
    """Report the metadata of a file and flag potential identity leaks."""
    if path.suffix.lower() == ".pdf":
        return _inspect_pdf(path)
    return _inspect_image(path)


def _inspect_pdf(path: Path) -> MetadataReport:
    fields: list[MetadataField] = []
    leak_count = 0
    for key, value in fitz.open(path).metadata.items():
        if not value:
            continue
        is_leak = key not in _PDF_NEUTRAL_FIELDS
        fields.append(MetadataField(name=key, value=value, is_leak=is_leak))
        leak_count += is_leak
    return MetadataReport(
        filename=path.name, fields=fields, leak_count=leak_count, is_clean=leak_count == 0
    )


def _inspect_image(path: Path) -> MetadataReport:
    fields: list[MetadataField] = []
    leak_count = 0
    image = Image.open(path)
    exif = image.getexif()
    for key, value in exif.items():
        fields.append(MetadataField(name=f"EXIF {key}", value=str(value)[:60], is_leak=True))
        leak_count += 1
    if not exif and image.info:
        for key, value in image.info.items():
            if isinstance(value, (str, int)) and str(value):
                fields.append(MetadataField(name=key, value=str(value), is_leak=True))
                leak_count += 1
    return MetadataReport(
        filename=path.name, fields=fields, leak_count=leak_count, is_clean=leak_count == 0
    )
