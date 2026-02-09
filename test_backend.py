import requests
import json

BASE_URL = "http://localhost:8000"

def test_root():
    try:
        response = requests.get(f"{BASE_URL}/")
        print(f"Root endpoint: {response.status_code}")
        print(response.json())
        assert response.status_code == 200
    except Exception as e:
        print(f"Root endpoint failed: {e}")

if __name__ == "__main__":
    test_root()
