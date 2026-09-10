from app.engine.schemas import GameState, PendingDuel, Player, TurnPhase, WildCardType, Direction


def create_player(
    name: str,
    current_tile_id: int = 0,
    cash: int = 5000,
    stocks: dict = {},
    properties: list = None,
    trophies_owned: int = 0,
    penalties: list = None,
    is_bankrupt: bool = False,
) -> Player:
    
    return Player(
        name=name,
        current_tile_id=current_tile_id,
        cash=cash,
        stocks=stocks or {},
        properties=properties or [],
        trophies_owned=trophies_owned,
        penalties=penalties or [],
        is_bankrupt=is_bankrupt,
    )

def create_state(
    players: list[Player] | None = None,
    market_pointer: int = 19,
    turn_phase: TurnPhase = TurnPhase.WAITING_ROLL,
    current_turn_index: int = 0,
    free_lunch_pot: int = 0,
    last_dice: list[int] | None = None,
    pending_card: WildCardType | None = None,
    pending_duel: PendingDuel | None = None,
    chosen_direction: Direction | None = None,
    winner_index: int | None = None,
) -> GameState:
    return GameState(
        game_id="test-game-id",
        players=players or [create_player(name="Johnny Mustard", current_tile_id=10)],
        market_pointer=market_pointer,
        turn_phase=turn_phase,
        current_turn_index=current_turn_index,
        free_lunch_pot=free_lunch_pot,
        last_dice=last_dice,
        pending_card=pending_card,
        pending_duel=pending_duel or PendingDuel(),
        chosen_direction=chosen_direction,
        winner_index=winner_index,
    )

