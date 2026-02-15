from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import signal
import sys
from loguru import logger

from app.core.config import settings
from app.core.logging import setup_logging
from app.core.metrics import MetricsMiddleware
from app.core.database import init_db, close_db
from app.core.rate_limit import limiter
from app.api.v1.api_async import api_router
from app.services.vision_rag import processor
from prometheus_client import make_asgi_app

from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

shutdown_event = False

def signal_handler(signum, frame):
    """Handle graceful shutdown on SIGTERM/SIGINT."""
    global shutdown_event
    logger.info(f"Received signal {signum}. Starting graceful shutdown...")
    shutdown_event = True

# Register signal handlers
signal.signal(signal.SIGTERM, signal_handler)
signal.signal(signal.SIGINT, signal_handler)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for startup and shutdown events.
    """
    # Startup
    logger.info("=" * 60)
    logger.info("🚀 Starting GrabThatFace Production Server")
    logger.info("=" * 60)
    
    # Initialize logging
    setup_logging()
    
    # Initialize database
    logger.info("Initializing database...")
    await init_db()
    
    # Check Qdrant connection
    logger.info("Checking Qdrant connection...")
    if processor.health_check():
        logger.info("✓ Qdrant connection healthy")
        collection_info = processor.get_collection_info()
        logger.info(f"  - Vectors indexed: {collection_info.get('vectors_count', 0)}")
    else:
        logger.warning("⚠ Qdrant connection failed. Service may be degraded.")
    
    # Create storage directories
    import os
    os.makedirs(settings.STORAGE_PATH, exist_ok=True)
    os.makedirs(settings.FACE_DIR, exist_ok=True)
    
    logger.info("✓ All systems initialized")
    logger.info(f"Environment: {settings.ENVIRONMENT}")
    logger.info(f"Workers: {settings.WORKERS}")
    logger.info(f"Rate limiting: {'Enabled' if settings.RATE_LIMIT_ENABLED else 'Disabled'}")
    
    yield
    
    # Shutdown
    logger.info("=" * 60)
    logger.info("🛑 Shutting down GrabThatFace Production Server")
    logger.info("=" * 60)
    
    # close db conns
    await close_db()
    
    logger.info("✓ Graceful shutdown complete")

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

app.state.limiter = limiter #rate limiter state
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler) #exception handler

# CORS 
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Metrics Middleware (Prometheus)
app.add_middleware(MetricsMiddleware)

# imp : Mount Prometheus metrics endpoint
metrics_app = make_asgi_app()
app.mount("/metrics", metrics_app)

# static files
app.mount("/static", StaticFiles(directory=settings.STORAGE_PATH), name="static")

# include router
app.include_router(api_router, prefix=settings.API_V1_STR)

# Health check endpoints
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "version": "2.0.0",
        "environment": settings.ENVIRONMENT
    }

@app.get("/health/detailed")
async def detailed_health_check():
    """
    Detailed health check including dependencies.
    """
    from app.core.database import engine
    
    health_status = {
        "status": "healthy",
        "version": "2.0.0",
        "environment": settings.ENVIRONMENT,
        "components": {}
    }
    
    # Check database
    try:
        async with engine.connect() as conn:
            await conn.execute("SELECT 1")
        health_status["components"]["database"] = "healthy"
    except Exception as e:
        health_status["components"]["database"] = f"unhealthy: {str(e)}"
        health_status["status"] = "degraded"
    
    # Check Qdrant
    try:
        if processor.health_check():
            health_status["components"]["qdrant"] = "healthy"
            collection_info = processor.get_collection_info()
            health_status["components"]["qdrant_vectors"] = collection_info.get("vectors_count", 0)
        else:
            health_status["components"]["qdrant"] = "unhealthy"
            health_status["status"] = "degraded"
    except Exception as e:
        health_status["components"]["qdrant"] = f"unhealthy: {str(e)}"
        health_status["status"] = "degraded"
    
    # Check ML model
    try:
        if processor.app:
            health_status["components"]["ml_model"] = "healthy"
        else:
            health_status["components"]["ml_model"] = "not loaded"
            health_status["status"] = "degraded"
    except:
        health_status["components"]["ml_model"] = "unhealthy"
        health_status["status"] = "degraded"
    
    status_code = status.HTTP_200_OK if health_status["status"] == "healthy" else status.HTTP_503_SERVICE_UNAVAILABLE
    
    return JSONResponse(content=health_status, status_code=status_code)

@app.get("/")
async def root():
    """
    Root endpoint with API information.
    """
    return {
        "name": settings.PROJECT_NAME,
        "version": "2.0.0",
        "description": "Production-ready face recognition API with InsightFace ArcFace and Qdrant",
        "features": [
            "State-of-the-art face recognition (ArcFace 512-d embeddings)",
            "Distributed vector search with Qdrant HNSW",
            "Async processing with Celery workers",
            "Rate limiting and security",
            "Prometheus metrics",
            "Auto-scaling ready"
        ],
        "endpoints": {
            "docs": "/docs",
            "health": "/health",
            "metrics": "/metrics",
            "api": settings.API_V1_STR
        }
    }

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """
    Global exception handler for unhandled errors.
    """
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "Internal server error",
            "error": str(exc) if settings.ENVIRONMENT == "development" else "An error occurred"
        }
    )

if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "app.main_production:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.ENVIRONMENT == "development",
        log_level="info"
    )
