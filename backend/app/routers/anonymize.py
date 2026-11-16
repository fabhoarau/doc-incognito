"""Anonymization, redaction and download endpoints."""

from urllib.parse import quote

from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import FileResponse

from app.core.config import settings
from app.schemas.anonymize import AnonymizationResult, OutputFile, RedactionResult
from app.services import anonymizer, image_redactor
from app.services.uploads import IMAGE_SUFFIXES, save_upload

router = APIRouter(prefix="/api", tags=["anonymize"])

# Only anonymized/redacted outputs may be served back
_OUTPUT_SUFFIXES = {".pdf", ".txt", ".png"}


@router.post("/anonymize", response_model=AnonymizationResult)
async def anonymize(file: UploadFile = File(...)) -> AnonymizationResult:
    """Text pipeline: OCR if needed, Presidio anonymization, metadata-free outputs."""
    path = await save_upload(file)
    # ValueError (no text, guardrail failure, ...) -> 422 via the global handler
    return anonymizer.anonymize_document(path)


@router.post("/redact", response_model=RedactionResult)
async def redact(file: UploadFile = File(...)) -> RedactionResult:
    """Irreversible black redaction of sensitive zones on an image."""
    path = await save_upload(file)
    if path.suffix.lower() not in IMAGE_SUFFIXES:
        raise HTTPException(status_code=422, detail="Redaction only supports images")
    output, zone_count = image_redactor.redact_image(path)
    return RedactionResult(
        input_name=path.name,
        output_file=OutputFile(
            filename=output.name,
            label="Redacted image (metadata-free PNG)",
            download_url=f"/api/files/{quote(output.name)}",
        ),
        redacted_zone_count=zone_count,
    )


@router.get("/files/{filename}")
async def download(filename: str) -> FileResponse:
    """Download an anonymized output file, strictly confined to output/.

    The path is resolved and checked to stay inside output/ (defense in
    depth on top of the router: a "../perso.txt" must never be served), the
    suffix is allowlisted, and Content-Disposition: attachment is set so the
    file is never rendered inline by the browser.
    """
    output_root = settings.output_dir.resolve()
    path = (output_root / filename).resolve()
    if (
        not path.is_relative_to(output_root)
        or path.suffix.lower() not in _OUTPUT_SUFFIXES
        or not path.is_file()
    ):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(path, filename=path.name)
