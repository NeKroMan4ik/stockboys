import json
from pathlib import Path

from app.engine.schemas import BoardTile, CharacterName, Company

DATA_DIR = Path(__file__).parent / "data"

def _load(filename: str) -> dict:
    with open(DATA_DIR / filename, encoding="utf-8") as f:
        return json.load(f)

_board = _load("board.json")
_market = _load("market.json")

BOARD = [BoardTile.model_validate(t) for t in _board["tiles"]]

START_LANDING_MAP = {
    CharacterName(name): tile_id
    for name, tile_id in _board["start_positions"].items()
}

MARKET = {
    Company(c["company_id"]): c["prices"]
    for c in _market["companies"]
}

