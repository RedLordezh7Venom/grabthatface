"""
Production System Verification Script

Tests all components of the GrabThatFace system.
"""

import asyncio
import sys
import os

# Color codes
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
RESET = '\033[0m'

def print_test(name, passed, error=None):
    status = f"{GREEN}✓ PASS{RESET}" if passed else f"{RED}✗ FAIL{RESET}"
    print(f"{status} - {name}")
    if error and not passed:
        print(f"       Error: {error}")

async def test_imports():
    """Test that all required packages are installed."""
    print(f"\n{YELLOW}Testing Package Imports...{RESET}")
    
    tests = [
        ("FastAPI", "import fastapi"),
        ("SQLAlchemy", "import sqlalchemy"),
        ("Uvicorn", "import uvicorn"),
        ("Gunicorn", "import gunicorn"),
        ("InsightFace", "import insightface"),
        ("Qdrant Client", "from qdrant_client import QdrantClient"),
        ("Celery", "import celery"),
        ("Redis", "import redis"),
        ("NumPy", "import numpy"),
        ("OpenCV", "import cv2"),
        ("Pillow", "from PIL import Image"),
        ("AsyncPG", "import asyncpg"),
        ("Prometheus Client", "from prometheus_client import Counter"),
        ("Loguru", "from loguru import logger"),
        ("Python-JOSE", "from jose import jwt"),
        ("SlowAPI", "from slowapi import Limiter"),
    ]
    
    all_passed = True
    for name, import_stmt in tests:
        try:
            exec(import_stmt)
            print_test(name, True)
        except ImportError as e:
            print_test(name, False, str(e))
            all_passed = False
    
    return all_passed

async def test_database_connection():
    """Test PostgreSQL connection."""
    print(f"\n{YELLOW}Testing Database Connection...{RESET}")
    
    try:
        from app.core.config import settings
        from app.core.database import engine
        
        async with engine.connect() as conn:
            result = await conn.execute("SELECT 1")
            test_result = result.scalar()
            
        passed = test_result == 1
        print_test("PostgreSQL Connection", passed)
        return passed
    except Exception as e:
        print_test("PostgreSQL Connection", False, str(e))
        return False

async def test_qdrant_connection():
    """Test Qdrant connection."""
    print(f"\n{YELLOW}Testing Qdrant Connection...{RESET}")
    
    try:
        from app.services.vision_rag import processor
        
        health = processor.health_check()
        print_test("Qdrant Connection", health)
        
        if health:
            info = processor.get_collection_info()
            print(f"       Collection: {info.get('vectors_count', 0)} vectors indexed")
        
        return health
    except Exception as e:
        print_test("Qdrant Connection", False, str(e))
        return False

async def test_redis_connection():
    """Test Redis connection."""
    print(f"\n{YELLOW}Testing Redis Connection...{RESET}")
    
    try:
        import redis
        from app.core.config import settings
        
        r = redis.from_url(settings.REDIS_URL)
        r.ping()
        
        print_test("Redis Connection", True)
        return True
    except Exception as e:
        print_test("Redis Connection", False, str(e))
        return False

async def test_insightface_model():
    """Test InsightFace model loading."""
    print(f"\n{YELLOW}Testing InsightFace Model...{RESET}")
    
    try:
        from app.services.vision_rag import processor
        
        has_model = processor.app is not None
        print_test("InsightFace Model Loaded", has_model)
        
        if has_model:
            print(f"       Model: buffalo_l (ArcFace 512-d)")
        
        return has_model
    except Exception as e:
        print_test("InsightFace Model Loaded", False, str(e))
        return False

