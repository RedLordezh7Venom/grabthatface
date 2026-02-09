import shutil
import os
import uuid
from typing import List
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, BackgroundTasks
from sqlmodel import Session, select
from .database import get_session
from .models import Photo, FaceEncoding
from .processor import FaceRecognizer
import face_recognition
import numpy as np
import json

router = APIRouter()
face_recognizer = FaceRecognizer()

UPLOAD_DIR = "data/uploads"
FACES_DIR = "data/faces"

def process_photo(photo_id: int, file_path: str, session: Session):
    # This should be a background task
    image = face_recognizer.load_image_file(file_path)
    faces = face_recognizer.get_face_encodings(image)
    
    for encoding, location in faces:
        face_encoding = FaceEncoding(
            photo_id=photo_id,
            encoding_json=face_recognizer.serialize_encoding(encoding),
            bounding_box_json=json.dumps(location)
        )
        session.add(face_encoding)
    session.commit()

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
    
    # Trigger REAL background processing
    background_tasks.add_task(process_photo_bg, photo.id, file_path)

    return photo

def process_photo_bg(photo_id: int, file_path: str):
    # New session for background task
    from .database import engine
    with Session(engine) as session:
        image = face_recognizer.load_image_file(file_path)
        faces = face_recognizer.get_face_encodings(image)
        
        for encoding, location in faces:
            face_encoding = FaceEncoding(
                photo_id=photo_id,
                encoding_json=face_recognizer.serialize_encoding(encoding),
                bounding_box_json=json.dumps(location)
            )
            session.add(face_encoding)
        session.commit()

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
        # Detect face in selfie
        image = face_recognizer.load_image_file(temp_path)
        # Assume only one face in selfie for now, take the first one
        faces = face_recognizer.get_face_encodings(image)
        
        if not faces:
            raise HTTPException(status_code=400, detail="No face detected in selfie")
            
        selfie_encoding = faces[0][0]
        
        # Vectorized search
        statement = select(FaceEncoding)
        face_records = session.exec(statement).all()
        
        if not face_records:
            return []

        known_encodings = [
            face_recognizer.deserialize_encoding(r.encoding_json) 
            for r in face_records
        ]
        
        matches = face_recognizer.compare_faces_batch(known_encodings, selfie_encoding)
        
        matched_photo_ids = {
            face_records[i].photo_id 
            for i, is_match in enumerate(matches) 
            if is_match
        }
        
        # Get photos
        if not matched_photo_ids:
            return []
            
        photos = session.exec(select(Photo).where(Photo.id.in_(list(matched_photo_ids)))).all()
        return photos
        
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)
