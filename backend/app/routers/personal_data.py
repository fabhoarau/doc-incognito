"""Personal data list (perso.txt) endpoints."""

from fastapi import APIRouter

from app.schemas.personal_data import PersonalDataContent
from app.services import personal_data

router = APIRouter(prefix="/api/personal-data", tags=["personal-data"])


@router.get("", response_model=PersonalDataContent)
async def get_content() -> PersonalDataContent:
    """Return the raw content of perso.txt (for the editor UI)."""
    return PersonalDataContent(content=personal_data.read_raw())


@router.put("", response_model=PersonalDataContent)
async def update_content(body: PersonalDataContent) -> PersonalDataContent:
    """Overwrite perso.txt with the given content."""
    personal_data.save(body.content)
    return body
