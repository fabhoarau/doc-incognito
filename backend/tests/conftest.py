"""Shared fixtures.

Every test runs against isolated tmp dirs/files: the real perso.txt,
uploads/ and output/ of the repo are never touched (autouse fixture
monkeypatches the settings paths).
"""

from pathlib import Path

import fitz
import pytest
from PIL import Image, ImageDraw, ImageFont

from app.core.config import settings

TEST_PERSO = "Jean Dupont\njean.dupont@example.fr\n"


@pytest.fixture(autouse=True)
def isolated_settings(tmp_path, monkeypatch):
    perso = tmp_path / "perso.txt"
    perso.write_text(TEST_PERSO)
    upload_dir = tmp_path / "uploads"
    output_dir = tmp_path / "output"
    upload_dir.mkdir()
    output_dir.mkdir()
    monkeypatch.setattr(settings, "personal_data_file", perso)
    monkeypatch.setattr(settings, "upload_dir", upload_dir)
    monkeypatch.setattr(settings, "output_dir", output_dir)
    return settings


def _make_pdf(path: Path, text: str, metadata: dict | None = None) -> Path:
    doc = fitz.open()
    if metadata:
        doc.set_metadata(metadata)
    page = doc.new_page()
    page.insert_text((50, 50), text)
    doc.save(path)
    return path


def _make_image(path: Path, text: str, exif: dict[int, str] | None = None) -> Path:
    img = Image.new("RGB", (1600, 300), "white")
    draw = ImageDraw.Draw(img)
    try:
        font = ImageFont.truetype("/Library/Fonts/Arial.ttf", 44)
    except OSError:
        font = ImageFont.load_default(size=44)
    draw.text((40, 60), text, fill="black", font=font)
    if exif:
        e = Image.Exif()
        for key, value in exif.items():
            e[key] = value
        img.save(path, exif=e)
    else:
        img.save(path)
    return path


@pytest.fixture
def make_pdf():
    return _make_pdf


@pytest.fixture
def make_image():
    return _make_image
