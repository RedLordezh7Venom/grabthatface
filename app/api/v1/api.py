from fastapi import APIRouter
from app.api.v1.endpoints import photos, search

api_router = APIRouter()
api_router.include_router(photos.router, prefix="/photos", tags=["photos"])
api_router.include_router(search.router, prefix="/search", tags=["search"])
