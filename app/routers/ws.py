import asyncio

from app.config import get_settings

from app.engine.game import (process_roll, process_pass, process_buy_company_shares, process_shareholder_roll, 
                process_buy_real_estate, process_trophy_buy, process_sell_company_shares, process_build_floors,
                process_choose_direction, process_vegas_house, process_trigger_vegas_duel, process_duel_refuse,
                process_duel_resolve, process_card_effect, get_current_player)

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query

from app.redis_client import client

from app.ws.ws_manager import connect, disconnect, broadcast, listen
from app.ws.ws_schemas import WSRequest, WSAction, WSResponse, WSResponseType

from app.engine.schemas import GameState


settings = get_settings()

router = APIRouter()

@router.websocket("/ws/{game_id}")
async def ws_endpoint(ws: WebSocket, game_id: str, character: str = Query(...)):
    await connect(game_id, character, ws)

    raw_state = await client.get(game_id)

    if raw_state is None:
        await ws.send_text(WSResponse(type=WSResponseType.ERROR, error="game not found").model_dump_json())
        await ws.close()
        disconnect(game_id, character)
        return

    state = GameState.model_validate_json(raw_state)

    if not any(p.name == character for p in state.players):
        await ws.send_text(WSResponse(type=WSResponseType.ERROR, error="player not in the lobby").model_dump_json())
        await ws.close()
        return

    response = WSResponse(type=WSResponseType.STATE_UPDATE, game_state=state)
    await ws.send_text(response.model_dump_json())

    async def handle_client():
        try:
            while True:
                raw = await ws.receive_json()
                req = WSRequest(**raw)
                raw_state = await client.get(game_id)

                if raw_state is None:
                    response = WSResponse(type=WSResponseType.ERROR, error="game not found")
                    await ws.send_text(response.model_dump_json())
                    await ws.close()
                    return

                state = GameState.model_validate_json(raw_state)

                # player validation
                if character != get_current_player(state).character:
                    continue

                match req.action:
                    case WSAction.ROLL:
                        new_state = process_roll(state)
                    case WSAction.PASS:
                        new_state = process_pass(state)
                    case WSAction.BUY_SHARES:
                        new_state = process_buy_company_shares(state, req.payload["amount"])
                    case WSAction.SELL_SHARES:
                        new_state = process_sell_company_shares(state, req.payload["company_id"], req.payload["amount"])            
                    case WSAction.SHAREHOLDER_ROLL:
                        new_state = process_shareholder_roll(state, req.payload["company_id"])
                    case WSAction.TROPHY_BUY:
                        new_state = process_trophy_buy(state)
                    case WSAction.BUY_REAL_ESTATE:
                        new_state = process_buy_real_estate(state)
                    case WSAction.BUILD_FLOORS:
                        new_state = process_build_floors(state, req.payload["tile_id"])
                    case WSAction.CARD_EFFECT:
                        new_state = process_card_effect(state, req.payload)
                    case WSAction.VEGAS_HOUSE:
                        new_state = process_vegas_house(state, req.payload)
                    case WSAction.TRIGGER_VEGAS_DUEL:
                        new_state = process_trigger_vegas_duel(state, req.payload)
                    case WSAction.VEGAS_DUEL_REFUSE:
                        new_state = process_duel_refuse(state)
                    case WSAction.VEGAS_DUEL_RESOLVE:
                        new_state = process_duel_resolve(state)
                    case WSAction.CHOOSE_DIRECTION:
                        new_state = process_choose_direction(state, req.payload["direction"])
                    case _:
                        continue
           
                await client.set(game_id, new_state.model_dump_json(), ex=settings.redis.game_ttl_seconds)
                response = WSResponse(type=WSResponseType.STATE_UPDATE, game_state=new_state)
                await broadcast(game_id, response.model_dump_json())
            
        except WebSocketDisconnect:
            pass

        finally:
            disconnect(game_id, character)

    listen_task = asyncio.create_task(listen(game_id, ws))
    client_task = asyncio.create_task(handle_client())


    _, pending = await asyncio.wait(
        [listen_task, client_task],
        return_when=asyncio.FIRST_COMPLETED
    )
 
    for task in pending:
        task.cancel()
        try:
            await task
        except asyncio.CancelledError:
            pass
 
    disconnect(game_id, character)

