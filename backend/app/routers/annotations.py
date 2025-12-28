"""
Annotations Router - CRUD for note annotations
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.user import User
from app.models.note import Note
from app.models.annotation import Annotation
from app.schemas.annotation import AnnotationCreate, AnnotationUpdate, AnnotationResponse
from app.routers.auth import get_current_user

router = APIRouter(prefix="/notes/{note_id}/annotations", tags=["Annotations"])


async def verify_note_ownership(note_id: int, user_id: int, db: AsyncSession) -> Note:
    """Verify that the note belongs to the user"""
    result = await db.execute(
        select(Note).where(Note.id == note_id, Note.user_id == user_id)
    )
    note = result.scalar_one_or_none()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    return note


@router.get("/", response_model=list[AnnotationResponse])
async def get_annotations(
    note_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all annotations for a note"""
    await verify_note_ownership(note_id, current_user.id, db)
    
    result = await db.execute(
        select(Annotation).where(Annotation.note_id == note_id)
    )
    return result.scalars().all()


@router.post("/", response_model=AnnotationResponse)
async def create_annotation(
    note_id: int,
    annotation_data: AnnotationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new annotation on a note"""
    await verify_note_ownership(note_id, current_user.id, db)
    
    annotation = Annotation(
        note_id=note_id,
        content=annotation_data.content,
        x=annotation_data.x,
        y=annotation_data.y
    )
    db.add(annotation)
    await db.flush()
    await db.refresh(annotation)
    return annotation


@router.put("/{annotation_id}", response_model=AnnotationResponse)
async def update_annotation(
    note_id: int,
    annotation_id: int,
    annotation_data: AnnotationUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update an annotation"""
    await verify_note_ownership(note_id, current_user.id, db)
    
    result = await db.execute(
        select(Annotation).where(
            Annotation.id == annotation_id,
            Annotation.note_id == note_id
        )
    )
    annotation = result.scalar_one_or_none()
    if not annotation:
        raise HTTPException(status_code=404, detail="Annotation not found")
    
    if annotation_data.content is not None:
        annotation.content = annotation_data.content
    if annotation_data.x is not None:
        annotation.x = annotation_data.x
    if annotation_data.y is not None:
        annotation.y = annotation_data.y
    
    await db.flush()
    await db.refresh(annotation)
    return annotation


@router.delete("/{annotation_id}")
async def delete_annotation(
    note_id: int,
    annotation_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete an annotation"""
    await verify_note_ownership(note_id, current_user.id, db)
    
    result = await db.execute(
        select(Annotation).where(
            Annotation.id == annotation_id,
            Annotation.note_id == note_id
        )
    )
    annotation = result.scalar_one_or_none()
    if not annotation:
        raise HTTPException(status_code=404, detail="Annotation not found")
    
    await db.delete(annotation)
    return {"message": "Annotation deleted successfully"}
