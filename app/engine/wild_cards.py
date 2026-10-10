from typing import Callable
from math import floor
from random import choices

from app.engine.board import BOARD, MARKET
from app.engine.schemas import WildCard, WildCardType, GameState, Company, Penalty, PenaltyType
from app.engine.func import (
    get_current_player, get_stock_price, get_target_player, get_tile_owner,
    get_floors_remaining, market_pointer_change, pass_turn, get_penalty,
    set_market_pointer
)

# handlers
def handle_flash_crash(state: GameState, payload: dict) -> GameState:
    return set_market_pointer(state, 0)

def handle_bull_run(state: GameState, payload: dict) -> GameState:
    return set_market_pointer(state, len(MARKET[Company.JETCETERA_AIRLINES]) - 1)

def handle_dividend_bomb(state: GameState, payload: dict) -> GameState:
    player = get_current_player(state)
    company_min_div: dict[Company, int] = {}

    for tile in BOARD:
        if tile.company_id is not None and tile.dividends is not None:
            company_min_div[tile.company_id] = min(
                company_min_div.get(tile.company_id, tile.dividends), tile.dividends
            )

    for div in company_min_div.values():
        player.cash += div

    return state

def handle_tax_fraud(state: GameState, payload: dict) -> GameState:
    player = get_current_player(state)
    player.cash += state.free_lunch_pot
    state.free_lunch_pot = 0
    return state

def handle_nationalization(state: GameState, payload: dict) -> GameState:
    target = get_target_player(state, payload["target_player_index"])
    company_id = Company(payload["company_id"])
    shares = target.stocks.pop(company_id, 0)
    target.cash += shares * get_stock_price(company_id, state.market_pointer)
    return state

def handle_trophy_heist(state: GameState, payload: dict) -> GameState:
    player = get_current_player(state)
    target = get_target_player(state, payload["target_player_index"])

    if target.trophies_owned > 0:
        target.trophies_owned -= 1
        player.trophies_owned += 1

    return state

def handle_construction_grant(state: GameState, payload: dict) -> GameState:
    player = get_current_player(state)
    tile_id = payload["tile_id"]

    if get_tile_owner(state, tile_id) != player:
        return state

    prop = next((p for p in player.properties if p.tile_id == tile_id), None)

    if prop is None:
        return state

    for _ in range(2):
        if prop.floors < 5 and get_floors_remaining(state) > 0:
            prop.floors += 1

    return state

def handle_ponzi_scheme(state: GameState, payload: dict) -> GameState:
    current_player = get_current_player(state)

    for p in state.players:
        if p != current_player:
            collected = min(p.cash, 500)
            p.cash -= collected
            current_player.cash += collected

    return state

def handle_hyperinflation(state: GameState, payload: dict) -> GameState:
    for p in state.players:
        p.cash = floor(p.cash / 2)

    return state

def handle_quantitative_easing(state: GameState, payload: dict) -> GameState:
    state.free_lunch_pot *= 2
    return state

def handle_market_manipulation(state: GameState, payload: dict) -> GameState:
    # +5 or -5
    state.market_pointer = set_market_pointer(state, market_pointer_change(state, payload["market_impact"])) 
    return state

def handle_stock_split(state: GameState, payload: dict) -> GameState:
    player = get_current_player(state)
    player.stocks[Company(payload["company_id"])] *= 2
    return state

def handle_bailout(state: GameState, payload: dict) -> GameState:
    player = get_current_player(state)
    player.cash += 5000
    return state

def handle_insurance(state: GameState, payload: dict) -> GameState:
    player = get_current_player(state)
    player.penalties.append(Penalty(type=PenaltyType.INSURANCE))
    return state



