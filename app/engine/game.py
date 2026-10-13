from uuid import uuid4
from math import floor
from random import randint

from app.engine.constants import STARTING_CASH, BONUS_AMOUNT, TAX_PERCENT, FLOOR_PRICE, BROKER_BLACK_THURSDAY_TAX
from app.engine.board import BOARD, START_LANDING_MAP, MARKET
from app.engine.wild_cards import draw_wild_card

from app.engine.schemas import (
    Player, PenaltyType, GameState, TurnPhase, 
    Company, OwnedProperty, CellType, PendingDuel,
    Direction, PlayerSlot, PriceChange
)

from app.engine.func import (
    market_pointer_change, roll, is_double,
    get_current_player, get_current_tile, get_stock_price,
    get_trophy_unit_price, get_rent, get_tile_owner,
    get_floors_remaining, get_floors, get_total_properties_cost,
    has_tallest_tower, get_penalty, bankrupt_blocker, 
    charge_player, check_win_condition, pass_turn, 
    get_target_player, validate_equity, transfer_equity,
    set_market_pointer
)



# === IMPORTATNT ===
def create_player(slot: PlayerSlot) -> Player:
    return Player(
        username=slot.username,
        character=slot.character,
        cash=STARTING_CASH,
        current_tile_id=START_LANDING_MAP[slot.character],
    )

def create_initial_state(slots: list[PlayerSlot]) -> GameState:
    pointer = len(MARKET[1]) // 2

    return GameState(
        game_id=str(uuid4()),
        players=[create_player(slot) for slot in slots],
        market_pointer=pointer,
        pending_duel=PendingDuel(),
        price_change={c: PriceChange(
            old_price=MARKET[c][pointer],
            new_price=MARKET[c][pointer],
            diff_abs=0,
            diff_rel=0.0,
        ) for c in Company},
    )

def process_roll(state: GameState) -> GameState:
    # checks if the player can perform an action
    if not state.turn_phase == TurnPhase.WAITING_ROLL:
        return state

    player = get_current_player(state)
    state.last_dice = roll()

    # if double bankrupt players receive 1000 until they get 2000
    if is_double(state.last_dice):
        for p in state.players:
            if p.is_bankrupt:
                p.cash += 1000
                if p.cash >= 2000:
                    p.is_bankrupt = False

    board_size = len(BOARD)
    current_tile = get_current_tile(state)

    # choosing direction
    if player.chosen_direction is None:
        direction = current_tile.direction.value
    else:
        direction = player.chosen_direction.value
        player.chosen_direction = None

    # movement across the board
    moving_id = player.current_tile_id
    for _ in range(state.last_dice[2]):
        moving_id = (moving_id + direction) % board_size
        if BOARD[moving_id].is_bonus_tile:
            if get_penalty(player, PenaltyType.B):
                player.cash += round(BONUS_AMOUNT / 2)
            else:
                player.cash += BONUS_AMOUNT

        player.current_tile_id = moving_id

    landing_tile = BOARD[moving_id]

    # market change
    tile_market_impact = landing_tile.market_impact
    state = set_market_pointer(state, market_pointer_change(state, tile_market_impact))

    # tile events, always perform checks and set turn_phase at the end
    match landing_tile.type: 
        case CellType.TAX:
            stocks_amount = sum(player.stocks.values())

            if landing_tile.name == "TAX MAN COMETH":
                taxable = player.cash + player.trophies_owned * get_trophy_unit_price(state) + get_total_properties_cost(player)
                tax = floor(taxable * TAX_PERCENT)
            elif landing_tile.name == "BROKER FEE":
                tax = stocks_amount * BROKER_BLACK_THURSDAY_TAX
            elif landing_tile.name == "BLACK THURSDAY":
                tax = stocks_amount * BROKER_BLACK_THURSDAY_TAX
            
            charge_player(state=state, amount=tax, creditor_index=None)
            state = pass_turn(state)
                   
        case CellType.COMPANY: # shares
            # pay dividends to all shareholders
            company_id = landing_tile.company_id

            if company_id is not None:
                if landing_tile.dividends is not None:
                    div_per_share = landing_tile.dividends
                    for p in state.players:
                        shares = p.stocks.get(company_id, 0)
                        if shares:
                            p.cash += shares * div_per_share
                            state = check_win_condition(state)

            state.turn_phase = TurnPhase.WAITING_COMPANY_BUY

        case CellType.FREE_LUNCH:
            # gives the player all cash from free lunch pot and resets its value to 0 / half if has the "B"
            if get_penalty(player, PenaltyType.B):
                free_lunch_pot_cash = round(state.free_lunch_pot / 2)
            else:
                free_lunch_pot_cash = state.free_lunch_pot
            
            player.cash += free_lunch_pot_cash
            state.free_lunch_pot -= free_lunch_pot_cash
            state = pass_turn(state)

        case CellType.SHAREHOLDER:
            state.turn_phase = TurnPhase.WAITING_SHAREHOLDER_ROLL

        case CellType.REAL_ESTATE:
            tile_owner = get_tile_owner(state, moving_id)

            # can buy real estate or do nothing if no owner
            if tile_owner is None:            
                if player.cash >= landing_tile.purchase_price:
                    state.turn_phase = TurnPhase.WAITING_REAL_ESTATE_BUY
                else:
                    state = pass_turn(state)
            # nothing happens if the player owns the tile
            elif tile_owner == player:
                state = pass_turn(state)
            # pays rent if doesn't own that tile unless they have built the tallest tower
            elif tile_owner != player:
                if not has_tallest_tower(state, player):
                    rent = get_rent(landing_tile, get_floors(tile_owner, moving_id))
                    charge_player(state=state, amount=rent, creditor_index=state.players.index(tile_owner))
                
                state = pass_turn(state)
                
        case CellType.VEGAS:
            state.turn_phase = TurnPhase.WAITING_VEGAS

        case CellType.WILD_CARD:
            state = draw_wild_card(state)
            if state.pending_card is not None:
                state.turn_phase = TurnPhase.WAITING_CARD_EFFECT

        case CellType.TROPHY:
            if player.cash >= get_trophy_unit_price(state):
                state.turn_phase = TurnPhase.WAITING_TROPHY_BUY 
            else:
                state = pass_turn(state)

        case CellType.BONUS:
            state.turn_phase = TurnPhase.WAITING_DIRECTION_CHOICE

        case _:  # anything that's not covered by the code above
            state = pass_turn(state)

        
    return state



