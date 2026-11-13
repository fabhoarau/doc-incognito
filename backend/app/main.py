"""FastAPI application entry point - local only (127.0.0.1)."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routers import anonymize, metadata, personal_data


def create_app() -> FastAPI:
    """Application factory."""
    app = FastAPI(
        title="doc-incognito",
        version="1.0.0",
        description="Local-first document anonymizer. 100% offline.",
        docs_url="/api/docs",
    )
    # CORS is limited to the local frontend dev server.
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(anonymize.router)
    app.include_router(personal_data.router)
    app.include_router(metadata.router)
    return app


app = create_app()

if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host=settings.host, port=settings.port, reload=True)
