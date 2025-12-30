"""
Annotations Router - CRUD for note annotations
"""
import cv2
import numpy as np
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.config import settings
from app.models.user import User
from app.models.note import Note
from app.models.annotation import Annotation
from app.schemas.annotation import AnnotationCreate, AnnotationUpdate, AnnotationResponse
from app.routers.auth import get_current_user

router = APIRouter(prefix="/notes/{note_id}/annotations", tags=["Annotations"])


def render_annotations_to_image(note: Note, annotations: list) -> str:
    """
    将标记渲染到处理后的图片上，生成带标记的版本
    返回带标记图片的路径
    """
    if not note.processed_path:
        return None
    
    processed_path = settings.BASE_DIR / note.processed_path
    if not processed_path.exists():
        return None
    
    # 生成带标记的图片路径
    annotated_path = processed_path.parent / f"{processed_path.stem}_annotated{processed_path.suffix}"
    
    # 读取处理后的图片
    img = cv2.imread(str(processed_path))
    if img is None:
        return None
    
    # 如果没有标记，删除旧的annotated图片（如果存在）
    if not annotations:
        if annotated_path.exists():
            annotated_path.unlink()
        return None
    
    height, width = img.shape[:2]
    
    # 设置字体
    font = cv2.FONT_HERSHEY_SIMPLEX
    font_scale = max(0.8, min(width, height) / 800)
    thickness = max(2, int(font_scale * 2))
    
    for i, annotation in enumerate(annotations):
        # 计算标记位置（百分比转像素）
        x = int(annotation.x * width / 100)
        y = int(annotation.y * height / 100)
        
        # 绘制标记圆点（红色填充，白色边框）
        radius = int(20 * font_scale)
        cv2.circle(img, (x, y), radius, (0, 0, 255), -1)
        cv2.circle(img, (x, y), radius, (255, 255, 255), 3)
        
        # 绘制序号（白色）
        number = str(i + 1)
        text_size = cv2.getTextSize(number, font, font_scale * 0.7, thickness)[0]
        text_x = x - text_size[0] // 2
        text_y = y + text_size[1] // 2
        cv2.putText(img, number, (text_x, text_y), font, font_scale * 0.7, (255, 255, 255), thickness)
        
        # 绘制标注内容（在标记点右侧）
        content = annotation.content
        if len(content) > 25:
            content = content[:22] + "..."
        
        # 背景框位置
        text_size = cv2.getTextSize(content, font, font_scale * 0.5, thickness)[0]
        box_x = x + int(30 * font_scale)
        box_y = y - text_size[1] // 2 - 8
        
        # 确保不超出图片边界
        if box_x + text_size[0] + 10 > width:
            box_x = x - text_size[0] - int(40 * font_scale)
        if box_y < 5:
            box_y = 5
        if box_y + text_size[1] + 15 > height:
            box_y = height - text_size[1] - 15
        
        # 绘制背景框（白色填充，红色边框）
        cv2.rectangle(img, 
                     (box_x - 8, box_y - 8), 
                     (box_x + text_size[0] + 8, box_y + text_size[1] + 12), 
                     (255, 255, 255), -1)
        cv2.rectangle(img, 
                     (box_x - 8, box_y - 8), 
                     (box_x + text_size[0] + 8, box_y + text_size[1] + 12), 
                     (0, 0, 255), 3)
        
        # 绘制文字（黑色）
        cv2.putText(img, content, (box_x, box_y + text_size[1]), font, font_scale * 0.5, (0, 0, 0), thickness)
    
    # 保存带标记的图片
    cv2.imwrite(str(annotated_path), img)
    return str(annotated_path.relative_to(settings.BASE_DIR))


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
    note = await verify_note_ownership(note_id, current_user.id, db)
    
    annotation = Annotation(
        note_id=note_id,
        content=annotation_data.content,
        x=annotation_data.x,
        y=annotation_data.y
    )
    db.add(annotation)
    await db.flush()
    await db.refresh(annotation)
    
    # 重新渲染带标记的图片
    all_annotations = await db.execute(
        select(Annotation).where(Annotation.note_id == note_id)
    )
    render_annotations_to_image(note, all_annotations.scalars().all())
    
    return annotation


@router.put("/{annotation_id}/", response_model=AnnotationResponse)
async def update_annotation(
    note_id: int,
    annotation_id: int,
    annotation_data: AnnotationUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update an annotation"""
    note = await verify_note_ownership(note_id, current_user.id, db)
    
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
    
    # 重新渲染带标记的图片
    all_annotations = await db.execute(
        select(Annotation).where(Annotation.note_id == note_id)
    )
    render_annotations_to_image(note, all_annotations.scalars().all())
    
    return annotation


@router.delete("/{annotation_id}/")
async def delete_annotation(
    note_id: int,
    annotation_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete an annotation"""
    note = await verify_note_ownership(note_id, current_user.id, db)
    
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
    await db.flush()
    
    # 重新渲染带标记的图片
    all_annotations = await db.execute(
        select(Annotation).where(Annotation.note_id == note_id)
    )
    render_annotations_to_image(note, all_annotations.scalars().all())
    
    return {"message": "Annotation deleted successfully"}
