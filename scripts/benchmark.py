import time
import numpy as np
import requests
import json

def benchmark_search_vectorized():
    # Simulate a production database of 10,000 face encodings
    db_size = 10000
    db_encodings = np.random.rand(db_size, 128)
    query_encoding = np.random.rand(128)
    
    start = time.time()
    # Mocking the processor logic
    distances = np.linalg.norm(db_encodings - query_encoding, axis=1)
    matches = np.where(distances <= 0.6)[0]
    duration = time.time() - start
    
    print(f"Benchmark: Scanned {db_size} faces in {duration*1000:.2f}ms")
    print(f"Matches found: {len(matches)}")
    
    # In production, < 10ms for 10k faces is expected with NumPy
    assert duration < 0.1, "Vectorized search too slow!"

if __name__ == "__main__":
    benchmark_search_vectorized()
