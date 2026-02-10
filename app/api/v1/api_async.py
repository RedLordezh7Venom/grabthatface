from fastapi import APIRouter
from app.api.v1.endpoints import photos_async, search_async

api_router = APIRouter()

# Include photo upload endpoints
api_router.include_router(
    photos_async.router,
    prefix="/photos",
    tags=["photos"]
)

# Include search endpoints
api_router.include_router(
    search_async.router,
    prefix="/search",
    tags=["search"]
)
