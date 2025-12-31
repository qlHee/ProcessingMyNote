"""
Annotations Router - CRUD for note annotations
"""
import cv2
import numpy as np
import json
import math
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from PIL import Image, ImageDraw, ImageFont

from app.database import get_db
from app.config import settings
from app.models.user import User
from app.models.note import Note
from app.models.annotation import Annotation
from app.schemas.annotation import AnnotationCreate, AnnotationUpdate, AnnotationResponse
from app.routers.auth import get_current_user

router = APIRouter(prefix="/notes/{note_id}/annotations", tags=["Annotations"])


def hex_to_rgb(hex_color: str) -> tuple:
    """Convert hex color to RGB tuple"""
    hex_color = hex_color.lstrip('#')
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))


def parse_annotation_content(content: str):
    """Parse annotation content to determine type"""
    try:
        parsed = json.loads(content)
        if isinstance(parsed, list):
            return {'type': 'draw', 'data': parsed}
        elif 'x2' in parsed and 'y2' in parsed:
            return {'type': parsed.get('type', 'line'), 'data': parsed}
    except (json.JSONDecodeError, TypeError):
        return {'type': 'text', 'data': content}
    return {'type': 'text', 'data': content}


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
    
    # 如果没有标记，删除旧的annotated图片（如果存在）
    if not annotations:
        if annotated_path.exists():
            annotated_path.unlink()
        return None
    
    # 使用PIL读取图片以支持中文文字
    img = Image.open(str(processed_path)).convert('RGBA')
    width, height = img.size
    
    # 创建一个透明的overlay用于绘制标注
    overlay = Image.new('RGBA', (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    
    # 尝试加载中文字体
    try:
        # macOS 系统字体
        font_paths = [
            '/System/Library/Fonts/PingFang.ttc',
            '/System/Library/Fonts/STHeiti Light.ttc',
            '/System/Library/Fonts/Hiragino Sans GB.ttc',
            '/Library/Fonts/Arial Unicode.ttf',
        ]
        base_font = None
        for font_path in font_paths:
            if Path(font_path).exists():
                base_font = font_path
                break
    except:
        base_font = None
    
    for annotation in annotations:
        parsed = parse_annotation_content(annotation.content)
        ann_type = parsed['type']
        ann_data = parsed['data']
        
        # 获取标注颜色
        color_hex = annotation.color or '#1890ff'
        color_rgb = hex_to_rgb(color_hex)
        
        # 获取字体大小/线条粗细
        # 前端: strokeWidth = font_size * 0.15 (在SVG viewBox 0-100坐标系中)
        # 转换到像素: stroke_width_px = font_size * 0.15 * (image_size / 100)
        font_size = annotation.font_size or 1.0
        # 使用图片对角线长度的比例来计算线条粗细，与前端SVG渲染保持一致
        scale_factor = min(width, height) / 100
        stroke_width = max(1, int(font_size * 0.15 * scale_factor))
        
        # 计算位置（百分比转像素）
        x = int(annotation.x * width / 100)
        y = int(annotation.y * height / 100)
        
        if ann_type == 'text':
            # 文字标注 - 直接绘制文字（不绘制圆点）
            text_content = str(ann_data)
            text_font_size = max(14, int(font_size * min(width, height) / 50))
            
            try:
                if base_font:
                    font = ImageFont.truetype(base_font, text_font_size)
                else:
                    font = ImageFont.load_default()
            except:
                font = ImageFont.load_default()
            
            # 计算文字位置（直接在标注点位置）
            text_x = x
            text_y = y - text_font_size // 2
            
            # 获取文字边界框
            bbox = draw.textbbox((text_x, text_y), text_content, font=font)
            text_width = bbox[2] - bbox[0]
            text_height = bbox[3] - bbox[1]
            
            # 确保不超出图片边界
            if text_x + text_width + 10 > width:
                text_x = width - text_width - 10
            if text_x < 5:
                text_x = 5
            if text_y < 5:
                text_y = 5
            if text_y + text_height > height - 5:
                text_y = height - text_height - 5
            
            # 绘制文字背景（半透明白色）
            padding = 4
            draw.rectangle(
                [text_x - padding, text_y - padding, text_x + text_width + padding, text_y + text_height + padding],
                fill=(255, 255, 255, 220),
                outline=color_rgb + (255,),
                width=2
            )
            
            # 绘制文字（使用标注颜色）
            draw.text((text_x, text_y), text_content, fill=color_rgb + (255,), font=font)
            
        elif ann_type == 'line':
            # 直线
            x2 = int(ann_data['x2'] * width / 100)
            y2 = int(ann_data['y2'] * height / 100)
            draw.line([(x, y), (x2, y2)], fill=color_rgb + (255,), width=stroke_width)
            
        elif ann_type == 'arrow':
            # 箭头
            x2 = int(ann_data['x2'] * width / 100)
            y2 = int(ann_data['y2'] * height / 100)
            
            # 绘制线条
            draw.line([(x, y), (x2, y2)], fill=color_rgb + (255,), width=stroke_width)
            
            # 绘制箭头头部 - 与前端一致: arrowSize = strokeWidth * 4
            angle = math.atan2(y2 - y, x2 - x)
            arrow_size = stroke_width * 3  # 稍微小一点，避免太大
            
            # 箭头的两个点
            arrow_angle = math.pi / 6  # 30度
            p1_x = x2 - arrow_size * math.cos(angle - arrow_angle)
            p1_y = y2 - arrow_size * math.sin(angle - arrow_angle)
            p2_x = x2 - arrow_size * math.cos(angle + arrow_angle)
            p2_y = y2 - arrow_size * math.sin(angle + arrow_angle)
            
            draw.polygon([(x2, y2), (p1_x, p1_y), (p2_x, p2_y)], fill=color_rgb + (255,))
            
        elif ann_type == 'wave':
            # 波浪线 - 使用与前端相同的贝塞尔曲线算法
            # 前端使用百分比坐标，这里转换为像素
            x1_pct = annotation.x
            y1_pct = annotation.y
            x2_pct = ann_data['x2']
            y2_pct = ann_data['y2']
            
            dx_pct = x2_pct - x1_pct
            dy_pct = y2_pct - y1_pct
            length_pct = math.sqrt(dx_pct * dx_pct + dy_pct * dy_pct)
            wave_count = max(3, int(length_pct / 3))  # 与前端一致
            amplitude_pct = font_size * 0.15 * 3  # strokeWidth * 3
            
            # 生成波浪线的点（模拟贝塞尔曲线）
            points = []
            num_points = wave_count * 20  # 足够多的点来平滑曲线
            
            for i in range(num_points + 1):
                t = i / num_points
                # 基础位置
                base_x = x1_pct + dx_pct * t
                base_y = y1_pct + dy_pct * t
                
                # 计算当前在哪个波段
                wave_progress = t * wave_count
                wave_index = int(wave_progress)
                wave_t = wave_progress - wave_index
                
                # 使用正弦函数模拟贝塞尔曲线的波浪效果
                # 前端的Q命令在每个波段的中点达到最大振幅
                wave_offset = amplitude_pct * math.sin(wave_t * math.pi) * (1 if wave_index % 2 == 0 else -1)
                
                # 垂直于线条方向的偏移
                if length_pct > 0:
                    perp_x = -dy_pct / length_pct
                    perp_y = dx_pct / length_pct
                else:
                    perp_x, perp_y = 0, 0
                
                final_x = (base_x + perp_x * wave_offset) * width / 100
                final_y = (base_y + perp_y * wave_offset) * height / 100
                points.append((final_x, final_y))
            
            if len(points) >= 2:
                draw.line(points, fill=color_rgb + (255,), width=stroke_width)
            
        elif ann_type == 'draw':
            # 自由绘制 - 与前端一致: strokeWidth * 0.7
            if isinstance(ann_data, list) and len(ann_data) >= 2:
                points = [(int(p['x'] * width / 100), int(p['y'] * height / 100)) for p in ann_data]
                draw_stroke = max(1, int(stroke_width * 0.7))
                draw.line(points, fill=color_rgb + (255,), width=draw_stroke)
    
    # 合并overlay到原图
    img = Image.alpha_composite(img, overlay)
    
    # 转换为RGB并保存
    img_rgb = img.convert('RGB')
    img_rgb.save(str(annotated_path), quality=95)
    
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
        y=annotation_data.y,
        font_size=annotation_data.fontSize,
        color=annotation_data.color
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
    if annotation_data.fontSize is not None:
        annotation.font_size = annotation_data.fontSize
    if annotation_data.color is not None:
        annotation.color = annotation_data.color
    
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
