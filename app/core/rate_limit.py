from slowapi import Limiter
from slowapi.util import get_remote_address
from app.core.config import settings

# Rate limiter using Redis backend
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=[f"{settings.RATE_LIMIT_PER_MINUTE}/minute"] if settings.RATE_LIMIT_ENABLED else [],
    storage_uri=settings.REDIS_URL,
    strategy="fixed-window"
)
