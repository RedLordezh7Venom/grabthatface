import shutil
import os
import uuid
from typing import List, Optional
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Request, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import numpy as np
import json
import time
from app.core.database import get_db_session
from app.models_async import Photo, FaceEncoding, SearchLog
from app.services.vision_rag import processor
from app.core.config import settings
from app.core.rate_limit import limiter
from app.core.security import get_current_user_optional
from loguru import logger
from PIL import Image

router = APIRouter()

@router.post("/by-face")
@limiter.limit(f"{settings.RATE_LIMIT_PER_MINUTE}/minute")
async def search_by_face(
    request: Request,
    file: UploadFile = File(...),
    top_k: int = Query(default=20, ge=1, le=100, description="Number of results to return"),
    score_threshold: Optional[float] = Query(default=None, ge=0.0, le=1.0, description="Minimum similarity score"),
    event_id: Optional[str] = Query(default=None, description="Filter by event ID"),
    session: AsyncSession = Depends(get_db_session),
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    """
    Search for photos containing a specific face.
    
    Upload a face image (selfie) and get back all photos containing that person.
    Uses state-of-the-art InsightFace ArcFace with Qdrant HNSW for O(log N) search.
    
    Args:
        file: Face image to search for
        top_k: Maximum number of results (default 20, max 100)
        score_threshold: Minimum similarity score (0.0-1.0)
        event_id: Optional filter by event
    
    Rate limit: 60 requests per minute per IP
    """
    
    start_time = time.time()
    
    # 1. Validation
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Invalid file type. Must be an image.")
    
    # 2. Temporary storage for query image
    temp_id = str(uuid.uuid4())
    temp_path = os.path.join(settings.FACE_DIR, f"query_{temp_id}.jpg")
    
    os.makedirs(settings.FACE_DIR, exist_ok=True)
    
    try:
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # 3. Extract face from query image
        faces = processor.extract_faces(temp_path)
        
        if not faces:
            raise HTTPException(
                status_code=400,
                detail="No face detected in uploaded image. Please upload a clear face photo."
            )
        
        if len(faces) > 1:
            logger.warning(f"Multiple faces detected in query image. Using the first one.")
        
        # Use the first (most confident) face
        query_embedding = faces[0]["embedding"]
        query_confidence = faces[0]["confidence"]
        
        logger.info(f"Query face detected with confidence: {query_confidence:.3f}")
        
        # 4. Search in Qdrant using HNSW
        search_results = processor.search_similar_faces(
            query_embedding=query_embedding,
            top_k=top_k * 3,  # Get more results for filtering
            score_threshold=score_threshold
        )
        
        if not search_results:
            # Log search
            await _log_search(session, current_user, request, 0, time.time() - start_time)
            
            return {
                "matches": [],
                "count": 0,
                "query_confidence": query_confidence,
                "search_time_ms": (time.time() - start_time) * 1000
            }
        
        # 5. Get unique photo IDs from matched faces
        face_ids = [result["face_id"] for result in search_results]
        
        stmt = select(FaceEncoding).where(FaceEncoding.id.in_(face_ids))
        result = await session.execute(stmt)
        face_encodings = result.scalars().all()
        
        # Group by photo_id and keep best score
        photo_scores = {}
        for face_enc in face_encodings:
            # Find corresponding search result
            search_result = next((r for r in search_results if r["face_id"] == face_enc.id), None)
            if not search_result:
                continue
            
            photo_id = face_enc.photo_id
            score = search_result["score"]
            
            if photo_id not in photo_scores or score > photo_scores[photo_id]["score"]:
                photo_scores[photo_id] = {
                    "score": score,
                    "face_id": face_enc.id,
                    "bbox": face_enc.bounding_box,
                    "confidence": face_enc.confidence
                }
        
        # Get photos
        photo_ids = list(photo_scores.keys())[:top_k]
        
        stmt = select(Photo).where(Photo.id.in_(photo_ids))
        if event_id:
            stmt = stmt.where(Photo.event_id == event_id)
        
        result = await session.execute(stmt)
        photos = result.scalars().all()
        
        # 6. Build response
        matches = []
        for photo in photos:
            if photo.id in photo_scores:
                matches.append({
                    "photo_id": photo.id,
                    "filename": photo.filename,
                    "event_id": photo.event_id,
                    "similarity_score": round(photo_scores[photo.id]["score"], 4),
                    "face_bbox": photo_scores[photo.id]["bbox"],
                    "face_confidence": round(photo_scores[photo.id]["confidence"], 4),
                    "timestamp": photo.timestamp.isoformat(),
                    "url": f"/static/{photo.filename}"  # Adjust based on your static file serving
                })
        
        # Sort by similarity score
        matches.sort(key=lambda x: x["similarity_score"], reverse=True)
        
        search_time = time.time() - start_time
        
        # Log search
        await _log_search(session, current_user, request, len(matches), search_time)
        
        logger.info(f"Search completed: {len(matches)} matches in {search_time:.3f}s")
        
        return {
            "matches": matches,
            "count": len(matches),
            "query_confidence": round(query_confidence, 4),
            "search_time_ms": round(search_time * 1000, 2)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Face search failed: {e}")
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")
    
    finally:
        # Cleanup temp file
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except:
                pass

async def _log_search(
    session: AsyncSession,
    current_user: Optional[dict],
    request: Request,
    matches_found: int,
    search_time: float
):
    """
    Log search for analytics.
    """
    try:
        user_id = current_user.get("user_id") if current_user else None
        ip_address = request.client.host if request.client else None
        
        search_log = SearchLog(
            user_id=user_id,
            ip_address=ip_address,
            matches_found=matches_found,
            search_time_ms=search_time * 1000
        )
        
        session.add(search_log)
        await session.commit()
    except Exception as e:
        logger.error(f"Failed to log search: {e}")

@router.get("/stats")
async def get_search_stats(
    session: AsyncSession = Depends(get_db_session),
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    """
    Get search statistics.
    """
    from sqlalchemy import func
    
    # Total searches
    stmt = select(func.count(SearchLog.id))
    result = await session.execute(stmt)
    total_searches = result.scalar()
    
    # Average search time
    stmt = select(func.avg(SearchLog.search_time_ms))
    result = await session.execute(stmt)
    avg_search_time = result.scalar() or 0
    
    # Average matches
    stmt = select(func.avg(SearchLog.matches_found))
    result = await session.execute(stmt)
    avg_matches = result.scalar() or 0
    
    return {
        "total_searches": total_searches,
        "average_search_time_ms": round(avg_search_time, 2),
        "average_matches_per_search": round(avg_matches, 2)
    }
