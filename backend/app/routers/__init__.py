"""
API Routers
"""
from app.routers.auth import router as auth_router
from app.routers.folders import router as folders_router
from app.routers.tags import router as tags_router
from app.routers.notes import router as notes_router
from app.routers.ai import router as ai_router
from app.routers.annotations import router as annotations_router
from app.routers.export import router as export_router

__all__ = ["auth_router", "folders_router", "tags_router", "notes_router", "ai_router", "annotations_router", "export_router"]
