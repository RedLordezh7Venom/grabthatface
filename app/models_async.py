from datetime import datetime
from typing import List, Optional
from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey, Text, Index, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base

class User(Base):
    """User model for authentication and authorization."""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Integer, default=1)
    is_superuser = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

class Photo(Base):
    """Photo model storing uploaded images."""
    __tablename__ = "photos"
    
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    filepath = Column(String(512), nullable=False)
    event_id = Column(String(100), index=True, nullable=False)
    uploader_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    file_size = Column(Integer, nullable=True)  # In bytes
    width = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)
    format = Column(String(20), nullable=True)  # JPEG, PNG, etc.
    processing_status = Column(String(20), default="pending")  # pending, processing, completed, failed
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    # Relationships
    face_encodings = relationship("FaceEncoding", back_populates="photo", cascade="all, delete-orphan")
    uploader = relationship("User", foreign_keys=[uploader_id])
    
    # Indexes for common queries
    __table_args__ = (
        Index('idx_event_timestamp', 'event_id', 'timestamp'),
        Index('idx_status', 'processing_status'),
    )

class FaceEncoding(Base):
    """Face encoding model storing 512-d ArcFace embeddings."""
    __tablename__ = "face_encodings"
    
    id = Column(Integer, primary_key=True, index=True)
    photo_id = Column(Integer, ForeignKey("photos.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Embedding stored as JSON (or use pgvector extension for PostgreSQL)
    # For production, consider using pgvector extension
    embedding_json = Column(Text, nullable=False)
    
    # Face detection metadata
    bounding_box = Column(JSON, nullable=False)  # {"x": int, "y": int, "width": int, "height": int}
    confidence = Column(Float, nullable=False)  # Detection confidence
    landmarks = Column(JSON, nullable=True)  # Facial landmarks
    
    # Qdrant sync status
    qdrant_synced = Column(Integer, default=0, index=True)  # 0 = not synced, 1 = synced
    qdrant_synced_at = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    photo = relationship("Photo", back_populates="face_encodings")
    
    # Indexes
    __table_args__ = (
        Index('idx_photo_confidence', 'photo_id', 'confidence'),
        Index('idx_qdrant_sync', 'qdrant_synced'),
    )

class SearchLog(Base):
    """Log of face searches for analytics and monitoring."""
    __tablename__ = "search_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    ip_address = Column(String(50), nullable=True)
    matches_found = Column(Integer, default=0)
    search_time_ms = Column(Float, nullable=True)  # Search duration in milliseconds
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id])
