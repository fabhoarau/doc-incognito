"""Tests for app.core.config helpers (tesseract path resolution)."""

import shutil
import sys
from pathlib import Path

import pytesseract


def test_configure_tesseract_cmd_noop_when_on_path():
    from app.core.config import configure_tesseract_cmd

    before = pytesseract.pytesseract.tesseract_cmd
    configure_tesseract_cmd()  # tesseract on PATH (or not win32): no change
    assert pytesseract.pytesseract.tesseract_cmd == before


def test_configure_tesseract_cmd_windows_fallback(monkeypatch):
    from app.core import config

    monkeypatch.setattr(shutil, "which", lambda name: None)
    monkeypatch.setattr(sys, "platform", "win32")
    monkeypatch.setattr(
        Path,
        "is_file",
        lambda self: str(self) == r"C:\Program Files\Tesseract-OCR\tesseract.exe",
    )
    monkeypatch.setattr(pytesseract.pytesseract, "tesseract_cmd", "tesseract")
    config.configure_tesseract_cmd()
    assert (
        pytesseract.pytesseract.tesseract_cmd
        == r"C:\Program Files\Tesseract-OCR\tesseract.exe"
    )
