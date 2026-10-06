from fastapi import Request
try:
    from redis.asyncio import Redis
except (ImportError, ModuleNotFoundError):
    Redis = None

from app.core.config import settings

redis_client = None

class DummyRedis:
    async def ping(self):
        return True
    async def aclose(self):
        pass
    @classmethod
    def from_url(cls, *args, **kwargs):
        return cls()

def get_redis_client():
    global redis_client
    if redis_client is None:
        if Redis is not None:
            try:
                redis_client = Redis.from_url(
                    settings.REDIS_URL,
                    decode_responses=True,
                    socket_connect_timeout=0.2,
                    socket_timeout=0.2
                )
            except Exception:
                redis_client = DummyRedis()

        else:
            redis_client = DummyRedis()
    return redis_client



async def get_redis(request: Request) -> Redis:
    return request.app.state.redis


async def close_redis() -> None:
    global redis_client
    if redis_client is not None:
        await redis_client.aclose()
        redis_client = None