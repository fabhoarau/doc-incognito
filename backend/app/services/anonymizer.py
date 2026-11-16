"""Text anonymization pipeline.

extract -> tokenize personal data -> Presidio analysis/anonymization
-> anonymized .txt (+ rebuilt metadata-free PDF) -> guardrail check.
"""

from collections import Counter
from pathlib import Path
from urllib.parse import quote

import pymupdf as fitz
from presidio_anonymizer import AnonymizerEngine

from app.core.analyzer import get_analyzer
from app.core.config import settings
from app.schemas.anonymize import AnonymizationResult, OutputFile, ReplacementSummary
from app.services import guardrail, personal_data
from app.services.text_extraction import extract_text

# Layout of the rebuilt anonymized PDF
_PDF_MARGIN = 50
_PDF_LINE_HEIGHT = 14
_PDF_BOTTOM_LIMIT = 780
_PDF_MAX_LINE_WIDTH = 110


def anonymize_document(path: Path) -> AnonymizationResult:
    """Run the full text pipeline on a document and write the outputs."""
    entries = personal_data.load()
    text, mode = extract_text(path)
    if not text.strip():
        raise ValueError("No text could be extracted from the document")

    text = personal_data.tokenize(text, entries)
    analyzer_results = get_analyzer().analyze(
        text=text, language=settings.language, score_threshold=settings.score_threshold
    )
    anonymized = AnonymizerEngine().anonymize(text=text, analyzer_results=analyzer_results).text

    replacements = [
        ReplacementSummary(entity_type=entity, count=count)
        for entity, count in Counter(r.entity_type for r in analyzer_results).most_common()
    ]

    # Guardrail runs BEFORE any output file is written: if a personal entry
    # survived, no downloadable file is produced and the leak values are
    # masked (never sent in clear in the API response).
    leaks = guardrail.find_leaks(anonymized, entries)
    output_files: list[OutputFile] = []
    if not leaks:
        output_files.append(_write_text_output(path, anonymized))
        if path.suffix.lower() == ".pdf":
            output_files.append(_write_pdf_output(path, anonymized))
    return AnonymizationResult(
        input_name=path.name,
        extraction_mode=mode,
        total_replacements=len(analyzer_results),
        replacements=replacements,
        output_files=output_files,
        guardrail_passed=not leaks,
        leaks=[guardrail.mask_leak(leak) for leak in leaks],
    )


def _write_text_output(path: Path, text: str) -> OutputFile:
    """Write the anonymized .txt file."""
    settings.output_dir.mkdir(parents=True, exist_ok=True)
    out = settings.output_dir / f"{path.stem}_anonymized.txt"
    out.write_text(text)
    return OutputFile(
        filename=out.name,
        label="Anonymized text (.txt)",
        download_url=f"/api/files/{quote(out.name)}",
    )


def _write_pdf_output(path: Path, text: str) -> OutputFile:
    """Rebuild a fresh PDF with empty metadata - no trace of the original."""
    doc = fitz.open()
    doc.set_metadata({})
    page = doc.new_page()
    y = _PDF_MARGIN
    for line in text.split("\n"):
        if y > _PDF_BOTTOM_LIMIT:
            page = doc.new_page()
            y = _PDF_MARGIN
        page.insert_text((_PDF_MARGIN, y), line[:_PDF_MAX_LINE_WIDTH], fontsize=10)
        y += _PDF_LINE_HEIGHT
    settings.output_dir.mkdir(parents=True, exist_ok=True)
    out = settings.output_dir / f"{path.stem}_anonymized.pdf"
    doc.save(out)
    return OutputFile(
        filename=out.name,
        label="Anonymized PDF (metadata-free)",
        download_url=f"/api/files/{quote(out.name)}",
    )
