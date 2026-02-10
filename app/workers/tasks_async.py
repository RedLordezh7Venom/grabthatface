import json
import numpy as np
from typing import Dict, Any
from loguru import logger
from app.workers.celery_app import celery_app
from app.services.vision_rag import processor
from app.core.config import settings
import asyncio
from sqlalchemy import select, update
from app.core.database import AsyncSessionLocal
from app.models_async import Photo, FaceEncoding
from datetime import datetime

@celery_app.task(name="process_photo_extract_faces", bind=True, max_retries=3)
def process_photo_extract_faces(self, photo_id: int, file_path: str):
    """
    Background worker task to extract face encodings using InsightFace ArcFace
    and index them in Qdrant.
    
    This task:
    1. Extracts 512-d face embeddings using InsightFace
    2. Stores embeddings in PostgreSQL
    3. Indexes embeddings in Qdrant for fast similarity search
    """
    logger.info(f"Worker: Starting face extraction for photo {photo_id}")
    
    try:
        # 1. Extract faces using InsightFace ArcFace
        faces = processor.extract_faces(file_path)
        
        if not faces:
            logger.warning(f"Worker: No faces found in photo {photo_id}")
            # Update photo status
            asyncio.run(_update_photo_status(photo_id, "completed", 0))
            return {
                "photo_id": photo_id,
                "faces_found": 0,
                "status": "no_faces"
            }
        
        # 2. Store in database and index in Qdrant
        face_ids = asyncio.run(_store_and_index_faces(photo_id, faces))
        
        # 3. Update photo status
        asyncio.run(_update_photo_status(photo_id, "completed", len(faces)))
        
        logger.info(f"Worker: Successfully processed photo {photo_id}. Found {len(faces)} faces.")
        
        return {
            "photo_id": photo_id,
            "faces_found": len(faces),
            "face_ids": face_ids,
            "status": "success"
        }
        
    except Exception as e:
        logger.error(f"Worker: Failed to process photo {photo_id}: {e}")
        
        # Update photo status to failed
        try:
            asyncio.run(_update_photo_status(photo_id, "failed", 0))
        except:
            pass
        
        # Retry with exponential backoff
        raise self.retry(exc=e, countdown=2 ** self.request.retries)

async def _store_and_index_faces(photo_id: int, faces: list) -> list:
    """
    Store face encodings in database and index in Qdrant.
    """
    face_ids = []
    
    async with AsyncSessionLocal() as session:
        try:
            for face_data in faces:
                # Create face encoding record
                encoding_json = json.dumps(face_data["embedding"].tolist())
                
                face_encoding = FaceEncoding(
                    photo_id=photo_id,
                    embedding_json=encoding_json,
                    bounding_box={
                        "x": int(face_data["bbox"][0]),
                        "y": int(face_data["bbox"][1]),
                        "width": int(face_data["bbox"][2] - face_data["bbox"][0]),
                        "height": int(face_data["bbox"][3] - face_data["bbox"][1])
                    },
                    confidence=face_data["confidence"],
                    landmarks=face_data.get("landmarks"),
                    qdrant_synced=0
                )
                
                session.add(face_encoding)
                await session.flush()
                await session.refresh(face_encoding)
                
                # Index in Qdrant
                try:
                    processor.add_to_index(
                        face_id=face_encoding.id,
                        embedding=face_data["embedding"],
                        metadata={
                            "photo_id": photo_id,
                            "confidence": face_data["confidence"],
                            "bbox": face_encoding.bounding_box
                        }
                    )
                    
                    # Mark as synced
                    face_encoding.qdrant_synced = 1
                    face_encoding.qdrant_synced_at = datetime.utcnow()
                    
                except Exception as e:
                    logger.error(f"Failed to index face {face_encoding.id} in Qdrant: {e}")
                
                face_ids.append(face_encoding.id)
            
            await session.commit()
            logger.info(f"Stored and indexed {len(face_ids)} faces for photo {photo_id}")
            
            return face_ids
            
        except Exception as e:
            await session.rollback()
            logger.error(f"Failed to store faces for photo {photo_id}: {e}")
            raise

async def _update_photo_status(photo_id: int, status: str, faces_count: int = 0):
    """
    Update photo processing status.
    """
    async with AsyncSessionLocal() as session:
        try:
            stmt = (
                update(Photo)
                .where(Photo.id == photo_id)
                .values(processing_status=status)
            )
            await session.execute(stmt)
            await session.commit()
            logger.debug(f"Updated photo {photo_id} status to {status}")
        except Exception as e:
            await session.rollback()
            logger.error(f"Failed to update photo status: {e}")

@celery_app.task(name="sync_unsynced_faces", bind=True)
def sync_unsynced_faces(self):
    """
    Periodic task to sync any faces that failed to index in Qdrant.
    Run this every 5 minutes via celery beat.
    """
    logger.info("Worker: Starting periodic sync of unsynced faces")
    
    try:
        synced_count = asyncio.run(_sync_faces_to_qdrant())
        logger.info(f"Worker: Synced {synced_count} faces to Qdrant")
        return {"synced_count": synced_count}
    except Exception as e:
        logger.error(f"Worker: Periodic sync failed: {e}")
        raise

async def _sync_faces_to_qdrant(batch_size: int = 100) -> int:
    """
    Sync unsynced faces to Qdrant in batches.
    """
    async with AsyncSessionLocal() as session:
        try:
            # Get unsynced faces
            stmt = (
                select(FaceEncoding)
                .where(FaceEncoding.qdrant_synced == 0)
                .limit(batch_size)
            )
            result = await session.execute(stmt)
            unsynced_faces = result.scalars().all()
            
            if not unsynced_faces:
                return 0
            
            # Prepare batch data
            batch_data = []
            for face in unsynced_faces:
                embedding = np.array(json.loads(face.embedding_json))
                batch_data.append((
                    face.id,
                    embedding,
                    {
                        "photo_id": face.photo_id,
                        "confidence": face.confidence,
                        "bbox": face.bounding_box
                    }
                ))
            
            # Batch add to Qdrant
            processor.batch_add_to_index(batch_data)
            
            # Mark as synced
            face_ids = [face.id for face in unsynced_faces]
            stmt = (
                update(FaceEncoding)
                .where(FaceEncoding.id.in_(face_ids))
                .values(qdrant_synced=1, qdrant_synced_at=datetime.utcnow())
            )
            await session.execute(stmt)
            await session.commit()
            
            return len(unsynced_faces)
            
        except Exception as e:
            await session.rollback()
            logger.error(f"Failed to sync faces to Qdrant: {e}")
            raise
