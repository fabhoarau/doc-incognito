"""Pydantic models for the personal-data endpoints."""

from pydantic import BaseModel


class PersonalDataContent(BaseModel):
    content: str
