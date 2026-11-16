"""Metadata inspection endpoint."""

from fastapi import APIRouter, File, UploadFile

from app.schemas.metadata import MetadataReport
from app.services import metadata_service
from app.services.uploads import save_upload

router = APIRouter(prefix="/api/metadata", tags=["metadata"])


@router.post("/inspect", response_model=MetadataReport)
async def inspect(file: UploadFile = File(...)) -> MetadataReport:
    """Report PDF metadata or image EXIF fields, flagging potential leaks."""
    path = await save_upload(file)
    return metadata_service.inspect(path)
