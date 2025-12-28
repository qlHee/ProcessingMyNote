"""
Folder Schemas
"""
from datetime import datetime
from pydantic import BaseModel, Field


class FolderCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    parent_id: int | None = None


class FolderUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=100)
    parent_id: int | None = None


class FolderResponse(BaseModel):
    id: int
    name: str
    parent_id: int | None
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class FolderTree(BaseModel):
    id: int
    name: str
    parent_id: int | None
    children: list["FolderTree"] = []

    class Config:
        from_attributes = True
