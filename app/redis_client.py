import redis.asyncio as redis
from app.config import get_settings

settings = get_settings()

client = redis.Redis(
    host=settings.redis.host,
    port=settings.redis.port,
    db=settings.redis.db,
    decode_responses=True,
)
