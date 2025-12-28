"""
Annotation Schemas
"""
from datetime import datetime
from pydantic import BaseModel, Field


class AnnotationCreate(BaseModel):
    content: str = Field(..., min_length=1)
    x: float = Field(..., ge=0, le=100)
    y: float = Field(..., ge=0, le=100)


class AnnotationUpdate(BaseModel):
    content: str | None = Field(None, min_length=1)
    x: float | None = Field(None, ge=0, le=100)
    y: float | None = Field(None, ge=0, le=100)


class AnnotationResponse(BaseModel):
    id: int
    note_id: int
    content: str
    x: float
    y: float
    created_at: datetime

    class Config:
        from_attributes = True
