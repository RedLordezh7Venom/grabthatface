import shutil
import os
import uuid
from fastapi import APIRouter, UploadFile, File, Depends, BackgroundTasks, Form
from sqlmodel import Session
from app.database import get_session
from app.models import Photo, FaceEncoding
from app.services.ml_processor import processor
from app.workers.tasks import process_photo_and_extract_faces
from app.core.config import settings
from loguru import logger
import json

router = APIRouter()

# background_index_faces logic moved to workers/tasks.py

@router.post("/", response_model=None)
async def upload_photo(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    event_id: str = Form("production-event"),
    session: Session = Depends(get_session)
):
    # 1. Validation (File type, size)
    if not file.content_type.startswith("image/"):
        return {"error": "Invalid file type"}
        
    # 2. Storage
    file_id = str(uuid.uuid4())
    filename = f"{file_id}_{file.filename}"
    file_path = os.path.join(settings.STORAGE_PATH, filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # 3. Create Record
    photo = Photo(filename=filename, filepath=file_path, event_id=event_id)
    session.add(photo)
    session.commit()
    session.refresh(photo)
    
    # 4. Offload AI processing to distributed Celery worker
    process_photo_and_extract_faces.delay(photo.id, file_path)
    
    return {"id": photo.id, "status": "processing"}
