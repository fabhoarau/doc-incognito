"""Anonymization, redaction and download endpoints."""

from pathlib import Path

from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import FileResponse

from app.core.config import settings
from app.schemas.anonymize import AnonymizationResult, OutputFile, RedactionResult
from app.services import anonymizer, image_redactor

router = APIRouter(prefix="/api", tags=["anonymize"])

_ALLOWED_SUFFIXES = {".pdf", ".png", ".jpg", ".jpeg"}
_IMAGE_SUFFIXES = {".png", ".jpg", ".jpeg"}


@router.post("/anonymize", response_model=AnonymizationResult)
async def anonymize(file: UploadFile = File(...)) -> AnonymizationResult:
    """Text pipeline: OCR if needed, Presidio anonymization, metadata-free outputs."""
    path = await _save_upload(file)
    try:
        return anonymizer.anonymize_document(path)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.post("/redact", response_model=RedactionResult)
async def redact(file: UploadFile = File(...)) -> RedactionResult:
    """Irreversible black redaction of sensitive zones on an image."""
    path = await _save_upload(file)
    if path.suffix.lower() not in _IMAGE_SUFFIXES:
        raise HTTPException(status_code=422, detail="Redaction only supports images")
    output, zone_count = image_redactor.redact_image(path)
    return RedactionResult(
        input_name=path.name,
        output_file=OutputFile(
            filename=output.name,
            label="Redacted image (metadata-free PNG)",
            download_url=f"/api/files/{output.name}",
        ),
        redacted_zone_count=zone_count,
    )


@router.get("/files/{filename}")
async def download(filename: str) -> FileResponse:
    """Download an anonymized output file."""
    path = settings.output_dir / filename
    if not path.is_file():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(path)


async def _save_upload(file: UploadFile) -> Path:
    """Store the upload in the local uploads directory and return its path."""
    suffix = Path(file.filename or "").suffix.lower()
    if suffix not in _ALLOWED_SUFFIXES:
        raise HTTPException(status_code=422, detail=f"Unsupported file type: {suffix or 'unknown'}")
    path = settings.upload_dir / Path(file.filename).name
    path.write_bytes(await file.read())
    return path
