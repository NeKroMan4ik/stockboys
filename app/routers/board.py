from fastapi import APIRouter
from app.engine.board import BOARD, START_LANDING_MAP

router = APIRouter()

@router.get("/board")
async def get_board():
    return {
        "tiles": BOARD,
        "starts": {c.value: tile_id for c, tile_id in START_LANDING_MAP.items()},
    }