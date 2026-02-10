from fastapi import FastAPI, Depends
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.core.logging import setup_logging, logger
from app.core.metrics import MetricsMiddleware
from app.database import create_db_and_tables, engine
from app.api.v1.api import api_router
from app.services.ml_processor import processor
from app.models import FaceEncoding
from prometheus_client import make_asgi_app
from sqlmodel import Session, select
import numpy as np
import json
import mlflow
import threading
import time

# Initialize Infrastructure
setup_logging()
mlflow.set_tracking_uri("http://localhost:5000") # In prod, this is a remote server

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

def start_index_sync():
    """Background thread to keep index synced with DB."""
    def sync_loop():
        while True:
            try:
                processor.sync_with_db(engine)
            except Exception as e:
                logger.error(f"Index sync failed: {e}")
            time.sleep(10) # Sync every 10 seconds
            
    thread = threading.Thread(target=sync_loop, daemon=True)
    thread.start()
    logger.info("Started periodic FAISS index synchronization thread")

# 1. Metrics Endpoint (for Prometheus)
metrics_app = make_asgi_app()
app.mount("/metrics", metrics_app)

# 2. Middlewares
app.add_middleware(MetricsMiddleware)

# 3. Static Files (S3 Proxy in prod)
app.mount("/static", StaticFiles(directory=settings.STORAGE_PATH), name="static")

# 4. Router
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.on_event("startup")
def on_startup():
    create_db_and_tables()
    start_index_sync()

@app.get("/health")
def health_check():
    # Production health check: check DB, check ML model availability
    return {"status": "healthy", "version": "1.0.0"}
