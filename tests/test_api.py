import pytest
from fastapi.testclient import TestClient
import os

def test_health_check(client: TestClient):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_photo_upload_basic(client: TestClient):
    """
    Test that uploading a valid image returns a 200 and a processing status.
    """
    # Create a tiny dummy image
    from PIL import Image
    import io
    
    img = Image.new('RGB', (100, 100), color=(73, 109, 137))
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format='JPEG')
    img_byte_arr = img_byte_arr.getvalue()

    response = client.post(
        "/api/v1/photos/",
        files={"file": ("test.jpg", img_byte_arr, "image/jpeg")},
        data={"event_id": "test_event"}
    )
    
    # We expect success because the endpoint uses BackgroundTasks
    assert response.status_code == 200
    data = response.json()
    assert "id" in data
    assert data["status"] == "processing"

def test_search_no_face(client: TestClient):
    """
    Test that searching with an image containing no faces returns 400.
    """
    from PIL import Image
    import io
    
    # Solid color image (definitely no faces)
    img = Image.new('RGB', (100, 100), color=(0, 0, 0))
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format='JPEG')
    img_byte_arr = img_byte_arr.getvalue()

    response = client.post(
        "/api/v1/search/",
        files={"file": ("selfie.jpg", img_byte_arr, "image/jpeg")}
    )
    
    # The API raises 400 if no face is detected
    assert response.status_code == 400
    assert "No face detected" in response.json()["detail"]
