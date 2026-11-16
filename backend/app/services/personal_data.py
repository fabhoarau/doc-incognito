"""Personal data list (perso.txt): one item per line, tokenized as [PERSO n].

Each user keeps their own local copy - the file is gitignored.
"""

import re

from app.core.config import settings
from app.core.patterns import PERSONAL_TOKEN


def load() -> list[str]:
    """Return the non-empty entries of perso.txt."""
    if not settings.personal_data_file.exists():
        return []
    return [
        line.strip()
        for line in settings.personal_data_file.read_text().splitlines()
        if line.strip()
    ]


def read_raw() -> str:
    """Return the raw file content (for the editor UI)."""
    if not settings.personal_data_file.exists():
        return ""
    return settings.personal_data_file.read_text()


def save(content: str) -> None:
    """Overwrite perso.txt with the given content."""
    settings.personal_data_file.write_text(content)


def tokenize(text: str, entries: list[str]) -> str:
    """Replace every personal entry with [PERSO n], case-insensitive.

    Done BEFORE analysis so the entries are never sent to the NLP engine.
    Longest entries are replaced first so that overlapping entries
    ("Jean" / "Jean Dupont") cannot leave a partial residue behind.
    """
    order = sorted(range(len(entries)), key=lambda i: len(entries[i]), reverse=True)
    for i in order:
        text = re.sub(
            re.escape(entries[i]), PERSONAL_TOKEN.format(i + 1), text, flags=re.IGNORECASE
        )
    return text
