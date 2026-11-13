"""Pydantic models for the anonymization and redaction endpoints."""

from pydantic import BaseModel

from app.services.text_extraction import ExtractionMode


class ReplacementSummary(BaseModel):
    """Number of replacements for one entity type."""

    entity_type: str
    count: int


class OutputFile(BaseModel):
    filename: str
    label: str
    download_url: str


class AnonymizationResult(BaseModel):
    """Result of the text pipeline (PDF or image -> anonymized outputs)."""

    input_name: str
    extraction_mode: ExtractionMode
    total_replacements: int
    replacements: list[ReplacementSummary]
    output_files: list[OutputFile]
    guardrail_passed: bool
    leaks: list[str]


class RedactionResult(BaseModel):
    """Result of the irreversible image redaction."""

    input_name: str
    output_file: OutputFile
    redacted_zone_count: int
