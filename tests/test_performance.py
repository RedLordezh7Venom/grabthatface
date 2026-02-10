import pytest
import time
import numpy as np
from app.services.ml_processor import processor

def test_faiss_search_performance():
    """
    Quality Requirement: Ensure FAISS search remains sub-millisecond for 1000 faces.
    """
    # 1. Setup 1000 random face encodings
    num_faces = 1000
    for i in range(num_faces):
        encoding = np.random.rand(128).astype('float32')
        processor.add_to_index(i, encoding)
    
    # 2. Benchmark querying
    query_encoding = np.random.rand(128).astype('float32')
    
    start_time = time.time()
    results = processor.query(query_encoding, k=20)
    duration_ms = (time.time() - start_time) * 1000
    
    print(f"\nFAISS Search Latency for {num_faces} vectors: {duration_ms:.4f}ms")
    
    # We expect FAISS HNSW to be extremely fast
    assert duration_ms < 1.0, f"FAISS search is too slow: {duration_ms}ms"

def test_extraction_latency_baseline():
    """
    Quality Requirement: Baseline check for feature extraction speed.
    """
    from PIL import Image
    import io
    import os
    
    # Create a standard 640x480 test image
    img = Image.new('RGB', (640, 480), color=(128, 128, 128))
    test_path = "tests/latency_test.jpg"
    img.save(test_path)
    
    try:
        start_time = time.time()
        processor.extract_features(test_path)
        duration_sec = time.time() - start_time
        
        print(f"\nExtraction Latency (CPU): {duration_sec:.4f}s")
        
        # dlib hog usually takes < 0.5s on a decent CPU for 640x480
        # This is a soft check as CI runners might be slow
        assert duration_sec < 2.0, f"Inference is exceptionally slow: {duration_sec}s"
    finally:
        if os.path.exists(test_path):
            os.remove(test_path)
