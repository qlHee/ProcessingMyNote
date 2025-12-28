"""
Annotation Model - For note annotations
"""
from datetime import datetime
from sqlalchemy import String, DateTime, ForeignKey, Integer, Text, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class Annotation(Base):
    __tablename__ = "annotations"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    note_id: Mapped[int] = mapped_column(Integer, ForeignKey("notes.id"))
    content: Mapped[str] = mapped_column(Text)
    x: Mapped[float] = mapped_column(Float)  # X position (percentage)
    y: Mapped[float] = mapped_column(Float)  # Y position (percentage)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    # Relationships
    note = relationship("Note", back_populates="annotations")
