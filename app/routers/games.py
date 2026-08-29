from fastapi import APIRouter

from app.config import get_settings

from app.engine.schemas import GameRequest
from app.engine.game import create_initial_state

from app.redis_client import client

settings = get_settings()

router = APIRouter()

@router.post("/games")
async def create_game(req: GameRequest):
    state = create_initial_state(req.players)
    await client.set(state.game_id, 
                     state.model_dump_json(),
                     ex=settings.redis.game_ttl_seconds)
    
    return {"game_id": state.game_id}