</html>
async def test_face_detection():
    """Test face detection on sample image."""
    print(f"\n{YELLOW}Testing Face Detection...{RESET}")
    
    try:
        from app.services.vision_rag import processor
        import numpy as np
        from PIL import Image
        import cv2
        
        # Create a simple test image (black square)
        test_image = np.zeros((640, 640, 3), dtype=np.uint8)
        test_path = "/tmp/test_face_detection.jpg"
        cv2.imwrite(test_path, test_image)
        
        # Try to detect faces (should find none in black image)
        faces = processor.extract_faces(test_path)
        
        # Test passes if it runs without error
        print_test("Face Detection System", True)
        print(f"       Detected {len(faces)} faces in test image (expected 0)")
        
        os.remove(test_path)
        return True
    except Exception as e:
        print_test("Face Detection System", False, str(e))
        return False

async def test_environment_config():
    """Test environment configuration."""
    print(f"\n{YELLOW}Testing Environment Configuration...{RESET}")
    
    try:
        from app.core.config import settings
        
        tests = [
            ("DATABASE_URL", settings.DATABASE_URL),
            ("REDIS_URL", settings.REDIS_URL),
            ("QDRANT_HOST", settings.QDRANT_HOST),
            ("SECRET_KEY", settings.SECRET_KEY),
            ("VECTOR_DIMENSION", settings.VECTOR_DIMENSION == 512),
        ]
        
        all_passed = True
        for name, value in tests:
            if isinstance(value, bool):
                passed = value
            else:
                passed = value is not None and value != ""
            
            print_test(f"Config: {name}", passed)
            if not passed:
                all_passed = False
        
        # Check if SECRET_KEY is changed from default
        if "CHANGE_ME" in settings.SECRET_KEY:
            print(f"       {YELLOW}⚠ WARNING: SECRET_KEY is still default! Change it in production!{RESET}")
        
        return all_passed
    except Exception as e:
        print_test("Environment Configuration", False, str(e))
        return False

async def test_api_health():
    """Test API health endpoint."""
    print(f"\n{YELLOW}Testing API Endpoints...{RESET}")
    
    try:
        from app.main_production import app
        from fastapi.testclient import TestClient
        
        client = TestClient(app)
        
        # Test health endpoint
        response = client.get("/health")
        health_passed = response.status_code == 200
        print_test("Health Endpoint", health_passed)
        
        # Test detailed health
        response = client.get("/health/detailed")
        detailed_passed = response.status_code in [200, 503]  # 503 if some services down
        print_test("Detailed Health Endpoint", detailed_passed)
        
        # Test root endpoint
        response = client.get("/")
        root_passed = response.status_code == 200
        print_test("Root Endpoint", root_passed)
        
        return health_passed and detailed_passed and root_passed
    except Exception as e:
        print_test("API Endpoints", False, str(e))
        return False

async def run_all_tests():
    """Run all system tests."""
    print(f"\n{GREEN}{'='*60}{RESET}")
    print(f"{GREEN}GrabThatFace Production System Verification{RESET}")
    print(f"{GREEN}{'='*60}{RESET}")
    
    results = {}
    
    # Run tests
    results['imports'] = await test_imports()
    results['config'] = await test_environment_config()
    results['database'] = await test_database_connection()
    results['redis'] = await test_redis_connection()
    results['qdrant'] = await test_qdrant_connection()
    results['insightface'] = await test_insightface_model()
    results['face_detection'] = await test_face_detection()
    results['api'] = await test_api_health()
    
    # Summary
    print(f"\n{GREEN}{'='*60}{RESET}")
    print(f"{GREEN}Test Summary{RESET}")
    print(f"{GREEN}{'='*60}{RESET}")
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for name, result in results.items():
        status = f"{GREEN}✓{RESET}" if result else f"{RED}✗{RESET}"
        print(f"{status} {name.replace('_', ' ').title()}")
    
    print(f"\n{passed}/{total} tests passed")
    
    if passed == total:
        print(f"\n{GREEN}✅ All systems operational! Ready for production.{RESET}")
        return 0
    else:
        print(f"\n{RED}⚠️  Some tests failed. Please fix issues before deploying.{RESET}")
        return 1

if __name__ == "__main__":
    exit_code = asyncio.run(run_all_tests())
    sys.exit(exit_code)
