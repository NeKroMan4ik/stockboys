import pytest

from app.tests.engine.conftest import create_state, create_player

from app.engine.func import (
    market_pointer_change, bankrupt_player, get_trophy_unit_price, 
    charge_player, transfer_equity
)
from app.engine.schemas import Penalty, PenaltyType, Company
from app.engine.constants import BASE_TROPHY_COST



#-----------------------get_trophy_unit_price---------------------------
@pytest.mark.parametrize("state, expected", [
    (create_state(players=[
        create_player(name='Johnny Mustard', trophies_owned=0),
        create_player(name='Sam', trophies_owned=5),
        create_player(name='katze', trophies_owned=2),
        create_player(name='sdsjsjdj', trophies_owned=0),
    ]), BASE_TROPHY_COST * (7+1)),
    (create_state(players=[
        create_player(name='Johnny Mustard', trophies_owned=0),
        create_player(name='Sam', trophies_owned=0),
        create_player(name='katze', trophies_owned=0),
        create_player(name='sdsjsjdj', trophies_owned=0),
    ]), BASE_TROPHY_COST)
])
def test_get_trophy_unit_price(state, expected):
    result = get_trophy_unit_price(state)
    assert result == expected



#----------------------------market_pointer_change----------------------------------
@pytest.mark.parametrize("state, impact, expected", [
    (create_state(market_pointer=19), 5, 24),
    (create_state(market_pointer=2),  -5, 0), # lower bound
    (create_state(market_pointer=36), 5, 38), # upper bound
    (create_state(market_pointer=19), 0, 19), # no market impact
])
def test_market_pointer_change(state, impact, expected):
    result = market_pointer_change(state, impact)
    assert result == expected



#-------------------------------bankrupt_player-------------------------------------
@pytest.mark.parametrize("state, amount, creditor_index", [
    (create_state(players=[
        create_player(name='Johnny Mustard', cash=1000),
        create_player(name='Sam'),
    ]), 14000, 1),
    (create_state(players=[
        create_player(name='Johnny Mustard', cash=1000, trophies_owned=1),
        create_player(name='Sam'),
    ]), 14000, 1),
])
def test_bankrupt_player(state, amount, creditor_index):
    result = bankrupt_player(state, amount, creditor_index)
    assert result.players[0].is_bankrupt
    assert Penalty(type=PenaltyType.B) in result.players[0].penalties


@pytest.mark.parametrize("state, amount, creditor_index, expected_creditor_cash", [
    (create_state(players=[
        create_player(name='Johnny Mustard', cash=1000),
        create_player(name='Sam', cash=5000),
    ]), 14000, 1, 6000),  # creditor receives all bankrupt's cash
])
def test_bankrupt_player_pays_creditor(state, amount, creditor_index, expected_creditor_cash):
    result = bankrupt_player(state, amount, creditor_index)
    assert result.players[creditor_index].cash == expected_creditor_cash


@pytest.mark.parametrize("state, amount, expected_pot", [
    (create_state(players=[
        create_player(name='Johnny Mustard', cash=1000),
        create_player(name='Sam', cash=5000),
    ]), 14000, 1000),  # all cash goes to the lunch pot
])
def test_bankrupt_player_pays_into_pot(state, amount, expected_pot):
    result = bankrupt_player(state, amount, creditor_index=None)
    assert result.free_lunch_pot == expected_pot



#--------------------------charge_player--------------------------------
@pytest.mark.parametrize("state, amount, expected", [
    (create_state(players=[
        create_player(name='Johnny Mustard'),
    ]), 5, 4995),
    (create_state(players=[
        create_player(name='Johnny Mustard'),
    ]), 5000, 0),
])
def test_charge_player_pays_into_pot(state, amount, expected):
    result = charge_player(state, amount)
    assert result.players[0].cash == expected


@pytest.mark.parametrize("state, amount, creditor_index, expected_p_final_cash, expected_t_final_cash", [
    (create_state(players=[
        create_player(name='Johnny Mustard', cash=3487),
        create_player(name='Sam', cash=10000),
        create_player(name='katze', cash=82671),
    ]), 1000, 1, 2487, 11000),
])
def test_charge_player_pays_creditor(state, amount, creditor_index, expected_p_final_cash, expected_t_final_cash):
    result = charge_player(state, amount, creditor_index)
    assert result.players[0].cash == expected_p_final_cash
    assert result.players[creditor_index].cash == expected_t_final_cash


@pytest.mark.parametrize("state, amount, expected", [
    (create_state(players=[
        create_player(name='Johnny Mustard'),
    ]), 5, 5),
    (create_state(players=[
        create_player(name='Johnny Mustard'),
    ]), 0, 0),
    (create_state(free_lunch_pot=5000, players=[
        create_player(name='Johnny Mustard'),
    ]), 0, 5000),
])
def test_charge_player_pot_cash(state, amount, expected):
    result = charge_player(state, amount)
    assert result.free_lunch_pot == expected


@pytest.mark.parametrize("state, amount, creditor_index, is_bankrupt", [
    (create_state(players=[
        create_player(name='Johnny Mustard', cash=3487),
        create_player(name='Sam', cash=10000),
    ]), 5000, 1, True),
])
def test_charge_player_triggers_bankruptcy(state, amount, creditor_index, is_bankrupt):
    result = charge_player(state, amount, creditor_index)
    assert result.players[0].is_bankrupt == is_bankrupt


