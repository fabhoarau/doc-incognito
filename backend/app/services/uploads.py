"""Shared upload handling: suffix allowlist, size cap, safe on-disk name.

Used by every endpoint that accepts a file (no duplicated logic).
"""

from pathlib import Path

from fastapi import HTTPException, UploadFile
from starlette.concurrency import run_in_threadpool

from app.core.config import settings

ALLOWED_SUFFIXES = {".pdf", ".png", ".jpg", ".jpeg"}
IMAGE_SUFFIXES = {".png", ".jpg", ".jpeg"}

_CHUNK_SIZE = 1024 * 1024


async def save_upload(file: UploadFile) -> Path:
    """Validate and store an upload in uploads/, then return its path.

    - the file name is reduced to its final component (no directory traversal)
    - the content is read in chunks and capped at settings.max_upload_bytes
    - the disk write runs off the event loop
    """
    name = Path(file.filename or "").name
    suffix = Path(name).suffix.lower()
    if not name or name in {".", ".."} or suffix not in ALLOWED_SUFFIXES:
        raise HTTPException(
            status_code=422, detail=f"Unsupported file type: {suffix or 'unknown'}"
        )

    chunks: list[bytes] = []
    size = 0
    while chunk := await file.read(_CHUNK_SIZE):
        size += len(chunk)
        if size > settings.max_upload_bytes:
            max_mb = settings.max_upload_bytes // (1024 * 1024)
            raise HTTPException(
                status_code=413, detail=f"File too large (max {max_mb} MB)"
            )
        chunks.append(chunk)

    settings.upload_dir.mkdir(parents=True, exist_ok=True)
    path = settings.upload_dir / name
    await run_in_threadpool(path.write_bytes, b"".join(chunks))
    return path
