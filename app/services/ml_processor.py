import face_recognition
import numpy as np
import mlflow
import faiss
import os
import threading
from typing import List, Tuple, Optional
from app.core.config import settings
from loguru import logger

class VisionRAGProcessor:
    """
    Production-grade Vision RAG Processor.
    Uses FAISS (HNSW) for $O(log N)$ vector search.
    """
    def __init__(self):
        self.dimension = settings.VECTOR_DIMENSION
        # HNSW is many times faster than exhaustive search for large datasets
        self.index = faiss.IndexHNSWFlat(self.dimension, 32) # 32 is the number of neighbors
        self.metadata_map = {} # Maps index ID to internal database ID
        self._lock = threading.Lock() # For thread-safety within a process
        
        mlflow.set_experiment("grabthatface-vision-rag")
        logger.info("VisionRAGProcessor initialized with FAISS HNSW index")

    def extract_features(self, image_path: str) -> List[Tuple[np.ndarray, List[int]]]:
        """Extract 128-d face embeddings."""
        try:
            image = face_recognition.load_image_file(image_path)
            # Use hog for CPU-bound production environments
            face_locations = face_recognition.face_locations(image, model="hog")
            face_encodings = face_recognition.face_encodings(image, face_locations)
            return list(zip(face_encodings, face_locations))
        except Exception as e:
            logger.error(f"VisionRAG: Feature extraction failed for {image_path}: {e}")
            return []

    def add_to_index(self, face_id: int, encoding: np.ndarray):
        """Add a single vector to the FAISS index."""
        with self._lock:
            # FAISS requires float32
            vector = encoding.reshape(1, -1).astype('float32')
            # We use a simple sequential ID in FAISS and map it to our DB ID
            current_id = self.index.ntotal
            self.index.add(vector)
            self.metadata_map[current_id] = face_id
            logger.debug(f"VisionRAG: Added face_id {face_id} to FAISS index. Total: {self.index.ntotal}")

    def query(self, query_encoding: np.ndarray, k: int = 20) -> List[int]:
        """
        Fastest vector search using FAISS.
        Returns a list of face internal IDs.
        """
        if self.index.ntotal == 0:
            return []
            
        query_vector = query_encoding.reshape(1, -1).astype('float32')
        # Search for k nearest neighbors
        distances, indices = self.index.search(query_vector, k)
        
        # Filter by tolerance (Distance in FAISS L2 is squared Euclidean)
        threshold = settings.FACE_RECOGNITION_TOLERANCE ** 2
        matches = []
        for dist, idx in zip(distances[0], indices[0]):
            if idx != -1 and dist <= threshold:
                face_id = self.metadata_map.get(idx)
                if face_id:
                    matches.append(face_id)
                    
        return matches

    def save_index(self, path: str = "data/faiss_index.bin"):
        faiss.write_index(self.index, path)
        
    def load_index(self, path: str = "data/faiss_index.bin"):
        if os.path.exists(path):
            self.index = faiss.read_index(path)

processor = VisionRAGProcessor()
