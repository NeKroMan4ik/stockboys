import pytest

from app.tests.engine.conftest import create_state, create_player

from app.engine.game import (
    process_roll, process_build_floors, process_sell_company_shares, 
    process_shareholder_roll, process_trophy_buy
)
from app.engine.func import get_current_player, get_stock_price
from app.engine.schemas import TurnPhase, CellType, OwnedProperty, Company
from app.engine.board import BOARD
from app.engine.constants import FLOOR_PRICE


# fixtures
@pytest.fixture
def roll(monkeypatch):
    monkeypatch.setattr("app.engine.game.roll", lambda: [3, 4, 7])


@pytest.fixture
def roll_double(monkeypatch):
    monkeypatch.setattr("app.engine.game.roll", lambda: [4, 4, 8])


@pytest.fixture
def randint4(monkeypatch):
    monkeypatch.setattr("app.engine.game.randint", lambda a, b: 4)


#------------------------process_roll---------------------------
def test_process_roll_proceeds_on_correct_turn_phase():
    state = create_state(turn_phase=TurnPhase.WAITING_ROLL)
    result = process_roll(state)
    assert result.last_dice is not None


def test_process_roll_wrong_turn_phase():
    state = create_state(turn_phase=TurnPhase.WAITING_TROPHY_BUY)
    result = process_roll(state)
    assert result is state


def test_process_roll_bankrupt_cash_on_double(roll_double):
    state = create_state(players=[
        create_player(name="Burl Cutterback", cash=0, is_bankrupt=True, current_tile_id=33)])
    result = process_roll(state)

    assert result.players[0].cash == 1000
    assert result.players[0].is_bankrupt == True


def test_process_roll_double_unbankrupts_player(roll_double):
    state = create_state(players=[
        create_player(name="Burl Cutterback", cash=1500, is_bankrupt=True, current_tile_id=33)])
    result = process_roll(state)

    assert result.players[0].cash == 2500
    assert result.players[0].is_bankrupt == False


# match case
REAL_ESTATE_TILE_IDS = [7, 16, 29, 40]
def test_process_roll_no_rent_with_tallest_tower(roll):
    state = create_state(players=[
        create_player(name="Johnny Mustard", properties=[OwnedProperty(tile_id=7, floors=5)], current_tile_id=9),
        create_player(name="Joe Sixpack", properties=[OwnedProperty(tile_id=16, floors=4)])
    ])
    initial_cash = state.players[0].cash
    result = process_roll(state)
    assert result.players[0].cash == initial_cash



#------------------------process_build_floors----------------------------
def test_process_build_floors_on_real_estate():
    state = create_state(players=[
        create_player(name="Johnny Mustard", cash=10000, current_tile_id=7,
                      properties=[OwnedProperty(tile_id=7, floors=0)])
    ])
    result = process_build_floors(state, tile_id=7)
    player = get_current_player(result)
    prop = next(p for p in player.properties if p.tile_id == 7)

    assert BOARD[7].type == CellType.REAL_ESTATE
    assert prop.floors == 1
    assert player.cash == 10000 - FLOOR_PRICE


def test_process_build_floors_on_non_real_estate():
    state = create_state(players=[
        create_player(name="Johnny Mustard", cash=10000, current_tile_id=0)
    ])
    player = get_current_player(state)
    result = process_build_floors(state, tile_id=0)

    assert BOARD[0].type != CellType.REAL_ESTATE
    assert result.players[0].cash == player.cash


def test_process_build_floors_succeeds_within_limit():
    state = create_state(players=[
        create_player(name='Johnny Mustard', cash=10000, properties=[OwnedProperty(tile_id=7, floors=0)], current_tile_id=7),
        create_player(name='Sam', cash=10000, properties=[OwnedProperty(tile_id=16, floors=0)]),
        create_player(name='katze', cash=10000, properties=[OwnedProperty(tile_id=29, floors=0)]),
        create_player(name='sdsjsjdj', cash=10000, properties=[OwnedProperty(tile_id=40, floors=5)]),
    ])
    result = process_build_floors(state, tile_id=7)
    assert result.players[0].properties[0].floors == 1 # 1st floor has been built


def test_process_build_floors_blocked_at_global_limit():
    state = create_state(players=[
        create_player(name='Johnny Mustard', cash=10000, properties=[OwnedProperty(tile_id=7, floors=2)], current_tile_id=7),
        create_player(name='Sam', cash=10000, properties=[OwnedProperty(tile_id=16, floors=5)]),
        create_player(name='katze', cash=10000, properties=[OwnedProperty(tile_id=29, floors=5)]),
        create_player(name='sdsjsjdj', cash=10000, properties=[OwnedProperty(tile_id=40, floors=4)]),
    ])
    result = process_build_floors(state, tile_id=7)
    assert result.players[0].properties[0].floors == 2 # floors number hasn't changed because of the global floor limit



#------------------------process_sell_company_shares--------------------------
@pytest.mark.parametrize("state, company_id, amount", [
    (create_state(players=[
        create_player(name='Johnny Mustard', cash=0, stocks={Company.ACME: 10}),
    ]), Company.ACME, 10),
    (create_state(players=[
        create_player(name='Johnny Mustard', cash=0, stocks={Company.ACME: 15}),
    ]), Company.ACME, 15),
])
def test_process_sell_company_shares(state, company_id, amount):
    player = get_current_player(state)
    initial_cash = player.cash
    stock_price = get_stock_price(company_id, state.market_pointer)

    result = process_sell_company_shares(state, company_id, amount)
    result_player = get_current_player(result)

    assert result_player.stocks.get(Company.ACME, 0) == 0
    assert result_player.cash == initial_cash + amount * stock_price



def test_process_sell_too_many_company_shares():
    state = create_state(players=[
        create_player(name='Johnny Mustard', stocks={Company.FIASCO_FILMS: 240}),
    ])
    result = process_sell_company_shares(state, Company.FIASCO_FILMS, 241)

    assert result.players[0].stocks[Company.FIASCO_FILMS] == 240 # state isn't changed
    assert result.players[0].cash == 5000  # didn't get anything



#-----------------------------process_shareholder_roll---------------------------------
def test_process_shareholder_roll(randint4):
    state = create_state(players=[
        create_player(name='Johnny Mustard', cash=10000, stocks={Company.FIASCO_FILMS: 100}),
    ], market_pointer=1)
    result = process_shareholder_roll(state, Company.FIASCO_FILMS)
    result_player = result.players[0]
    stock_price = get_stock_price(Company.FIASCO_FILMS, state.market_pointer)

    assert result_player.stocks[Company.FIASCO_FILMS] == (100 + 1) * 4
    assert result_player.cash == 10000 - stock_price


def test_process_shareholder_roll_not_enough_cash(randint4):
    state = create_state(players=[
        create_player(name='Johnny Mustard', cash=1, stocks={Company.FIASCO_FILMS: 100}),
    ], market_pointer=1)
    result = process_shareholder_roll(state, Company.FIASCO_FILMS)
    assert result is state



#--------------------------process_trophy_buy-----------------------------------------
# Here I'm testing @bankrupt_blocker
def test_bankrupt_blocker():
    state = create_state(players=[create_player(name='Johnny Mustard', is_bankrupt=True)])
    result = process_trophy_buy(state)
    assert state is result

