"""Pydantic models for the metadata inspection endpoint."""

from pydantic import BaseModel


class MetadataField(BaseModel):
    name: str
    value: str
    is_leak: bool


class MetadataReport(BaseModel):
    filename: str
    fields: list[MetadataField]
    leak_count: int
    is_clean: bool
