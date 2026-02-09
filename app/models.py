from datetime import datetime
from typing import Optional, List
from sqlmodel import Field, SQLModel, Relationship

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Photo(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    filename: str
    filepath: str
    event_id: str = Field(index=True)
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    
    face_encodings: List["FaceEncoding"] = Relationship(back_populates="photo")

class FaceEncoding(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    photo_id: Optional[int] = Field(default=None, foreign_key="photo.id", index=True)
    encoding_json: str  # Storing as JSON string for SQLite simplicity
    bounding_box_json: str # Storing as JSON string
    
    photo: Optional[Photo] = Relationship(back_populates="face_encodings")
