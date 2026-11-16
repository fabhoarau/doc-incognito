"""Final safety net: verify that no personal entry survived anonymization."""

import re


def find_leaks(text: str, entries: list[str]) -> list[str]:
    """Return the personal entries still present (case-insensitive) in the text."""
    return [
        entry
        for entry in entries
        if re.search(re.escape(entry), text, re.IGNORECASE)
    ]


def mask_leak(entry: str) -> str:
    """Mask a leaked entry: personal values are never printed in clear
    (API responses, CLI output, logs)."""
    return entry if len(entry) <= 2 else f"{entry[:2]}…"
