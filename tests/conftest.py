import pytest
from fastapi.testclient import TestClient
from sqlmodel import SQLModel, create_engine, Session
from app.main import app as fastapi_app
from app.database import get_session
import os
from unittest.mock import patch

import app.database

# Use a test-specific SQLite database
TEST_DB_URL = "sqlite:///./test.db"

@pytest.fixture(name="session")
def session_fixture(monkeypatch):
    test_engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
    # Patch the global engine so background tasks and services use the test database
    import app.database
    import app.workers.tasks
    monkeypatch.setattr(app.database, "engine", test_engine)
    monkeypatch.setattr(app.workers.tasks, "engine", test_engine)
    
    SQLModel.metadata.create_all(test_engine)
    with Session(test_engine) as session:
        yield session
    
    SQLModel.metadata.drop_all(test_engine)
    if os.path.exists("./test.db"):
        os.remove("./test.db")

@pytest.fixture(name="client")
def client_fixture(session: Session):
    def get_session_override():
        return session
    fastapi_app.dependency_overrides[get_session] = get_session_override
    client = TestClient(fastapi_app)
    yield client
    fastapi_app.dependency_overrides.clear()
@pytest.fixture(autouse=True)
def mock_celery_sync():
    """
    Force Celery tasks to run synchronously during tests.
    """
    with patch("app.workers.tasks.process_photo_and_extract_faces.delay") as mock_delay:
        def side_effect(*args, **kwargs):
            from app.workers.tasks import process_photo_and_extract_faces
            return process_photo_and_extract_faces(*args, **kwargs)
        mock_delay.side_effect = side_effect
        yield mock_delay