# cards
WILD_CARDS: list[WildCard] = [
    WildCard(
        type=WildCardType.FLASH_CRASH,
        is_immediate=True,
        has_target=False,
        weight=0.3,
        description="Panic sweeps the market — the pointer crashes to its lowest point. Every shareholder feels the burn."
    ),
    WildCard(
        type=WildCardType.BULL_RUN,
        is_immediate=True,
        has_target=False,
        weight=0.3,
        description="Investor confidence is through the roof — the market pointer jumps to its peak. Buy low, sell never."
    ),
    WildCard(
        type=WildCardType.DIVIDEND_BOMB,
        is_immediate=True,
        has_target=False,
        weight=0.8,
        description="Every company pays out dividends as if you owned one share in each. Not much, but it's honest work."
    ),
    WildCard(
        type=WildCardType.TAX_FRAUD,
        is_immediate=True,
        has_target=False,
        weight=0.7,
        description="Your accountant has found some creative solutions. Collect everything in the Free Lunch Pot immediately."
    ),
    WildCard(
        type=WildCardType.NATIONALIZATION,
        is_immediate=False,
        has_target=True,
        weight=0.5,
        description="The government steps in. Choose a player and a company — they must sell all their shares at market price."
    ),
    WildCard(
        type=WildCardType.TROPHY_HEIST,
        is_immediate=False,
        has_target=True,
        weight=0.4,
        description="A daring midnight operation. Steal one trophy from a player of your choice."
    ),
    WildCard(
        type=WildCardType.CONSTRUCTION_GRANT,
        is_immediate=False,
        has_target=False,
        weight=0.7,
        description="City hall approves a development grant. Build 2 floors on one of your properties at no cost."
    ),
    WildCard(
        type=WildCardType.PONZI_SCHEME,
        is_immediate=True,
        has_target=False,
        weight=0.4,
        description="Everyone buys into your brilliant investment opportunity. Collect $500 from each player immediately."
    ),
    WildCard(
        type=WildCardType.HYPERINFLATION,
        is_immediate=True,
        has_target=False,
        weight=0.2,
        description="The economy has completely lost the plot. Every player, including you, loses half their cash on hand."
    ),
    WildCard(
        type=WildCardType.QUANTITATIVE_EASING,
        is_immediate=True,
        has_target=False,
        weight=0.5,
        description="The central bank fires up the printer. The bank matches whatever's in the Free Lunch Pot, doubling it."
    ),
    WildCard(
        type=WildCardType.MARKET_MANIPULATION,
        is_immediate=False,
        has_target=False,
        weight=0.6,
        description="You've got friends on the inside. Move the market pointer 5 steps in the direction of your choice."
    ),
    WildCard(
        type=WildCardType.STOCK_SPLIT,
        is_immediate=False,
        has_target=False,
        weight=0.4,
        description="Choose a company and double your share count overnight. The market doesn't even notice — yet."
    ),
    WildCard(
        type=WildCardType.BAILOUT,
        is_immediate=True,
        has_target=False,
        weight=0.3,
        description="Too big to fail. The government hands you $5,000 in cash, no questions asked."
    ),
    WildCard(
        type=WildCardType.INSURANCE,
        is_immediate=True,
        has_target=False,
        weight=0.6,
        description="You've taken out a policy against the unexpected. The next Wild Card aimed at you by another player is completely nullified."
    ),
]


CARD_REGISTRY = {card.type: card for card in WILD_CARDS}

CARD_HANDLERS: dict[WildCardType, Callable[[GameState, dict], GameState]] = {
    WildCardType.FLASH_CRASH: handle_flash_crash,
    WildCardType.BULL_RUN: handle_bull_run,
    WildCardType.DIVIDEND_BOMB: handle_dividend_bomb,
    WildCardType.TAX_FRAUD: handle_tax_fraud,
    WildCardType.NATIONALIZATION: handle_nationalization,
    WildCardType.TROPHY_HEIST: handle_trophy_heist,
    WildCardType.CONSTRUCTION_GRANT: handle_construction_grant,
    WildCardType.PONZI_SCHEME: handle_ponzi_scheme,
    WildCardType.HYPERINFLATION: handle_hyperinflation,
    WildCardType.QUANTITATIVE_EASING: handle_quantitative_easing,
    WildCardType.MARKET_MANIPULATION: handle_market_manipulation,
    WildCardType.STOCK_SPLIT: handle_stock_split,
    WildCardType.BAILOUT: handle_bailout,
    WildCardType.INSURANCE: handle_insurance,
}

def process_card_effect(state: GameState, payload: dict) -> GameState:
    if state.pending_card is None:
        return state

    card = CARD_REGISTRY[state.pending_card]

    if card.has_target:
        target = get_target_player(state, payload["target_player_index"])
        insurance = get_penalty(target, PenaltyType.INSURANCE)

        if insurance:
            target.penalties.remove(insurance)
            state.pending_card = None
            return pass_turn(state)

    state = CARD_HANDLERS[state.pending_card](state, payload)
    state.pending_card = None
    
    return pass_turn(state)

def draw_wild_card(state: GameState) -> GameState:
    card = choices(population=WILD_CARDS, weights=[c.weight for c in WILD_CARDS], k=1)[0]
    state.pending_card = card.type

    if card.is_immediate:
        state = process_card_effect(state, {})

    return state

