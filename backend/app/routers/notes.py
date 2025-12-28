"""
Notes Router - Full CRUD for notes with image upload and processing
"""
import uuid
import shutil
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, status
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, and_
from sqlalchemy.orm import selectinload
from typing import Optional

from app.database import get_db
from app.config import settings
from app.models.user import User
from app.models.note import Note, NoteTag
from app.models.tag import Tag
from app.models.folder import Folder
from app.schemas.note import NoteCreate, NoteUpdate, NoteResponse, NoteListResponse, ProcessingParams
from app.routers.auth import get_current_user
from app.services.image_processor import ImageProcessor, process_note_image
from app.services.ocr_service import generate_title_from_image, extract_text_from_image

router = APIRouter(prefix="/notes", tags=["Notes"])

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"}


def validate_image(filename: str) -> bool:
    """Check if file extension is allowed"""
    return Path(filename).suffix.lower() in ALLOWED_EXTENSIONS


@router.get("/", response_model=list[NoteListResponse])
async def get_notes(
    folder_id: Optional[int] = Query(None, description="Filter by folder"),
    tag_ids: Optional[str] = Query(None, description="Filter by tag IDs (comma-separated)"),
    keyword: Optional[str] = Query(None, description="Search keyword"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all notes with optional filters
    - folder_id: Filter by folder
    - tag_ids: Filter by tags (comma-separated IDs)
    - keyword: Search in title and OCR text
    """
    query = select(Note).where(Note.user_id == current_user.id).options(selectinload(Note.tags))
    
    # Filter by folder
    if folder_id is not None:
        query = query.where(Note.folder_id == folder_id)
    
    # Filter by tags
    if tag_ids:
        tag_id_list = [int(tid.strip()) for tid in tag_ids.split(",") if tid.strip()]
        if tag_id_list:
            query = query.join(NoteTag).where(NoteTag.c.tag_id.in_(tag_id_list))
    
    # Search keyword
    if keyword:
        keyword_pattern = f"%{keyword}%"
        query = query.where(
            or_(
                Note.title.ilike(keyword_pattern),
                Note.ocr_text.ilike(keyword_pattern)
            )
        )
    
    query = query.order_by(Note.updated_at.desc())
    result = await db.execute(query)
    return result.scalars().unique().all()


@router.get("/{note_id}/", response_model=NoteResponse)
async def get_note(
    note_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a single note by ID"""
    result = await db.execute(
        select(Note)
        .where(Note.id == note_id, Note.user_id == current_user.id)
        .options(selectinload(Note.tags))
    )
    note = result.scalar_one_or_none()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    return note


@router.post("/upload/", response_model=NoteResponse)
async def upload_note(
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    folder_id: Optional[int] = Form(None),
    tag_ids: Optional[str] = Form(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Upload a new note image
    - Automatically processes image (white paper, black text effect)
    - Runs OCR to extract text and generate title
    """
    # Validate file type
    if not file.filename or not validate_image(file.filename):
        raise HTTPException(status_code=400, detail="Invalid file type. Allowed: jpg, jpeg, png, gif, bmp, webp")
    
    # Validate folder if provided
    if folder_id:
        folder_result = await db.execute(
            select(Folder).where(Folder.id == folder_id, Folder.user_id == current_user.id)
        )
        if not folder_result.scalar_one_or_none():
            raise HTTPException(status_code=404, detail="Folder not found")
    
    # Generate unique filename
    file_ext = Path(file.filename).suffix.lower()
    unique_name = f"{uuid.uuid4().hex}{file_ext}"
    original_path = settings.ORIGINAL_DIR / unique_name
    processed_path = settings.PROCESSED_DIR / f"{unique_name.rsplit('.', 1)[0]}_processed{file_ext}"
    
    try:
        # Save original file
        with open(original_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Process image
        processor = ImageProcessor()
        processor.process(str(original_path), str(processed_path))
        
        # Extract text and generate title
        ocr_text = extract_text_from_image(str(processed_path))
        auto_title = title or generate_title_from_image(str(processed_path))
        
        # Create note record
        note = Note(
            title=auto_title,
            original_path=str(original_path.relative_to(settings.BASE_DIR)),
            processed_path=str(processed_path.relative_to(settings.BASE_DIR)),
            ocr_text=ocr_text,
            folder_id=folder_id,
            user_id=current_user.id,
            processing_params=processor.params.to_dict()
        )
        db.add(note)
        await db.flush()
        
        # Add tags if provided
        if tag_ids:
            tag_id_list = [int(tid.strip()) for tid in tag_ids.split(",") if tid.strip()]
            for tid in tag_id_list:
                tag_result = await db.execute(
                    select(Tag).where(Tag.id == tid, Tag.user_id == current_user.id)
                )
                tag = tag_result.scalar_one_or_none()
                if tag:
                    note.tags.append(tag)
        
        await db.flush()
        await db.refresh(note)
        
        # Load tags relationship
        result = await db.execute(
            select(Note).where(Note.id == note.id).options(selectinload(Note.tags))
        )
        return result.scalar_one()
        
    except Exception as e:
        # Cleanup on error
        if original_path.exists():
            original_path.unlink()
        if processed_path.exists():
            processed_path.unlink()
        raise HTTPException(status_code=500, detail=f"Failed to process image: {str(e)}")


@router.put("/{note_id}/", response_model=NoteResponse)
async def update_note(
    note_id: int,
    note_data: NoteUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update note metadata (title, folder, tags)"""
    result = await db.execute(
        select(Note)
        .where(Note.id == note_id, Note.user_id == current_user.id)
        .options(selectinload(Note.tags))
    )
    note = result.scalar_one_or_none()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    # Update fields
    if note_data.title is not None:
        note.title = note_data.title
    if note_data.folder_id is not None:
        note.folder_id = note_data.folder_id
    
    # Update tags
    if note_data.tag_ids is not None:
        note.tags.clear()
        for tid in note_data.tag_ids:
            tag_result = await db.execute(
                select(Tag).where(Tag.id == tid, Tag.user_id == current_user.id)
            )
            tag = tag_result.scalar_one_or_none()
            if tag:
                note.tags.append(tag)
    
    await db.flush()
    await db.refresh(note)
    return note


@router.post("/{note_id}/reprocess/", response_model=NoteResponse)
async def reprocess_note(
    note_id: int,
    params: ProcessingParams,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Reprocess note image with new parameters
    Used for manual adjustment or AI-driven adjustment
    """
    result = await db.execute(
        select(Note)
        .where(Note.id == note_id, Note.user_id == current_user.id)
        .options(selectinload(Note.tags))
    )
    note = result.scalar_one_or_none()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    original_path = settings.BASE_DIR / note.original_path
    if not original_path.exists():
        raise HTTPException(status_code=404, detail="Original image not found")
    
    # Reprocess with new params
    processed_path = settings.BASE_DIR / note.processed_path
    processor = ImageProcessor()
    processor.process_with_params(
        str(original_path),
        str(processed_path),
        params.model_dump()
    )
    
    # Update params in database
    note.processing_params = params.model_dump()
    await db.flush()
    await db.refresh(note)
    return note


@router.delete("/{note_id}/")
async def delete_note(
    note_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a note and its images"""
    result = await db.execute(
        select(Note).where(Note.id == note_id, Note.user_id == current_user.id)
    )
    note = result.scalar_one_or_none()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    # Delete image files
    try:
        original_path = settings.BASE_DIR / note.original_path
        processed_path = settings.BASE_DIR / note.processed_path
        if original_path.exists():
            original_path.unlink()
        if processed_path and processed_path.exists():
            processed_path.unlink()
    except Exception:
        pass  # Continue even if file deletion fails
    
    await db.delete(note)
    return {"message": "Note deleted successfully"}


@router.get("/{note_id}/image/{image_type}")
async def get_note_image(
    note_id: int,
    image_type: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Get note image file (public access)
    - image_type: 'original', 'processed', or 'annotated'
    """
    result = await db.execute(
        select(Note).where(Note.id == note_id)
    )
    note = result.scalar_one_or_none()
    if not note:
        # 如果笔记不存在，返回默认示例图片
        default_image = settings.BASE_DIR / "backend" / "app" / "static" / "example_note.jpg"
        if default_image.exists():
            return FileResponse(default_image)
        else:
            raise HTTPException(status_code=404, detail="Note not found")
    
    if image_type == "original":
        image_path = settings.BASE_DIR / note.original_path
    elif image_type == "processed":
        image_path = settings.BASE_DIR / note.processed_path
    elif image_type == "annotated":
        # 尝试获取带标记的图片，如果不存在则返回处理后的图片
        processed_path = Path(note.processed_path)
        annotated_path = settings.BASE_DIR / processed_path.parent / f"{processed_path.stem}_annotated{processed_path.suffix}"
        if annotated_path.exists():
            return FileResponse(annotated_path)
        else:
            image_path = settings.BASE_DIR / note.processed_path
    else:
        raise HTTPException(status_code=400, detail="Invalid image type. Use 'original', 'processed', or 'annotated'")
    
    if not image_path.exists():
        # 如果图片文件不存在，返回默认示例图片
        default_image = settings.BASE_DIR / "backend" / "app" / "static" / "example_note.jpg"
        if default_image.exists():
            return FileResponse(default_image)
        else:
            raise HTTPException(status_code=404, detail="Image file not found")
    
    return FileResponse(image_path)
