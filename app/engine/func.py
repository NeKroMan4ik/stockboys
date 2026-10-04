from random import randint

from app.engine.board import BOARD, MARKET, START_LANDING_MAP
from app.engine.constants import BASE_TROPHY_COST, BASE_RENT_TIERS, REFERENCE_PRICE
from app.engine.schemas import Player, Penalty, PenaltyType, GameState, TurnPhase, BoardTile, PendingDuel


def market_pointer_change(state: GameState, impact: int) -> int: 
    new_market_pointer = state.market_pointer + impact

    if new_market_pointer < 0:
        return 0

    if new_market_pointer > len(MARKET[1]) - 1:
        return len(MARKET[1]) - 1

    return new_market_pointer

def roll() -> list[int]:
    """
    lst[0] - first dice throw;

    lst[1] - second dice throw;

    lst[2] - sum of the throws.
    """
    a = randint(1, 6)
    b = randint(1, 6)
    return [a, b, a + b]

def is_double(dice: list[int]) -> bool:
    return False if dice is None or dice[0] != dice[1] else True

def get_current_player(state: GameState) -> Player:
    return state.players[state.current_turn_index]

def get_target_player(state: GameState, player_index: int) -> Player:
    return state.players[player_index]

def get_current_tile(state: GameState) -> BoardTile:
    return BOARD[state.players[state.current_turn_index].current_tile_id]

def get_stock_price(company_id: int, market_pointer: int) -> int:
    return MARKET[company_id][market_pointer]

def get_mortgage_value(tile: BoardTile) -> int:
    return round(tile.purchase_price / 2)

def get_trophy_unit_price(state: GameState) -> int:
    '''
    Calculates based on the number of trophies currently owned by all players.
    '''
    trophies_owned = sum(player.trophies_owned for player in state.players)

    trophy_value = BASE_TROPHY_COST * (trophies_owned + 1)
    return trophy_value

def has_tallest_tower(state: GameState, player: Player) -> bool:
    def max_floors(p: Player) -> int:
        return max((prop.floors for prop in p.properties), default=0)

    player_max = max_floors(player)

    return all(player_max > max_floors(other) for other in state.players if other is not player)

def get_rent(tile: BoardTile, floors: int) -> int:
    '''
    Finds the rent price the player has to pay based on the ratio to the purchase price
    '''
    if floors == 0 or floors is None:
        return 0
    
    scale = tile.purchase_price / REFERENCE_PRICE
    return round(BASE_RENT_TIERS[floors - 1] * scale)

def get_tile_owner(state: GameState, tile_id: int) -> Player | None:
    for player in state.players:
        for prop in player.properties:
            if prop.tile_id == tile_id:
                return player

    return None

def get_floors_remaining(state: GameState) -> int:
    used = sum(prop.floors for p in state.players for prop in p.properties)
    return 16 - used

def get_floors(player: Player, tile_id: int) -> int:
    for prop in player.properties:

        if prop.tile_id == tile_id:
            return prop.floors

    return 0

def get_total_properties_cost(player: Player, mortgage: bool = False) -> int | float:
    '''
    If mortgage is True uses real estate's mortgage value for calculation.
    '''
    total = 0

    for prop in player.properties:
        tile = BOARD[prop.tile_id]
        total += get_mortgage_value(tile) if mortgage else tile.purchase_price

    return total

def get_total_shares_cost_for(state: GameState, player: Player) -> int:
    return sum(
        get_stock_price(company, state.market_pointer) * amount
        for company, amount in player.stocks.items()
    )

def get_total_networth_for(state: GameState, player: Player) -> int:
    return (
        get_total_properties_cost(player)
        + player.cash
        + player.trophies_owned * get_trophy_unit_price(state)
        + get_total_shares_cost_for(state, player)
    )

def get_penalty(player: Player, penalty_type: PenaltyType) -> Penalty | None:
    return next((p for p in player.penalties if p.type == penalty_type), None)

