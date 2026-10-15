from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings

from app.redis_client import client
from app.routers.ws import router as ws_router
from app.routers.games import router as games_router
from app.routers.lobbies import router as lobbies_router
from app.routers.board import router as board_router
from app.routers.dev import router as dev_router

print(">>> main.py loaded, debug =", get_settings().app.debug)

@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.redis = client
    yield
    await app.state.redis.aclose()


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_settings().app.cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

print("DEBUG =", get_settings().app.debug)
if get_settings().app.debug:
    app.include_router(dev_router)

app.include_router(ws_router)
app.include_router(games_router)
app.include_router(lobbies_router)
app.include_router(board_router)