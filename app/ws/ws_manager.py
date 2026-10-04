from fastapi import WebSocket, WebSocketDisconnect
from app.redis_client import client

rooms: dict[str, dict[str, WebSocket]] = {}


async def connect(game_id: str, character: str, ws: WebSocket):
    await ws.accept()
    rooms.setdefault(game_id, {})[character] = ws

def disconnect(game_id: str, character: str):
    if game_id in rooms:
        rooms[game_id].pop(character, None)

async def broadcast(game_id: str, message: str):
    await client.publish(f"game:{game_id}", message)

async def listen(game_id: str, ws: WebSocket):
    pubsub = client.pubsub()
    await pubsub.subscribe(f"game:{game_id}")

    try:
        async for message in pubsub.listen():
            if message["type"] == "subscribe":
                continue
            elif message["type"] == "message":
                await ws.send_text(message["data"])

    except  WebSocketDisconnect:
        print("disconnected")
        
    finally:
        await pubsub.unsubscribe(f"game:{game_id}")
