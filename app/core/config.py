from pydantic_settings import BaseSettings
from typing import List, Optional
import os

class Settings(BaseSettings):
    # API Settings
    PROJECT_NAME: str = "GrabThatFace Production"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "PRODUCTION_STRENGTH_SECRET_KEY_CHANGE_ME_IN_ENV")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    ALGORITHM: str = "HS256"
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:8000"]
    
    # DATABASE - PostgreSQL for production
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql+asyncpg://grabthatface:grabthatface_pass@localhost:5432/grabthatface"
    )
    # Connection Pool Settings
    DB_POOL_SIZE: int = 20
    DB_MAX_OVERFLOW: int = 40
    DB_POOL_TIMEOUT: int = 30
    DB_POOL_RECYCLE: int = 3600
    
    # AI/ML - InsightFace ArcFace Configuration
    FACE_MODEL_NAME: str = "buffalo_l"  # High accuracy model
    FACE_RECOGNITION_TOLERANCE: float = 0.45  # Stricter for ArcFace (512-d)
    VECTOR_DIMENSION: int = 512  # ArcFace produces 512-d embeddings
    DETECTION_THRESHOLD: float = 0.5  # Face detection confidence
    
    # Qdrant Vector Database
    QDRANT_HOST: str = os.getenv("QDRANT_HOST", "localhost")
    QDRANT_PORT: int = int(os.getenv("QDRANT_PORT", "6333"))
    QDRANT_GRPC_PORT: int = int(os.getenv("QDRANT_GRPC_PORT", "6334"))
    QDRANT_COLLECTION_NAME: str = "face_embeddings"
    QDRANT_API_KEY: Optional[str] = os.getenv("QDRANT_API_KEY")  # For Qdrant Cloud
    
    # INFRA
    STORAGE_PATH: str = "data/uploads"
    FACE_DIR: str = "data/faces"
    
    # DISTRIBUTED SYSTEMS
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    CELERY_BROKER_URL: str = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0")
    CELERY_RESULT_BACKEND: str = os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/1")
    
    # Rate Limiting
    RATE_LIMIT_ENABLED: bool = True
    RATE_LIMIT_PER_MINUTE: int = 60  # 60 requests per minute per IP
    RATE_LIMIT_UPLOAD_PER_HOUR: int = 100  # 100 uploads per hour per IP
    
    # API Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    WORKERS: int = 4  # For production with gunicorn
    WORKER_CLASS: str = "uvicorn.workers.UvicornWorker"
    
    # Celery Workers
    CELERY_WORKER_CONCURRENCY: int = 4
    CELERY_WORKER_PREFETCH_MULTIPLIER: int = 2
    
    # MLFlow
    MLFLOW_TRACKING_URI: str = os.getenv("MLFLOW_TRACKING_URI", "http://localhost:5000")
    
    # Monitoring
    ENABLE_METRICS: bool = True
    ENABLE_TRACING: bool = True
    
    # Environment
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")  # development, production
    
    model_config = {
        "case_sensitive": True
    }

settings = Settings()