# === PROCESS FUNC ===
# player actions triggered by tile effects
def process_pass(state: GameState) -> GameState:
    return pass_turn(state)

@bankrupt_blocker
def process_buy_company_shares(state: GameState, amount: int) -> GameState:
    player = get_current_player(state)
    tile = get_current_tile(state)
    stock_price = get_stock_price(tile.company_id, state.market_pointer)

    if player.cash >= amount * stock_price:
        player.cash -= amount * stock_price

        if tile.company_id in player.stocks:
            player.stocks[tile.company_id] += amount
        else:
            player.stocks[tile.company_id] = amount

    return pass_turn(state)

@bankrupt_blocker
def process_buy_real_estate(state: GameState) -> GameState:
    player = get_current_player(state)
    tile = get_current_tile(state)

    player.cash -= BOARD[player.current_tile_id].purchase_price
    player.properties.append(OwnedProperty(tile_id=tile.tile_id, floors=0))
    
    return pass_turn(state)

@bankrupt_blocker
def process_trophy_buy(state: GameState) -> GameState:
    player = get_current_player(state)
    player.cash -= get_trophy_unit_price(state)
    player.trophies_owned += 1

    return pass_turn(state)

@bankrupt_blocker
def process_vegas_house(state: GameState, payload: dict) -> GameState:
    player = get_current_player(state)
    player_dice = roll()
    player_bet = payload["amount"]

    if not validate_equity(player, {"cash": player_bet, "trophies": 0, "stocks": []}):
        return state
    
    if player_dice[2] > 7:
        player.cash += floor(player_bet * 1.5)
    else:
        charge_player(state=state, amount=player_bet, creditor_index=None)

    return pass_turn(state)

@bankrupt_blocker
def process_trigger_vegas_duel(state: GameState, payload: dict) -> GameState:
    player = get_current_player(state)
    target = get_target_player(state, payload["target_index"])

    state.pending_duel.initiator_index = state.current_turn_index
    state.pending_duel.initiator_bet = payload["initiator_bet"]
    state.pending_duel.target_index = payload["target_index"]
    state.pending_duel.target_bet = payload["target_bet"]

    if not validate_equity(player, state.pending_duel.initiator_bet) or not validate_equity(target, state.pending_duel.target_bet):
        state.turn_phase = TurnPhase.WAITING_VEGAS
        return state

    state.turn_phase = TurnPhase.WAITING_DUEL_RESPONSE
    return state

def process_shareholder_roll(state: GameState, company_id: Company) -> GameState:
    player = get_current_player(state)
    stock_price = get_stock_price(company_id, state.market_pointer)

    if player.cash >= stock_price:
        player.cash -= stock_price
        player.stocks[company_id] = player.stocks.get(company_id, 0) + 1

        die = randint(1, 6)
        player.stocks[company_id] *= die

    return pass_turn(state)

def process_choose_direction(state: GameState, direction: Direction) -> GameState:
    player = get_current_player(state)
    player.chosen_direction = direction
    return pass_turn(state)

# player actions that can be performed any time during their turn
def process_build_floors(state: GameState, tile_id: int) -> GameState:
    player = get_current_player(state)

    if BOARD[tile_id].type == CellType.REAL_ESTATE and get_floors_remaining(state) > 0:
        if player.cash >= FLOOR_PRICE:
            if get_tile_owner(state, tile_id) == player:
                prop = next((p for p in player.properties if p.tile_id == tile_id), None)
                
                if prop and prop.floors < 5:
                    player.cash -= FLOOR_PRICE
                    prop.floors += 1
                    return state
                
    return check_win_condition(state)

def process_sell_company_shares(state: GameState, company_id: Company, amount: int) -> GameState:
    player = get_current_player(state)
    stock_price = get_stock_price(company_id, state.market_pointer)

    if amount <= player.stocks.get(company_id, 0):
        player.cash += amount * stock_price
        player.stocks[company_id] -= amount

    return check_win_condition(state)

def process_duel_resolve(state: GameState) -> GameState:
    player = get_current_player(state)
    target = get_target_player(state, state.pending_duel.target_index)

    player_roll = roll()[2]
    target_roll = roll()[2]

    while player_roll == target_roll:
        player_roll = roll()[2]
        target_roll = roll()[2]

    if player_roll > target_roll:
        player, target = transfer_equity(target, player, state.pending_duel.target_bet)
    else:
        player, target = transfer_equity(player, target, state.pending_duel.initiator_bet)

    return pass_turn(state)

def process_duel_refuse(state: GameState) -> GameState:
    charge_player(state=state, amount=500, target_player_index=state.pending_duel.target_index)
    return pass_turn(state)

