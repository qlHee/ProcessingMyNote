"""
Tags Router
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.user import User
from app.models.tag import Tag
from app.schemas.tag import TagCreate, TagUpdate, TagResponse
from app.routers.auth import get_current_user

router = APIRouter(prefix="/tags", tags=["Tags"])


@router.get("/", response_model=list[TagResponse])
async def get_tags(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all tags for current user"""
    result = await db.execute(
        select(Tag).where(Tag.user_id == current_user.id)
    )
    return result.scalars().all()


@router.post("/", response_model=TagResponse)
async def create_tag(
    tag_data: TagCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new tag"""
    # Check if tag name already exists for this user
    result = await db.execute(
        select(Tag).where(
            Tag.name == tag_data.name,
            Tag.user_id == current_user.id
        )
    )
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Tag name already exists")
    
    tag = Tag(
        name=tag_data.name,
        color=tag_data.color,
        user_id=current_user.id
    )
    db.add(tag)
    await db.flush()
    await db.refresh(tag)
    return tag


@router.put("/{tag_id}", response_model=TagResponse)
async def update_tag(
    tag_id: int,
    tag_data: TagUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a tag"""
    result = await db.execute(
        select(Tag).where(
            Tag.id == tag_id,
            Tag.user_id == current_user.id
        )
    )
    tag = result.scalar_one_or_none()
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    
    if tag_data.name is not None:
        tag.name = tag_data.name
    if tag_data.color is not None:
        tag.color = tag_data.color
    
    await db.flush()
    await db.refresh(tag)
    return tag


@router.delete("/{tag_id}")
async def delete_tag(
    tag_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a tag"""
    result = await db.execute(
        select(Tag).where(
            Tag.id == tag_id,
            Tag.user_id == current_user.id
        )
    )
    tag = result.scalar_one_or_none()
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    
    await db.delete(tag)
    return {"message": "Tag deleted successfully"}
