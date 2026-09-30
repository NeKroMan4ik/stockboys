from enum import Enum
from pydantic import BaseModel, Field
from app.engine.schemas import GameState, CharacterName, PlayerSlot


#-----------------game ws---------------------
class WSAction(str, Enum):
    ROLL = "roll"
    PASS = "pass"
    BUY_SHARES = "buy_shares"
    SELL_SHARES = "sell_shares"
    SHAREHOLDER_ROLL = "shareholder_roll"
    BUY_REAL_ESTATE = "buy_real_estate"
    TROPHY_BUY = "trophy_buy"
    BUILD_FLOORS = "build_floors"
    VEGAS_HOUSE = "vegas_house"
    TRIGGER_VEGAS_DUEL = "trigger_vegas_duel"
    VEGAS_DUEL_REFUSE = "vegas_duel_refuse"
    VEGAS_DUEL_RESOLVE = "vegas_duel_resolve"
    CHOOSE_DIRECTION = "choose_direction"
    CARD_EFFECT = "card_effect"

class WSRequest(BaseModel):
    action: WSAction
    payload: dict = {}

class WSResponseType(str, Enum):
    STATE_UPDATE = "state_update"
    ERROR = "error"

class WSResponse(BaseModel):
    type: WSResponseType
    game_state: GameState | None = None
    error: str | None = None


#----------------lobbies------------------
class LobbyStatus(str, Enum):
    WAITING = "waiting"
    IN_PROGRESS = "in_progress"

class Lobby(BaseModel):
    lobby_id: str
    host: CharacterName
    players: list[PlayerSlot] = Field(default_factory=list, max_length=4)

    status: LobbyStatus = LobbyStatus.WAITING
    game_id: str | None = None

