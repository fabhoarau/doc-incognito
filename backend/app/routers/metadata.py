"""Metadata inspection endpoint."""

from pathlib import Path

from fastapi import APIRouter, File, UploadFile

from app.core.config import settings
from app.schemas.metadata import MetadataReport
from app.services import metadata_service

router = APIRouter(prefix="/api/metadata", tags=["metadata"])


@router.post("/inspect", response_model=MetadataReport)
async def inspect(file: UploadFile = File(...)) -> MetadataReport:
    """Report PDF metadata or image EXIF fields, flagging potential leaks."""
    path = settings.upload_dir / Path(file.filename or "").name
    path.write_bytes(await file.read())
    return metadata_service.inspect(path)
