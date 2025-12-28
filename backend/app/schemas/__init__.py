"""
Pydantic Schemas for API validation
"""
from app.schemas.user import UserCreate, UserLogin, UserResponse, Token
from app.schemas.folder import FolderCreate, FolderUpdate, FolderResponse, FolderTree
from app.schemas.tag import TagCreate, TagUpdate, TagResponse
from app.schemas.note import NoteCreate, NoteUpdate, NoteResponse, NoteListResponse, ProcessingParams
from app.schemas.annotation import AnnotationCreate, AnnotationUpdate, AnnotationResponse

__all__ = [
    "UserCreate", "UserLogin", "UserResponse", "Token",
    "FolderCreate", "FolderUpdate", "FolderResponse", "FolderTree",
    "TagCreate", "TagUpdate", "TagResponse",
    "NoteCreate", "NoteUpdate", "NoteResponse", "NoteListResponse", "ProcessingParams",
    "AnnotationCreate", "AnnotationUpdate", "AnnotationResponse",
]
