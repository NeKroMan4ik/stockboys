from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.redis_client import client
from app.routers.ws import router as ws_router
from app.routers.games import router as games_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.redis = client
    yield
    await app.state.redis.aclose()


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ws_router)
app.include_router(games_router)