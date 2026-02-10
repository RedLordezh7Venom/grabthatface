import shutil
import os
import uuid
from fastapi import APIRouter, UploadFile, File, Depends, BackgroundTasks, Form
from sqlmodel import Session
from app.database import get_session
from app.models import Photo, FaceEncoding
from app.services.ml_processor import processor
from app.core.config import settings
from loguru import logger
import json

router = APIRouter()

def background_index_faces(photo_id: int, file_path: str):
    """
    Simulating a Celery Worker task. 
    In production, this would be a separate process on a GPU instance.
    """
    logger.info(f"Worker: Indexing faces for photo {photo_id}")
    from app.database import engine
    with Session(engine) as session:
        features = processor.extract_features(file_path)
        for encoding, location in features:
            face = FaceEncoding(
                photo_id=photo_id,
                encoding_json=json.dumps(encoding.tolist()),
                bounding_box_json=json.dumps(location)
            )
            session.add(face)
            session.commit() # Commit to get face.id
            session.refresh(face)
            
            # Sync to Vision RAG / FAISS Index
            processor.add_to_index(face.id, encoding)
    logger.info(f"Worker: Completed indexing for photo {photo_id}. Found {len(features)} faces.")

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
    
    # 4. Offload AI processing to worker (simulated via BackgroundTasks)
    background_tasks.add_task(background_index_faces, photo.id, file_path)
    
    return {"id": photo.id, "status": "processing"}
