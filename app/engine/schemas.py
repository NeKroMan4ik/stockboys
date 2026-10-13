from typing import List, Dict
from pydantic import BaseModel, Field, field_validator
from enum import Enum, IntEnum


# === PLAYERS ===
class PenaltyType(str, Enum):
    B = "b"

    SKIP = "skip"
    TAX = "tax"
    FREEZE = "freeze"
    SCANDAL = "scandal"

    INSURANCE = "insurance"

class Penalty(BaseModel):
    type: PenaltyType
    turns_remaining: int | None = None
    metadata: dict = {}

class OwnedProperty(BaseModel):
    tile_id: int
    floors: int = 0

class Company(IntEnum):
    JETCETERA_AIRLINES = 1
    ACME = 2
    AUH20 = 3
    CALDO_SUPPLY = 4
    DOUGH_RAY_AND_ME = 5
    FIASCO_FILMS = 6

class PriceChange(BaseModel):
    new_price: int
    old_price: int
    diff_abs: int
    diff_rel: float

class CharacterName(str, Enum):
    JOHNNY_MUSTARD = "Johnny Mustard"
    BURL_CUTTERBACK = "Burl Cutterback"
    TRIPP_DUNWHISTLE = "Tripp Dunwhistle"
    JOE_SIXPACK = "Joe Sixpack"

class PlayerSlot(BaseModel):
    username: str
    character: CharacterName

class Direction(Enum):
    LEFT = 1
    RIGHT = -1

class Player(BaseModel):
    username: str
    character: CharacterName
    current_tile_id: int

    cash: int = 0
    stocks: Dict[Company, int] = {}
    properties: List[OwnedProperty] = []
    trophies_owned: int = 0

    chosen_direction: Direction | None = None
    penalties: List[Penalty] = []
    is_bankrupt: bool = False


# === BOARD ===
class CellType(Enum):
    TAX = "tax"
    COMPANY = "company"
    FREE_LUNCH = "free_lunch"
    SHAREHOLDER = "shareholder"
    REAL_ESTATE = "real_estate"
    VEGAS = "vegas"
    WILD_CARD = "wild_card"
    TROPHY = "trophy"
    BONUS = "bonus"

class BoardTile(BaseModel):
    #general
    tile_id: int
    name: str
    type: CellType
    direction: Direction
    colour: str
    
    # stock market impact
    market_impact: int = 0

    # assets
    company_id: Company | None = None
    dividends: int | None = None
    purchase_price: int | None = None

    # misc
    player_can_choose_direction: bool = False
    is_bonus_tile: bool = False


# === WILD CARDS ===
class WildCardType(str, Enum):
    FLASH_CRASH = "flash_crash"
    BULL_RUN = "bull_run"
    DIVIDEND_BOMB = "dividend_bomb"
    TAX_FRAUD = "tax_fraud"
    NATIONALIZATION = "nationalization"
    TROPHY_HEIST = "trophy_heist"
    CONSTRUCTION_GRANT = "construction_grant"
    PONZI_SCHEME = "ponzi_scheme"
    HYPERINFLATION = "hyperinflation"
    QUANTITATIVE_EASING = "quantitative_easing"
    MARKET_MANIPULATION = "market_manipulation"
    STOCK_SPLIT = "stock_split"
    BAILOUT = "bailout"
    INSURANCE = "insurance"

class WildCard(BaseModel):
    type: WildCardType
    is_immediate: bool = True
    has_target: bool = False
    weight: float

    description: str = ''


# === VEGAS ===
class PendingDuel(BaseModel):
    initiator_index: int | None = None
    target_index: int | None = None
    initiator_bet: dict = {}
    target_bet: dict = {}


# === GAMESTATE ===
class TurnPhase(str, Enum):
    WAITING_ROLL = "waiting_roll"
    WAITING_COMPANY_BUY = "waiting_company_buy"
    WAITING_SHAREHOLDER_ROLL = "waiting_shareholder_roll"
    WAITING_REAL_ESTATE_BUY = "waiting_real_estate_buy"
    WAITING_TROPHY_BUY = "waiting_trophy_buy"
    WAITING_VEGAS = "waiting_vegas"
    WAITING_CARD_EFFECT = "waiting_card_effect"
    WAITING_DUEL_RESPONSE = "waiting_duel_response"
    WAITING_DIRECTION_CHOICE = "waiting_direction_choice"

class GameState(BaseModel):
    # general
    game_id: str
    players: list[Player]
    turn_phase: TurnPhase = TurnPhase.WAITING_ROLL

    # turns
    last_dice: list[int] | None = None
    current_turn_index: int = 0
    free_lunch_pot: int = 0

    # market
    market_pointer: int
    price_change: dict[Company, PriceChange] 

    # misc
    creditor_index: int | None = None
    pending_card: WildCardType | None = None
    winner_index: int | None = None
    pending_duel: PendingDuel | None = None

class GameRequest(BaseModel):
    players: list[PlayerSlot] = Field(min_length=1, max_length=4)

    @field_validator("players")
    @classmethod
    def characters_must_be_unique(cls, slots: list[PlayerSlot]) -> list[PlayerSlot]:
        characters = [s.character for s in slots]
        if len(characters) != len(set(characters)):
            raise ValueError("each character can only be picked once")
        return slots