"""
Note Schemas
"""
from datetime import datetime
from pydantic import BaseModel, Field
from app.schemas.tag import TagResponse


class ProcessingParams(BaseModel):
    """Image processing parameters"""
    block_size: int = Field(default=11, ge=3, le=99)
    c: int = Field(default=2, ge=-50, le=50)
    contrast: float = Field(default=1.0, ge=0.1, le=3.0)
    brightness: int = Field(default=0, ge=-100, le=100)
    denoise_strength: int = Field(default=10, ge=0, le=30)


class NoteCreate(BaseModel):
    title: str | None = None
    folder_id: int | None = None
    tag_ids: list[int] = []


class NoteUpdate(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=200)
    folder_id: int | None = None
    tag_ids: list[int] | None = None


class NoteResponse(BaseModel):
    id: int
    title: str
    original_path: str
    processed_path: str | None
    folder_id: int | None
    user_id: int
    processing_params: dict | None
    tags: list[TagResponse] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class NoteListResponse(BaseModel):
    id: int
    title: str
    processed_path: str | None
    folder_id: int | None
    tags: list[TagResponse] = []
    created_at: datetime

    class Config:
        from_attributes = True