@pytest.mark.parametrize("state, amount, creditor_index, is_bankrupt", [
    (create_state(players=[
        create_player(name='Johnny Mustard', cash=3487),
        create_player(name='Sam', cash=10000),
    ]), 3487, 1, True),
])
def test_charge_player_exact_amount_is_not_bankruptcy(state, amount, creditor_index, is_bankrupt):
    result = charge_player(state, amount, creditor_index)
    assert result.players[0].is_bankrupt != is_bankrupt


@pytest.mark.parametrize("state, amount, target_player_index, expected_cash", [
    (create_state(players=[
        create_player(name='Johnny Mustard', cash=5000),
        create_player(name='Sam', cash=3000),
    ]), 1000, 1, 2000),  # target player is Sam
])
def test_charge_player_charges_target(state, amount, target_player_index, expected_cash):
    result = charge_player(state, amount, target_player_index=target_player_index)
    assert result.players[target_player_index].cash == expected_cash
    assert result.players[0].cash == 5000  # not current player


@pytest.mark.parametrize("state, amount, creditor_index, target_player_index, expected_target_cash, expected_creditor_cash", [
    (create_state(players=[
        create_player(name='Johnny Mustard', cash=5000),
        create_player(name='Sam', cash=3000),
        create_player(name='katze', cash=8000),
    ]), 1000, 2, 1, 2000, 9000),  # Sam pays to katze
])
def test_charge_player_target_pays_creditor(state, amount, creditor_index, target_player_index, expected_target_cash, expected_creditor_cash):
    result = charge_player(state, amount, creditor_index, target_player_index)
    assert result.players[target_player_index].cash == expected_target_cash
    assert result.players[creditor_index].cash == expected_creditor_cash



#-----------------------------transfer_equity-------------------------------------
# cash
@pytest.mark.parametrize("from_cash, to_cash, amount, expected_from, expected_to", [
    (5000, 3000, 1000, 4000, 4000),
    (5000, 3000, 0, 5000, 3000),  # equivalent transfer
    (5000, 3000, 5000, 0, 8000),  # only cash
])
def test_transfer_equity_cash(from_cash, to_cash, amount, expected_from, expected_to):
    from_player = create_player(name='Johnny Mustard', cash=from_cash)
    to_player = create_player(name='Sam', cash=to_cash)
    payload = {"cash": amount, "trophies": 0, "stocks": []}

    result_from, result_to = transfer_equity(from_player, to_player, payload)

    assert result_from.cash == expected_from
    assert result_to.cash == expected_to


# trophies
@pytest.mark.parametrize("from_trophies, to_trophies, amount, expected_from, expected_to", [
    (3, 1, 2, 1, 3),
    (3, 1, 0, 3, 1),  # equivalent transfer
    (3, 1, 3, 0, 4),  # only trophies
])
def test_transfer_equity_trophies(from_trophies, to_trophies, amount, expected_from, expected_to):
    from_player = create_player(name='Johnny Mustard', trophies_owned=from_trophies)
    to_player = create_player(name='Sam', trophies_owned=to_trophies)
    payload = {"cash": 0, "trophies": amount, "stocks": []}

    result_from, result_to = transfer_equity(from_player, to_player, payload)

    assert result_from.trophies_owned == expected_from
    assert result_to.trophies_owned == expected_to


# stocks
def test_transfer_equity_stocks_basic():
    from_player = create_player(name='Johnny Mustard', stocks={Company.ACME: 10})
    to_player = create_player(name='Sam', stocks={})
    payload = {"cash": 0, "trophies": 0, "stocks": [{"company_id": Company.ACME, "amount": 5}]}

    result_from, result_to = transfer_equity(from_player, to_player, payload)

    assert result_from.stocks[Company.ACME] == 5
    assert result_to.stocks[Company.ACME] == 5


def test_transfer_equity_stocks_receiver_already_has_shares():
    from_player = create_player(name='Johnny Mustard', stocks={Company.ACME: 10})
    to_player = create_player(name='Sam', stocks={Company.ACME: 3})
    payload = {"cash": 0, "trophies": 0, "stocks": [{"company_id": Company.ACME, "amount": 5}]}

    result_from, result_to = transfer_equity(from_player, to_player, payload)

    assert result_from.stocks[Company.ACME] == 5
    assert result_to.stocks[Company.ACME] == 8  # 3 + 5


# all fields
def test_transfer_equity_all_fields():
    from_player = create_player(name='Johnny Mustard', cash=5000, trophies_owned=3, stocks={Company.ACME: 10})
    to_player = create_player(name='Sam', cash=2000, trophies_owned=1, stocks={Company.ACME: 2})
    payload = {"cash": 1000, "trophies": 2, "stocks": [{"company_id": Company.ACME, "amount": 4}]}

    result_from, result_to = transfer_equity(from_player, to_player, payload)

    assert result_from.cash == 4000
    assert result_to.cash == 3000
    assert result_from.trophies_owned == 1
    assert result_to.trophies_owned == 3
    assert result_from.stocks[Company.ACME] == 6
    assert result_to.stocks[Company.ACME] == 6
