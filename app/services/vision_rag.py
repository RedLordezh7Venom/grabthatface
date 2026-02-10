import insightface
import numpy as np
import cv2
from typing import List, Tuple, Optional, Dict, Any
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct, Filter, FieldCondition, MatchValue
import uuid
import time
from loguru import logger
from app.core.config import settings
import mlflow
import os

class ProductionVisionRAG:
    """
    Production-grade Vision RAG with InsightFace ArcFace and Qdrant.
    
    Features:
    - State-of-the-art face recognition (ArcFace, 512-d embeddings)
    - Distributed vector search with Qdrant (HNSW algorithm)
    - CPU-optimized inference
    - Thread-safe operations
    - MLflow experiment tracking
    - Graceful degradation
    """
    
    def __init__(self):
        self.dimension = settings.VECTOR_DIMENSION
        self.tolerance = settings.FACE_RECOGNITION_TOLERANCE
        
        # Initialize InsightFace model
        logger.info(f"Initializing InsightFace model: {settings.FACE_MODEL_NAME}")
        try:
            self.app = insightface.app.FaceAnalysis(
                name=settings.FACE_MODEL_NAME,
                providers=['CPUExecutionProvider']  # CPU-optimized
            )
            self.app.prepare(ctx_id=-1, det_size=(640, 640))  # -1 for CPU
            logger.info("InsightFace model loaded successfully (CPU mode)")
        except Exception as e:
            logger.error(f"Failed to load InsightFace model: {e}")
            raise
        
        # Initialize Qdrant client
        logger.info(f"Connecting to Qdrant at {settings.QDRANT_HOST}:{settings.QDRANT_PORT}")
        try:
            if settings.QDRANT_API_KEY:
                # Qdrant Cloud
                self.qdrant_client = QdrantClient(
                    url=f"https://{settings.QDRANT_HOST}",
                    api_key=settings.QDRANT_API_KEY,
                    timeout=30,
                    prefer_grpc=True
                )
            else:
                # Local Qdrant
                self.qdrant_client = QdrantClient(
                    host=settings.QDRANT_HOST,
                    port=settings.QDRANT_PORT,
                    grpc_port=settings.QDRANT_GRPC_PORT,
                    timeout=30,
                    prefer_grpc=True
                )
            
            # Create collection if it doesn't exist
            self._ensure_collection()
            logger.info("Qdrant client initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Qdrant client: {e}")
            raise
        
        # MLflow tracking
        try:
            mlflow.set_tracking_uri(settings.MLFLOW_TRACKING_URI)
            mlflow.set_experiment("grabthatface-production")
        except Exception as e:
            logger.warning(f"MLflow tracking unavailable: {e}")
    
    def _ensure_collection(self):
        """
        Ensure Qdrant collection exists with proper configuration.
        """
        try:
            collections = self.qdrant_client.get_collections().collections
            collection_names = [c.name for c in collections]
            
            if settings.QDRANT_COLLECTION_NAME not in collection_names:
                logger.info(f"Creating Qdrant collection: {settings.QDRANT_COLLECTION_NAME}")
                self.qdrant_client.create_collection(
                    collection_name=settings.QDRANT_COLLECTION_NAME,
                    vectors_config=VectorParams(
                        size=self.dimension,
                        distance=Distance.COSINE,  # Cosine similarity for face embeddings
                    ),
                    # HNSW configuration for optimal search performance
                    hnsw_config={
                        "m": 16,  # Number of edges per node
                        "ef_construct": 100,  # Construction time/accuracy tradeoff
                    },
                    optimizers_config={
                        "default_segment_number": 2,
                    },
                )
                logger.info("Collection created successfully with HNSW indexing")
            else:
                logger.info(f"Collection {settings.QDRANT_COLLECTION_NAME} already exists")
        except Exception as e:
            logger.error(f"Failed to ensure collection: {e}")
            raise
    
    def extract_faces(self, image_path: str) -> List[Dict[str, Any]]:
        """
        Extract face embeddings and metadata from an image.
        
        Returns:
            List of dicts containing:
            - embedding: 512-d numpy array
            - bbox: [x, y, width, height]
            - confidence: detection confidence score
            - landmarks: facial landmarks (optional)
        """
        try:
            start_time = time.time()
            
            # Load image
            img = cv2.imread(image_path)
            if img is None:
                logger.error(f"Failed to load image: {image_path}")
                return []
            
            # Detect and analyze faces
            faces = self.app.get(img)
            
            if not faces:
                logger.debug(f"No faces detected in {image_path}")
                return []
            
            results = []
            for face in faces:
                if face.det_score < settings.DETECTION_THRESHOLD:
                    continue
                
                # Extract embedding (ArcFace produces 512-d normalized embeddings)
                embedding = face.embedding
                
                # Bounding box [x, y, width, height]
                bbox = face.bbox.astype(int).tolist()
                
                results.append({
                    "embedding": embedding,
                    "bbox": bbox,
                    "confidence": float(face.det_score),
                    "landmarks": face.landmark_2d_106.tolist() if hasattr(face, 'landmark_2d_106') else None,
                })
            
            extraction_time = time.time() - start_time
            logger.info(f"Extracted {len(results)} faces from {image_path} in {extraction_time:.3f}s")
            
            # Log to MLflow
            if settings.ENABLE_METRICS:
                try:
                    mlflow.log_metric("extraction_time_seconds", extraction_time)
                    mlflow.log_metric("faces_detected", len(results))
                except:
                    pass
            
            return results
            
        except Exception as e:
            logger.error(f"Face extraction failed for {image_path}: {e}")
            return []
    
    def add_to_index(self, face_id: int, embedding: np.ndarray, metadata: Dict[str, Any] = None):
        """
        Add a face embedding to Qdrant vector database.
        
        Args:
            face_id: Database ID of the face encoding
            embedding: 512-d face embedding
            metadata: Additional metadata (photo_id, bbox, etc.)
        """
        try:
            # Ensure embedding is normalized (ArcFace outputs normalized embeddings)
            if np.linalg.norm(embedding) > 0:
                embedding = embedding / np.linalg.norm(embedding)
            
            point = PointStruct(
                id=face_id,
                vector=embedding.tolist(),
                payload=metadata or {}
            )
            
            self.qdrant_client.upsert(
                collection_name=settings.QDRANT_COLLECTION_NAME,
                points=[point]
            )
            
            logger.debug(f"Added face_id {face_id} to Qdrant index")
            
        except Exception as e:
            logger.error(f"Failed to add face_id {face_id} to Qdrant: {e}")
            raise
    
    def search_similar_faces(self, query_embedding: np.ndarray, top_k: int = 50, score_threshold: Optional[float] = None) -> List[Dict[str, Any]]:
        """
        Search for similar faces in Qdrant using HNSW.
        
        Args:
            query_embedding: 512-d query face embedding
            top_k: Number of results to return
            score_threshold: Minimum similarity score (optional)
        
        Returns:
            List of matches with face_id, score, and metadata
        """
        try:
            start_time = time.time()
            
            # Normalize query embedding
            if np.linalg.norm(query_embedding) > 0:
                query_embedding = query_embedding / np.linalg.norm(query_embedding)
            
            # Use tolerance as score threshold if not provided
            if score_threshold is None:
                score_threshold = 1 - self.tolerance  # Convert distance to similarity
            
            # Search in Qdrant
            search_results = self.qdrant_client.search(
                collection_name=settings.QDRANT_COLLECTION_NAME,
                query_vector=query_embedding.tolist(),
                limit=top_k,
                score_threshold=score_threshold,
                with_payload=True
            )
            
            search_time = time.time() - start_time
            
            results = []
            for hit in search_results:
                results.append({
                    "face_id": hit.id,
                    "score": hit.score,
                    "metadata": hit.payload
                })
            
            logger.info(f"Found {len(results)} similar faces in {search_time:.3f}s")
            
            # Log to MLflow
            if settings.ENABLE_METRICS:
                try:
                    mlflow.log_metric("search_time_seconds", search_time)
                    mlflow.log_metric("matches_found", len(results))
                except:
                    pass
            
            return results
            
        except Exception as e:
            logger.error(f"Face search failed: {e}")
            return []
    
    def batch_add_to_index(self, face_data: List[Tuple[int, np.ndarray, Dict[str, Any]]]):
        """
        Batch add multiple faces to Qdrant for better performance.
        
        Args:
            face_data: List of (face_id, embedding, metadata) tuples
        """
        try:
            points = []
            for face_id, embedding, metadata in face_data:
                # Normalize embedding
                if np.linalg.norm(embedding) > 0:
                    embedding = embedding / np.linalg.norm(embedding)
                
                points.append(
                    PointStruct(
                        id=face_id,
                        vector=embedding.tolist(),
                        payload=metadata or {}
                    )
                )
            
            self.qdrant_client.upsert(
                collection_name=settings.QDRANT_COLLECTION_NAME,
                points=points
            )
            
            logger.info(f"Batch added {len(points)} faces to Qdrant")
            
        except Exception as e:
            logger.error(f"Batch add failed: {e}")
            raise
    
    def get_collection_info(self) -> Dict[str, Any]:
        """
        Get information about the Qdrant collection.
        """
        try:
            info = self.qdrant_client.get_collection(settings.QDRANT_COLLECTION_NAME)
            return {
                "vectors_count": info.vectors_count,
                "points_count": info.points_count,
                "status": info.status,
                "optimizer_status": info.optimizer_status,
            }
        except Exception as e:
            logger.error(f"Failed to get collection info: {e}")
            return {}
    
    def health_check(self) -> bool:
        """
        Check if the service is healthy.
        """
        try:
            # Check Qdrant connection
            self.qdrant_client.get_collections()
            return True
        except:
            return False

# Global instance
processor = ProductionVisionRAG()
