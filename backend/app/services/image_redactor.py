"""Irreversible visual redaction of sensitive zones on images.

Sensitive areas are covered with plain black rectangles, then the image is
re-saved as a brand-new RGB PNG: no original pixel data and no EXIF remain.
"""

import re
from pathlib import Path

import pytesseract
from PIL import Image, ImageDraw

from app.core.analyzer import get_analyzer
from app.core.config import settings
from app.services import guardrail, personal_data

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

    # Personal entries are matched on the FULL OCR text: an entry can span
    # several OCR words (e.g. a first + last name), so a word-by-word match
    # would miss it and leave it visible on the "redacted" image.
    entry_spans: list[tuple[int, int]] = []
    for entry in entries:
        entry_spans.extend(
            m.span() for m in re.finditer(re.escape(entry), text, re.IGNORECASE)
        )

    to_redact: set[int] = set()
    for idx, (word, i) in enumerate(words):
        start, end = offsets[idx], offsets[idx] + len(word)
        hit_by_presidio = any(
            r.start <= start < r.end or r.start < end <= r.end for r in results
        )
        hit_by_entry = any(s <= start < e or s < end <= e for s, e in entry_spans)
        if hit_by_presidio or hit_by_entry:
            to_redact.add(i)

    # Guardrail: what stays visible after redaction must not contain any
    # personal entry. Fails loudly, values never printed.
    visible = " ".join(word for idx, (word, i) in enumerate(words) if i not in to_redact)
    leaks = guardrail.find_leaks(visible, entries)
    if leaks:
        raise ValueError(
            f"Redaction guardrail failed: {len(leaks)} personal "
            f"entr{'y is' if len(leaks) == 1 else 'ies are'} still visible (values masked)"
        )

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
    settings.output_dir.mkdir(parents=True, exist_ok=True)
    out = settings.output_dir / f"{path.stem}_redacted.png"
    clean.save(out)
    return out, len(to_redact)
