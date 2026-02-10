import shutil
import os
import uuid
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlmodel import Session, select
import numpy as np
import json
from app.database import get_session
from app.models import Photo, FaceEncoding
from app.services.ml_processor import processor
from app.core.config import settings
from loguru import logger

router = APIRouter()

@router.post("/")
async def search_by_face(
    file: UploadFile = File(...),
    session: Session = Depends(get_session)
):
    # 1. Temp storage for query image
    temp_path = f"data/temp_{uuid.uuid4()}.jpg"
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    try:
        # 2. Extract query features
        features = processor.extract_features(temp_path)
        if not features:
            raise HTTPException(status_code=400, detail="No face detected in selfie")
            
        query_encoding = features[0][0]
        
        # 3. Query FAISS index (The Fastest Method)
        match_ids = processor.query(query_encoding, k=50)
        
        if not match_ids:
            return []
            
        # 4. Find unique photo IDs from face IDs
        statement = select(FaceEncoding).where(FaceEncoding.id.in_(match_ids))
        face_records = session.exec(statement).all()
        photo_ids = list(set([r.photo_id for r in face_records]))
        
        # 5. Hydrate photo metadata
        photos = session.exec(select(Photo).where(Photo.id.in_(photo_ids))).all()
        return photos
        
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)
