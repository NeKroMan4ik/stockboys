from uuid import uuid4
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.redis_client import client
from app.ws.ws_schemas import LobbyStatus, Lobby
from app.config import get_settings

from app.engine.schemas import CharacterName, PlayerSlot
from app.engine.game import create_initial_state



settings = get_settings()
router = APIRouter(prefix='/lobbies')

LOBBIES_SET = 'all_lobbies'

class CreateLobbyRequest(BaseModel):
    slot: PlayerSlot

class JoinLobbyRequest(BaseModel):
    slot: PlayerSlot

class StartLobbyRequest(BaseModel):
    character: CharacterName


@router.post("")
async def create_lobby(req: CreateLobbyRequest):
    lobby = Lobby(lobby_id=str(uuid4()), host=req.host, players=[req.host])
    await client.set(f"lobby:{lobby.lobby_id}", lobby.model_dump_json(), ex=settings.game_ttl_seconds)
    await client.sadd(LOBBIES_SET, lobby.lobby_id)
    return {"lobby_id": lobby.lobby_id}

@router.get("")
async def get_list_lobbies():
    lobby_ids = await client.smembers(LOBBIES_SET)
    lobbies = []

    for id in lobby_ids:
        raw = await client.get(f"lobby:{id}")

        if raw:
            lobbies.append(Lobby.model_validate_json(raw))
        else:
            await client.srem(LOBBIES_SET, id)

    return lobbies

@router.post("/{lobby_id}/join")
async def join_lobby(lobby_id: str, req: JoinLobbyRequest):
    raw = await client.get(f"lobby:{lobby_id}")
    if not raw:
        raise HTTPException(404, "Lobby not found")

    lobby = Lobby.model_validate_json(raw)

    if lobby.status != LobbyStatus.WAITING:
        raise HTTPException(400, "Game already started")
    if len(lobby.players) >= 4:
        raise HTTPException(400, "Lobby is full")
    if req.player_name in lobby.players:
        raise HTTPException(400, "Name already taken")

    lobby.plyaers.append(req.player_name)
    await client.set(f"lobby:{lobby_id}", lobby.model_dump_json(), ex=settings.redis.game_ttl_seconds)
    return lobby

@router.post("/{lobby_id}/start")
async def start_game(lobby_id: str, req: StartLobbyRequest):
    raw = await client.get(f"lobby:{lobby_id}")
    if not raw:
        raise HTTPException(404, "Lobby not found")

    lobby = Lobby.model_validate_json(raw)

    if req.player_name != lobby.host:
        raise HTTPException(403, "Only host can start")
    if lobby.status != LobbyStatus.WAITING:
        raise HTTPException(400, "Already started")
    '''if len(lobby.players) < 4:
        raise HTTPException(400, "Need 4 players")'''

    state = create_initial_state(lobby.players)

    await client.set(state.game_id, state.model_dump_json(), ex=settings.redis.game_ttl_seconds)

    lobby.status = LobbyStatus.IN_PROGRESS
    lobby.game_id = state.game_id

    return {"game_id": state.game_id}

@router.get("/{lobby_id}")
async def get_lobby(lobby_id: str):
    raw = await client.get(f"lobby:{lobby_id}")
    if not raw:
        raise HTTPException(404, "Lobby not found")
    return Lobby.model_validate_json(raw)