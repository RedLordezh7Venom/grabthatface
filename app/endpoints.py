import shutil
import os
import uuid
from typing import List
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, BackgroundTasks
from sqlmodel import Session, select
from .database import get_session
from .models import Photo, FaceEncoding
from .services.ml_processor import processor
from .workers.tasks import process_photo_and_extract_faces

router = APIRouter()

UPLOAD_DIR = "data/uploads"
FACES_DIR = "data/faces"

# process_photo logic moved to workers/tasks.py

@router.post("/upload", response_model=Photo)
async def upload_photo(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...), 
    event_id: str = "default",
    session: Session = Depends(get_session)
):
    file_id = str(uuid.uuid4())
    extension = os.path.splitext(file.filename)[1]
    filename = f"{file_id}{extension}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    photo = Photo(filename=filename, filepath=file_path, event_id=event_id)
    session.add(photo)
    session.commit()
    session.refresh(photo)
    
    # Offload heavy ML to distributed worker
    process_photo_and_extract_faces.delay(photo.id, file_path)

    return photo

# process_photo_bg logic moved to workers/tasks.py

@router.post("/search")
async def search_faces(
    file: UploadFile = File(...),
    session: Session = Depends(get_session)
):
    # Save temp selfie
    temp_filename = f"temp_{uuid.uuid4()}.jpg"
    temp_path = os.path.join(FACES_DIR, temp_filename)
    
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    try:
        # 1. Feature Extraction for Search
        # We still do extraction synchronously here as it's a search request
        # but the actual search is O(log N) now.
        faces = processor.extract_features(temp_path)
        
        if not faces:
            raise HTTPException(status_code=400, detail="No face detected in selfie")
            
        selfie_encoding = faces[0][0]
        
        # 2. High-Performance Vector Search (FAISS HNSW)
        matched_face_ids = processor.query(selfie_encoding, k=50)
        
        if not matched_face_ids:
            return []

        # 3. Retrieve Photo Metadata
        # Get unique photo IDs from the matched face IDs
        face_records = session.exec(
            select(FaceEncoding).where(FaceEncoding.id.in_(matched_face_ids))
        ).all()
        
        matched_photo_ids = list(set(r.photo_id for r in face_records))
        
        if not matched_photo_ids:
            return []
            
        photos = session.exec(select(Photo).where(Photo.id.in_(matched_photo_ids))).all()
        return photos
        
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)
