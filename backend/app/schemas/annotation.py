"""
Annotation Schemas
"""
from datetime import datetime
from pydantic import BaseModel, Field


class AnnotationCreate(BaseModel):
    content: str = Field(..., min_length=1)
    x: float = Field(..., ge=0, le=100)
    y: float = Field(..., ge=0, le=100)
    fontSize: float = Field(default=1.5)
    color: str = Field(default="#1890ff")


class AnnotationUpdate(BaseModel):
    content: str | None = Field(None, min_length=1)
    x: float | None = Field(None, ge=0, le=100)
    y: float | None = Field(None, ge=0, le=100)
    fontSize: float | None = None
    color: str | None = None


class AnnotationResponse(BaseModel):
    id: int
    note_id: int
    content: str
    x: float
    y: float
    fontSize: float | None = 1.5
    color: str | None = "#1890ff"
    created_at: datetime

    class Config:
        from_attributes = True
