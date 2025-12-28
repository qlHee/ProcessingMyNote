"""
Notes Router - Placeholder for Phase 3
"""
from fastapi import APIRouter

router = APIRouter(prefix="/notes", tags=["Notes"])


@router.get("/")
async def get_notes():
    """Placeholder - will be implemented in Phase 3"""
    return {"message": "Notes API - Coming in Phase 3"}
