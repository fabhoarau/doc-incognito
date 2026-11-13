"""Irreversible visual redaction of sensitive zones on images.

Sensitive areas are covered with plain black rectangles, then the image is
re-saved as a brand-new RGB PNG: no original pixel data and no EXIF remain.
"""

from pathlib import Path

import pytesseract
from PIL import Image, ImageDraw

from app.core.analyzer import get_analyzer
from app.core.config import settings
from app.services import personal_data

# Pixels of redaction padding around each detected word
_MARGIN = 5


def redact_image(path: Path) -> tuple[Path, int]:
    """Redact an image and return (output path, redacted zone count)."""
    entries = personal_data.load()
    image = Image.open(path).convert("RGB")
    data = pytesseract.image_to_data(
        image, lang=settings.tesseract_lang, output_type=pytesseract.Output.DICT
    )

    # Rebuild a linear text with word offsets, keeping the OCR word index.
    words: list[tuple[str, int]] = []
    offsets: list[int] = []
    text = ""
    for i, word in enumerate(data["text"]):
        if not word.strip():
            continue
        offsets.append(len(text))
        text += word + " "
        words.append((word, i))
        if i + 1 < len(data["text"]) and data["line_num"][i + 1] != data["line_num"][i]:
            text += "\n"

    results = get_analyzer().analyze(
        text=text, language=settings.language, score_threshold=settings.score_threshold
    )

    to_redact: set[int] = set()
    for idx, (word, i) in enumerate(words):
        start, end = offsets[idx], offsets[idx] + len(word)
        hit_by_presidio = any(
            r.start <= start < r.end or r.start < end <= r.end for r in results
        )
        hit_by_personal = any(entry.lower() in word.lower() for entry in entries)
        if hit_by_presidio or hit_by_personal:
            to_redact.add(i)

    draw = ImageDraw.Draw(image)
    for i in to_redact:
        x, y, w, h = data["left"][i], data["top"][i], data["width"][i], data["height"][i]
        draw.rectangle(
            [max(0, x - _MARGIN), max(0, y - _MARGIN), x + w + _MARGIN, y + h + _MARGIN],
            fill="black",
        )

    # Fresh RGB copy guarantees a metadata-free PNG.
    clean = Image.new("RGB", image.size)
    clean.paste(image)
    out = path.with_name(f"{path.stem}_redacted.png")
    clean.save(out)
    return out, len(to_redact)
