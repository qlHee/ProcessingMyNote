"""
Folders Router
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.user import User
from app.models.folder import Folder
from app.schemas.folder import FolderCreate, FolderUpdate, FolderResponse, FolderTree
from app.routers.auth import get_current_user

router = APIRouter(prefix="/folders", tags=["Folders"])


def build_folder_tree(folders: list[Folder], parent_id: int | None = None) -> list[FolderTree]:
    """Recursively build folder tree structure"""
    tree = []
    for folder in folders:
        if folder.parent_id == parent_id:
            children = build_folder_tree(folders, folder.id)
            tree.append(FolderTree(
                id=folder.id,
                name=folder.name,
                parent_id=folder.parent_id,
                children=children
            ))
    return tree


@router.get("/", response_model=list[FolderResponse])
async def get_folders(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all folders for current user"""
    result = await db.execute(
        select(Folder).where(Folder.user_id == current_user.id)
    )
    return result.scalars().all()


@router.get("/tree/", response_model=list[FolderTree])
async def get_folder_tree(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get folder tree structure"""
    result = await db.execute(
        select(Folder).where(Folder.user_id == current_user.id)
    )
    folders = result.scalars().all()
    return build_folder_tree(folders)


@router.post("/", response_model=FolderResponse)
async def create_folder(
    folder_data: FolderCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new folder"""
    # Validate parent folder if specified
    if folder_data.parent_id:
        result = await db.execute(
            select(Folder).where(
                Folder.id == folder_data.parent_id,
                Folder.user_id == current_user.id
            )
        )
        if not result.scalar_one_or_none():
            raise HTTPException(status_code=404, detail="Parent folder not found")
    
    folder = Folder(
        name=folder_data.name,
        parent_id=folder_data.parent_id,
        user_id=current_user.id
    )
    db.add(folder)
    await db.flush()
    await db.refresh(folder)
    return folder


@router.put("/{folder_id}/", response_model=FolderResponse)
async def update_folder(
    folder_id: int,
    folder_data: FolderUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a folder"""
    result = await db.execute(
        select(Folder).where(
            Folder.id == folder_id,
            Folder.user_id == current_user.id
        )
    )
    folder = result.scalar_one_or_none()
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")
    
    if folder_data.name is not None:
        folder.name = folder_data.name
    if folder_data.parent_id is not None:
        # Prevent circular reference
        if folder_data.parent_id == folder_id:
            raise HTTPException(status_code=400, detail="Folder cannot be its own parent")
        folder.parent_id = folder_data.parent_id
    
    await db.flush()
    await db.refresh(folder)
    return folder


@router.delete("/{folder_id}/")
async def delete_folder(
    folder_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a folder and all its contents"""
    result = await db.execute(
        select(Folder).where(
            Folder.id == folder_id,
            Folder.user_id == current_user.id
        )
    )
    folder = result.scalar_one_or_none()
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")
    
    await db.delete(folder)
    return {"message": "Folder deleted successfully"}
