"""FastAPI application entry point - local only (127.0.0.1)."""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from PIL import UnidentifiedImageError

from app.core.config import settings
from app.routers import anonymize, metadata, personal_data


async def _value_error_handler(request: Request, exc: ValueError) -> JSONResponse:
    """Domain errors (unsupported content, OCR failure, guardrail) -> 422."""
    return JSONResponse(status_code=422, content={"detail": str(exc)})


async def _unreadable_image_handler(request: Request, exc: UnidentifiedImageError) -> JSONResponse:
    """Corrupted/unreadable image -> 422 instead of a 500."""
    return JSONResponse(status_code=422, content={"detail": "Unreadable or corrupted image file"})


def create_app() -> FastAPI:
    """Application factory."""
    app = FastAPI(
        title="doc-incognito",
        version="1.0.0",
        description="Local-first document anonymizer. 100% offline.",
        docs_url="/api/docs",
    )
    # CORS is limited to the local frontend dev server, with explicit methods
    # and headers (no wildcard).
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_methods=["GET", "POST", "PUT"],
        allow_headers=["Content-Type"],
    )
    app.add_exception_handler(ValueError, _value_error_handler)
    app.add_exception_handler(UnidentifiedImageError, _unreadable_image_handler)
    app.include_router(anonymize.router)
    app.include_router(personal_data.router)
    app.include_router(metadata.router)
    return app


app = create_app()

if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host=settings.host, port=settings.port, reload=True)
