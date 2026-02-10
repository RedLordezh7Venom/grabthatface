from pydantic_settings import BaseSettings
from typing import List, Optional

class Settings(BaseSettings):
    # API Settings
    PROJECT_NAME: str = "GrabThatFace Production"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "PRODUCTION_STRENGTH_SECRET_KEY_REPLACE_IN_SECURE_ENV"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # DATABASE
    DATABASE_URL: str = "sqlite:///./production.db"  # Use postgresql+psycopg2:// for actual prod
    
    # AI/ML
    FACE_RECOGNITION_TOLERANCE: float = 0.55  # Stricter for production
    VECTOR_DIMENSION: int = 128
    
    # INFRA
    STORAGE_PATH: str = "data/uploads"
    FACE_DIR: str = "data/faces"
    
    class Config:
        case_sensitive = True

settings = Settings()
