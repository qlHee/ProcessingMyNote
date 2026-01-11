"""
Export Router - Export notes and folders
"""
import zipfile
import shutil
from pathlib import Path
from urllib.parse import quote
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import Optional

from app.database import get_db
from app.config import settings
from app.models.user import User
from app.models.note import Note
from app.models.folder import Folder
from app.routers.auth import get_current_user

router = APIRouter(prefix="/export", tags=["Export"])


async def get_all_subfolders(db: AsyncSession, folder_id: int, user_id: int) -> list[Folder]:
    """Recursively get all subfolders"""
    result = await db.execute(
        select(Folder).where(
            Folder.parent_id == folder_id,
            Folder.user_id == user_id
        )
    )
    subfolders = list(result.scalars().all())
    all_folders = subfolders.copy()
    
    for subfolder in subfolders:
        children = await get_all_subfolders(db, subfolder.id, user_id)
        all_folders.extend(children)
    
    return all_folders


async def get_folder_path(db: AsyncSession, folder_id: int, user_id: int) -> str:
    """Get folder path from root"""
    path_parts = []
    current_id = folder_id
    
    while current_id:
        result = await db.execute(
            select(Folder).where(
                Folder.id == current_id,
                Folder.user_id == user_id
            )
        )
        folder = result.scalar_one_or_none()
        if not folder:
            break
        path_parts.insert(0, folder.name)
        current_id = folder.parent_id
    
    return "/".join(path_parts) if path_parts else ""


@router.get("/note/{note_id}")
async def export_note(
    note_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Export a single note (annotated image if available, otherwise processed)"""
    result = await db.execute(
        select(Note).where(
            Note.id == note_id,
            Note.user_id == current_user.id
        )
    )
    note = result.scalar_one_or_none()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    # Try to get annotated image first, fall back to processed
    processed_path = settings.BASE_DIR / note.processed_path
    processed_path_obj = Path(note.processed_path)
    annotated_path = settings.BASE_DIR / processed_path_obj.parent / f"{processed_path_obj.stem}_annotated{processed_path_obj.suffix}"
    
    export_path = annotated_path if annotated_path.exists() else processed_path
    
    if not export_path.exists():
        raise HTTPException(status_code=404, detail="Image not found")
    
    # Use RFC 5987 encoding for filename to support UTF-8
    encoded_filename = quote(f"{note.title}{export_path.suffix}")
    
    return FileResponse(
        export_path,
        media_type="application/octet-stream",
        headers={
            "Content-Disposition": f"attachment; filename*=UTF-8''{encoded_filename}"
        }
    )


@router.get("/folder/{folder_id}")
async def export_folder(
    folder_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Export a folder with all its notes and subfolders (processed images only)"""
    # Get the folder
    result = await db.execute(
        select(Folder).where(
            Folder.id == folder_id,
            Folder.user_id == current_user.id
        )
    )
    folder = result.scalar_one_or_none()
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")
    
    # Create a temporary directory for the export
    temp_dir = settings.BASE_DIR / "temp_exports"
    temp_dir.mkdir(exist_ok=True)
    export_dir = temp_dir / f"export_{folder_id}_{current_user.id}"
    
    # Clean up if exists
    if export_dir.exists():
        shutil.rmtree(export_dir)
    export_dir.mkdir()
    
    try:
        # Get all subfolders
        all_folders = [folder] + await get_all_subfolders(db, folder_id, current_user.id)
        folder_ids = [f.id for f in all_folders]
        
        # Create folder structure
        folder_paths = {}
        for f in all_folders:
            relative_path = await get_folder_path(db, f.id, current_user.id)
            folder_dir = export_dir / relative_path
            folder_dir.mkdir(parents=True, exist_ok=True)
            folder_paths[f.id] = relative_path
        
        # Get all notes in these folders
        result = await db.execute(
            select(Note).where(
                Note.folder_id.in_(folder_ids),
                Note.user_id == current_user.id
            )
        )
        notes = result.scalars().all()
        
        if not notes:
            raise HTTPException(status_code=404, detail="No notes found in folder")
        
        # Copy annotated images (or processed if annotated doesn't exist)
        for note in notes:
            processed_path = settings.BASE_DIR / note.processed_path
            processed_path_obj = Path(note.processed_path)
            annotated_path = settings.BASE_DIR / processed_path_obj.parent / f"{processed_path_obj.stem}_annotated{processed_path_obj.suffix}"
            
            # Use annotated image if available, otherwise use processed
            export_path = annotated_path if annotated_path.exists() else processed_path
            
            if export_path.exists():
                folder_path = folder_paths.get(note.folder_id, "")
                dest_dir = export_dir / folder_path
                dest_file = dest_dir / f"{note.title}{export_path.suffix}"
                
                # Handle duplicate filenames
                counter = 1
                while dest_file.exists():
                    dest_file = dest_dir / f"{note.title}_{counter}{export_path.suffix}"
                    counter += 1
                
                shutil.copy2(export_path, dest_file)
        
        # Create zip file
        zip_path = temp_dir / f"{folder.name}.zip"
        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for file_path in export_dir.rglob('*'):
                if file_path.is_file():
                    arcname = file_path.relative_to(export_dir)
                    zipf.write(file_path, arcname)
        
        # Clean up export directory
        shutil.rmtree(export_dir)
        
        # Use RFC 5987 encoding for filename to support UTF-8
        encoded_filename = quote(f"{folder.name}.zip")
        
        # Return zip file
        return FileResponse(
            zip_path,
            media_type="application/zip",
            headers={
                "Content-Disposition": f"attachment; filename*=UTF-8''{encoded_filename}"
            },
            background=lambda: zip_path.unlink() if zip_path.exists() else None
        )
        
    except Exception as e:
        # Clean up on error
        if export_dir.exists():
            shutil.rmtree(export_dir)
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")
