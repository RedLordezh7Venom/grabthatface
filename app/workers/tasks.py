import json
import numpy as np
from sqlmodel import Session
from app.database import engine
from app.models import Photo, FaceEncoding
from app.services.ml_processor import processor
from app.workers.celery_app import celery_app
from loguru import logger

@celery_app.task(name="process_photo_and_extract_faces")
def process_photo_and_extract_faces(photo_id: int, file_path: str):
    """
    Background worker task to extract face encodings and update the search index.
    """
    logger.info(f"Worker: Starting processing for photo {photo_id}")
    
    # 1. Extract Features (Heavy ML Task)
    faces = processor.extract_features(file_path)
    
    if not faces:
        logger.warning(f"Worker: No faces found in photo {photo_id}")
        return
    
    with Session(engine) as session:
        for encoding, location in faces:
            # 2. Persist to SQL Database
            encoding_json = json.dumps(encoding.tolist())
            face_encoding = FaceEncoding(
                photo_id=photo_id,
                encoding_json=encoding_json,
                bounding_box_json=json.dumps(location)
            )
            session.add(face_encoding)
            session.commit()
            session.refresh(face_encoding)
            
            # 3. Update FAISS Index (In-memory search optimization)
            # In a real distributed system, this would happen via a Vector DB sync
            # or by notifying search instances to refresh their indices.
            processor.add_to_index(face_encoding.id, encoding)
            
    logger.info(f"Worker: Finished processing photo {photo_id}. Found {len(faces)} faces.")