def bankrupt_player(state: GameState, amount: int, creditor_index: int | None) -> GameState:
    player = get_current_player(state)

    collected = player.cash
    player.cash = 0

    sorted_stocks = sorted(
        player.stocks.keys(),
        key=lambda c: get_stock_price(c, state.market_pointer) * player.stocks[c],
        reverse=True
    )

    for company in sorted_stocks:
        if collected >= amount:
            break
        collected += get_stock_price(company, state.market_pointer) * player.stocks[company]
        del player.stocks[company]

    payout = min(collected, amount)

    if creditor_index is not None:
        state.players[creditor_index].cash += payout
    else:
        state.free_lunch_pot += payout

    player.current_tile_id = START_LANDING_MAP[player.character]
    player.is_bankrupt = True
    
    if not get_penalty(player, PenaltyType.B):
        player.penalties.append(Penalty(type=PenaltyType.B))

    return state

def charge_player(state: GameState, amount: int, creditor_index: int | None = None, target_player_index: int | None = None) -> GameState:
    '''
    Charge current player, transfers cash to the player with creditor_index. If the creditor_index is None, transfers cash to the lunch pot;

    Charge another player from the payload if its value is not None;

    Starts player bankruptcy process if they don't have enough cash
    '''
    if isinstance(target_player_index, int):
        target = get_target_player(state, target_player_index)
    elif target_player_index is None:
        target = get_current_player(state)

    if target.cash >= amount:
        target.cash -= amount
        if creditor_index is not None:
            state.players[creditor_index].cash += amount
        else:
            state.free_lunch_pot += amount
    else:
        bankrupt_player(state, amount, creditor_index)

    return state

def validate_equity(player: Player, reference: dict) -> bool:
    '''
    True if the player has equal or more items than in the reference dict
    '''
    reference_cash = reference["cash"]
    reference_trophies = reference["trophies"]
    reference_stocks = reference["stocks"]

    if player.cash < reference_cash:
        return False

    if player.trophies_owned < reference_trophies:
        return False

    # checks stocks
    for entry in reference_stocks:
        if player.stocks.get(entry["company_id"], 0) < entry["amount"]:
            return False

    return True

def transfer_equity(from_player: Player, to_player: Player, payload: dict) -> tuple:
    p_cash = payload["cash"]
    p_trophies = payload["trophies"]
    p_stocks = payload["stocks"]

    # transfer cash
    from_player.cash -= p_cash
    to_player.cash += p_cash

    # transfer trophies
    from_player.trophies_owned -= p_trophies
    to_player.trophies_owned += p_trophies

    # transfer stocks
    for entry in p_stocks:
        from_player.stocks[entry["company_id"]] -= entry["amount"]
        to_player.stocks[entry["company_id"]] = to_player.stocks.get(entry["company_id"], 0) + entry["amount"]

    return (from_player, to_player)

def check_win_condition(state: GameState) -> GameState:
    """
    Win at $100,000 of total networth
    """
    if state.winner_index is None:
        for p in state.players:
            if get_total_networth_for(state, p) >= 100000:
                state.winner_index = state.players.index(p)

    return state

def pass_turn(state: GameState) -> GameState:
    '''
    Only use when TurnPhase needs to be reset, typically before giving the turn to the next player
    '''
    state.turn_phase = TurnPhase.WAITING_ROLL
    state.pending_duel = PendingDuel()

    state = check_win_condition(state)

    if not is_double(state.last_dice):          
        state.current_turn_index = (state.current_turn_index + 1) % len(state.players)

    return state


# decorators
def bankrupt_blocker(func):
    '''
    Blocks function from being executed if the player is bankrupt
    '''
    def wrapper(state: GameState, *args, **kwargs):
        if get_current_player(state).is_bankrupt:
            return state
        return func(state, *args, **kwargs)
    return wrapper

