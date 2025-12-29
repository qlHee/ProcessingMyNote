"""
AI Router - Natural language image adjustment
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from pydantic import BaseModel

from app.database import get_db
from app.models.user import User
from app.models.note import Note
from app.config import settings
from app.routers.auth import get_current_user
from app.services.ai_agent import interpret_adjustment
from app.services.image_processor import ImageProcessor

router = APIRouter(prefix="/ai", tags=["AI"])


class AdjustRequest(BaseModel):
    note_id: int
    instruction: str  # e.g., "字迹太淡了，加深一点"


class AdjustResponse(BaseModel):
    success: bool
    message: str
    old_params: dict
    new_params: dict


@router.post("/adjust/", response_model=AdjustResponse)
async def ai_adjust(
    request: AdjustRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    AI-powered image adjustment using natural language
    
    Example instructions:
    - "字迹太淡了，加深一点"
    - "背景不够白"
    - "太模糊了，锐化一下"
    """
    # Get note
    result = await db.execute(
        select(Note)
        .where(Note.id == request.note_id, Note.user_id == current_user.id)
        .options(selectinload(Note.tags))
    )
    note = result.scalar_one_or_none()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    # Get current params
    old_params = note.processing_params or {
        "block_size": 11,
        "c": 2,
        "contrast": 1.0,
        "brightness": 0,
        "denoise_strength": 10,
        "sharpen": True,
    }
    
    # Interpret instruction and get new params
    new_params = await interpret_adjustment(request.instruction, old_params)
    
    # Check if params changed
    if new_params == old_params:
        return AdjustResponse(
            success=False,
            message="无法理解您的指令，请尝试更具体的描述",
            old_params=old_params,
            new_params=new_params
        )
    
    # Reprocess image with new params
    original_path = settings.BASE_DIR / note.original_path
    processed_path = settings.BASE_DIR / note.processed_path
    
    if not original_path.exists():
        raise HTTPException(status_code=404, detail="Original image not found")
    
    try:
        processor = ImageProcessor()
        processor.process_with_params(
            str(original_path),
            str(processed_path),
            new_params
        )
        
        # Update database
        note.processing_params = new_params
        await db.flush()
        
        return AdjustResponse(
            success=True,
            message="图片已根据您的要求重新处理",
            old_params=old_params,
            new_params=new_params
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"处理失败: {str(e)}")
