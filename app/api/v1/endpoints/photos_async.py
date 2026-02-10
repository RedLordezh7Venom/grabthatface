import shutil
import os
import uuid
from typing import List, Optional
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Form, BackgroundTasks, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db_session
from app.models_async import Photo, FaceEncoding, User
from app.workers.tasks_async import process_photo_extract_faces
from app.core.config import settings
from app.core.rate_limit import limiter
from app.core.security import get_current_user_optional
from loguru import logger
from PIL import Image
import time

router = APIRouter()

# Allowed image formats
ALLOWED_FORMATS = {"image/jpeg", "image/jpg", "image/png", "image/webp"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB

@router.post("/upload")
@limiter.limit(f"{settings.RATE_LIMIT_UPLOAD_PER_HOUR}/hour")
async def upload_photo(
    request: Request,
    file: UploadFile = File(...),
    event_id: str = Form("default-event"),
    session: AsyncSession = Depends(get_db_session),
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    """
    Upload a photo for face extraction.
    
    - Validates file type and size
    - Stores file securely
    - Triggers async face extraction worker
    - Returns photo ID and processing status
    
    Rate limit: 100 uploads per hour per IP
    """
    
    # 1. Validation
    if not file.content_type or file.content_type not in ALLOWED_FORMATS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: {', '.join(ALLOWED_FORMATS)}"
        )
    
    # Read file content to check size
    file_content = await file.read()
    if len(file_content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size: {MAX_FILE_SIZE / (1024*1024)}MB"
        )
    
    # 2. Additional image validation
    try:
        img = Image.open(file.file)
        width, height = img.size
        img_format = img.format
        
        if width < 100 or height < 100:
            raise HTTPException(
                status_code=400,
                detail="Image too small. Minimum size: 100x100 pixels"
            )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image file: {str(e)}")
    finally:
        await file.seek(0)  # Reset file pointer
    
    # 3. Storage
    file_id = str(uuid.uuid4())
    extension = os.path.splitext(file.filename)[1].lower()
    if not extension:
        extension = ".jpg"
    
    filename = f"{file_id}{extension}"
    file_path = os.path.join(settings.STORAGE_PATH, filename)
    
    # Ensure directory exists
    os.makedirs(settings.STORAGE_PATH, exist_ok=True)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # 4. Create database record
    uploader_id = current_user.get("user_id") if current_user else None
    
    photo = Photo(
        filename=filename,
        filepath=file_path,
        event_id=event_id,
        uploader_id=uploader_id,
        file_size=len(file_content),
        width=width,
        height=height,
        format=img_format,
        processing_status="pending"
    )
    
    session.add(photo)
    await session.commit()
    await session.refresh(photo)
    
    # 5. Trigger async processing
    try:
        process_photo_extract_faces.delay(photo.id, file_path)
        logger.info(f"Queued face extraction for photo {photo.id}")
    except Exception as e:
        logger.error(f"Failed to queue processing for photo {photo.id}: {e}")
        # Don't fail the request, processing can be retried
    
    return {
        "id": photo.id,
        "filename": photo.filename,
        "event_id": photo.event_id,
        "status": "processing",
        "message": "Photo uploaded successfully. Face extraction in progress."
    }

@router.get("/status/{photo_id}")
async def get_photo_status(
    photo_id: int,
    session: AsyncSession = Depends(get_db_session)
):
    """
    Get processing status of a photo.
    """
    stmt = select(Photo).where(Photo.id == photo_id)
    result = await session.execute(stmt)
    photo = result.scalar_one_or_none()
    
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")
    
    # Count faces found
    stmt = select(FaceEncoding).where(FaceEncoding.photo_id == photo_id)
    result = await session.execute(stmt)
    faces = result.scalars().all()
    
    return {
        "id": photo.id,
        "filename": photo.filename,
        "event_id": photo.event_id,
        "status": photo.processing_status,
        "faces_found": len(faces),
        "timestamp": photo.timestamp.isoformat()
    }

@router.get("/event/{event_id}")
async def get_event_photos(
    event_id: str,
    skip: int = 0,
    limit: int = 100,
    session: AsyncSession = Depends(get_db_session)
):
    """
    Get all photos for an event.
    """
    stmt = (
        select(Photo)
        .where(Photo.event_id == event_id)
        .order_by(Photo.timestamp.desc())
        .offset(skip)
        .limit(limit)
    )
    result = await session.execute(stmt)
    photos = result.scalars().all()
    
    return {
        "event_id": event_id,
        "count": len(photos),
        "photos": [
            {
                "id": p.id,
                "filename": p.filename,
                "status": p.processing_status,
                "timestamp": p.timestamp.isoformat()
            }
            for p in photos
        ]
    }

@router.delete("/{photo_id}")
async def delete_photo(
    photo_id: int,
    session: AsyncSession = Depends(get_db_session),
    current_user: dict = Depends(get_current_user_optional)
):
    """
    Delete a photo and its face encodings.
    Requires authentication (optional for now).
    """
    stmt = select(Photo).where(Photo.id == photo_id)
    result = await session.execute(stmt)
    photo = result.scalar_one_or_none()
    
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")
    
    # Delete file from storage
    try:
        if os.path.exists(photo.filepath):
            os.remove(photo.filepath)
    except Exception as e:
        logger.error(f"Failed to delete file {photo.filepath}: {e}")
    
    # Delete from database (cascade will delete face encodings)
    await session.delete(photo)
    await session.commit()
    
    return {"message": "Photo deleted successfully", "id": photo_id}
