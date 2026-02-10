import pytest
import numpy as np
import os
import json
from app.services.ml_processor import processor
from app.core.config import settings

def test_vision_rag_precision_recall():
    """
    Accuracy Requirement: Ensure Vision RAG (FAISS) matches the exact same vector 
    when queried within HNSW tolerance.
    """
    # 1. Generate a ground truth vector
    ground_truth = np.random.rand(128).astype('float32')
    face_id = 999
    
    # 2. Add to index
    processor.add_to_index(face_id, ground_truth)
    
    # 3. Query with the exact same vector
    matches = processor.query(ground_truth, k=1)
    assert face_id in matches, "Identity match failed: could not find the exact same vector"
    
    # 4. Query with a slightly perturbed vector (within tolerance)
    perturbed = ground_truth + 0.01
    matches_perturbed = processor.query(perturbed, k=5)
    assert face_id in matches_perturbed, f"Recall failure: slightly perturbed vector missed (tolerance={settings.FACE_RECOGNITION_TOLERANCE})"
    
    # 5. Query with an orthogonal/distant vector
    distant = np.random.rand(128).astype('float32') * 10
    matches_distant = processor.query(distant, k=5)
    assert face_id not in matches_distant, "Precision failure: distant vector matched incorrectly"

def test_ml_processor_normalization():
    """
    Quality Requirement: Ensure encodings are handled as float32 to avoid precision 
    drift in vector search.
    """
    fake_encoding = np.arange(128).astype('float64') # Intentionally high precision
    
    # Real test: add_to_index handles conversion from float64 and un-reshaped arrays
    processor.add_to_index(1, fake_encoding)
    assert processor.index.ntotal > 0
    # Search should still work
    matches = processor.query(fake_encoding.astype('float32'))
    assert 1 in matches
