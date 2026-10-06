from fastapi import APIRouter

from app.config import get_settings
from app.engine.schemas import CharacterName, PlayerSlot
from app.engine.game import create_initial_state
from app.redis_client import client


settings = get_settings()
router = APIRouter(prefix="/dev")


DEV_PLAYERS = [
    PlayerSlot(username=c.name.lower(), character=c) for c in CharacterName
]

@router.post("/games")
async def create_dev_game():
    state = create_initial_state(DEV_PLAYERS)
    await client.set(
        state.game_id,
        state.model_dump_json(),
        ex=settings.redis.game_ttl_seconds
    )

    return {
        "game_id": state.game_id,
        "characters": [p.character.value for p in state.players],
    }