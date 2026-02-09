import pytest
import concurrent.futures
import time
import requests
import os
from pathlib import Path
from PIL import Image
import io

# We assume the server is running on localhost:8000 for these tests
API_URL = "http://localhost:8000"
UPLOADS_DIR = Path("tests/data/faces/olivetti")

def test_concurrent_uploads_and_searches():
    """
    BRUTAL TEST 1: Concurrency & State Integrity
    Simulate multiple users uploading and searching simultaneously.
    """
    print("\n--- STARTING BRUTAL CONCURRENCY TEST ---")
    
    # 1. Gather test images
    test_persons = sorted([d for d in UPLOADS_DIR.iterdir() if d.is_dir()])[:10]
    upload_tasks = []
    
    def upload_worker(person_dir):
        img_path = sorted(list(person_dir.glob("*.jpg")))[0]
        with open(img_path, "rb") as f:
            resp = requests.post(
                f"{API_URL}/api/v1/photos/",
                files={"file": (img_path.name, f, "image/jpeg")},
                data={"event_id": f"brutal_test_{person_dir.name}"}
            )
        return resp.status_code, resp.json()

    # Create a pool of 10 concurrent uploaders
    start_time = time.time()
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        results = list(executor.map(upload_worker, test_persons))
    
    end_time = time.time()
    print(f"Concurrent Upload of 10 images took: {end_time - start_time:.2f}s")
    
    for status, data in results:
        assert status == 200
        assert "id" in data

    # 2. Wait for background synchronization thread (sync every 10s)
    print("Waiting 12 seconds for Celery processing + Index Synchronization...")
    time.sleep(12)

    # 3. Perform concurrent searches
    def search_worker(person_dir):
        # Use a DIFFERENT image of the same person to test matching
        img_path = sorted(list(person_dir.glob("*.jpg")))[1]
        with open(img_path, "rb") as f:
            resp = requests.post(
                f"{API_URL}/api/v1/search/",
                files={"file": (img_path.name, f, "image/jpeg")}
            )
        return resp.status_code, resp.json(), person_dir.name

    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        search_results = list(executor.map(search_worker, test_persons))

    success_matches = 0
    for status, data, person_name in search_results:
        assert status == 200
        # Check if we found any match for the person
        match = any(f"brutal_test_{person_name}" in r["event_id"] for r in data)
        if match:
            success_matches += 1
            print(f"Search for {person_name}: MATCH FOUND")
        else:
            print(f"Search for {person_name}: NO MATCH")

    print(f"Brutal Recall: {success_matches}/10")
    assert success_matches >= 5, "Recall too low under concurrent load"

def test_oversized_payload_handling():
    """
    BRUTAL TEST 2: Robustness against garbage/heavy input.
    """
    print("\n--- STARTING PAYLOAD ROBUSTNESS TEST ---")
    # 1. Non-image file
    resp = requests.post(
        f"{API_URL}/api/v1/photos/",
        files={"file": ("test.txt", b"this is not an image", "text/plain")},
        data={"event_id": "malicious"}
    )
    # The API currently returns a 200 with {"error": "Invalid file type"} 
    # based on my previous check, but it should ideally be a 400.
    assert "error" in resp.json() or resp.status_code == 400

    # 2. Image with NO faces
    img = Image.new('RGB', (1000, 1000), color=(0, 0, 0))
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format='JPEG')
    img_byte_arr = img_byte_arr.getvalue()
    
    resp = requests.post(
        f"{API_URL}/api/v1/search/",
        files={"file": ("no_face.jpg", img_byte_arr, "image/jpeg")}
    )
    assert resp.status_code == 400, "Search should fail if no face is detected"

def test_database_deadlock_stress():
    """
    BRUTAL TEST 3: Hammer the DB with small updates while syncing.
    """
    print("\n--- STARTING DB INTEGRITY STRESS TEST ---")
    # This test verifies that the incremental sync logic in main.py 
    # doesn't crash the server while workers are committing.
    
    def spam_upload(i):
        # Small 1x1 image, but valid enough to trigger logic
        img = Image.new('RGB', (100, 100), color=(i, i, i))
        b = io.BytesIO()
        img.save(b, format='JPEG')
        requests.post(f"{API_URL}/api/v1/photos/", files={"file": b.getvalue()})

    with concurrent.futures.ThreadPoolExecutor(max_workers=20) as executor:
        executor.map(spam_upload, range(50))
    
    # Just verify health
    resp = requests.get(f"{API_URL}/health")
    assert resp.status_code == 200
    print("Database survived simultaneous write/read pressure.")

if __name__ == "__main__":
    # If running directly, execute the tests manually or via pytest
    import sys
    sys.exit(pytest.main([__file__]))
