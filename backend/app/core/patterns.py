"""French custom regex recognizers - single source shared by API and CLI."""

from typing import Final

# (entity name, regex) - French financial-document patterns.
FRENCH_PATTERNS: Final[list[tuple[str, str]]] = [
    ("DATE_FR", r"\b\d{1,2}(er)?\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+\d{4}\b"),
    ("NUM_CONTRAT", r"(?:n°|numéro|N°|no\.)\s?\d{6,10}\b"),
    ("RCS_SIRET", r"\b\d{3}[\s]?\d{3}[\s]?\d{3}\s?RCS\b|\bRCS\s?\d{9}\b"),
    ("TEL_FR", r"\b01-9{4}\b"),
    ("CODE_POSTAL_VILLE", r"\b\d{5}\s+[A-ZÉÈ]{2,}\b"),
    ("NUM_LONG", r"\b\d{9,14}\b"),
    ("HEX_ID", r"\b[0-9a-f]{16,64}\b"),
    ("IBAN_FR", r"\bFR\d{2}[\s]?\d{4}[\s]?\d{4}[\s]?\d{4}[\s]?\d{4}[\s]?\d{3}\b"),
    ("EMAIL", r"[\w.-]+@[\w.-]+\.\w+"),
    ("ADRESSE", r"\b\d{1,3}\s+(rue|avenue|boulevard|bd|chemin|allée|place|impasse|allee)\b[^\n]{0,40}"),
]

# Personal data token format, e.g. [PERSO1]
PERSONAL_TOKEN: Final[str] = "[PERSO{}]"
