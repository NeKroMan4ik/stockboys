import redis.asyncio as redis
from app.config import get_settings

settings = get_settings()

if settings.redis.url:
    client = redis.from_url(settings.redis.url, decode_responses=True)
else:
    client = redis.Redis(
        host=settings.redis.host,
        port=settings.redis.port,
        db=settings.redis.db,
        decode_responses=True,
    )
