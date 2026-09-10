import pytest

from app.tests.engine.conftest import create_state, create_player

from app.engine.wild_cards import (
    handle_trophy_heist, handle_nationalization, handle_ponzi_scheme,
    handle_construction_grant, handle_insurance, process_card_effect,
)
from app.engine.schemas import GameState, Company, OwnedProperty, Penalty, PenaltyType
from app.engine.wild_cards import WildCardType



#-----------------------fixtures-----------------------
@pytest.fixture
def state_with_target() -> GameState:
    '''
    A state where player[0] is the attacker and player[1] is the target.
    '''
    attacker = create_player(
        name="Johnny Mustard", 
        cash=10000, 
        trophies_owned=1,
        )
    target = create_player(
        name="Joe Sixpack", 
        cash=3000, 
        trophies_owned=1,
        stocks={Company.ACME: 10}
        )
    return create_state(players=[attacker, target])


REAL_ESTATE_TILE_IDS = [7, 16, 29, 40]
@pytest.fixture
def state_with_property() -> GameState:
    '''
    A state where current player has properties.
    '''
    player = create_player(name="Johnny Mustard", cash=3000)
    player.properties.append(OwnedProperty(tile_id=29, floors=1))
    return create_state(players=[player])



#------------------------handlers---------------------
def test_handle_nationalization_liquidates_shares(state_with_target):
    payload = {"target_player_index": 1, "company_id": Company.ACME}
    result = handle_nationalization(state_with_target, payload)
    assert result.players[1].stocks.get(Company.ACME, 0) == 0
    assert result.players[1].cash > 3000 



def test_trophy_heist_transfers_trophy(state_with_target):
    payload = {"target_player_index": 1}
    result = handle_trophy_heist(state_with_target, payload)
    assert result.players[0].trophies_owned == 2
    assert result.players[1].trophies_owned == 0



def test_trophy_heist_no_transfer_when_target_has_no_trophies():
    state = create_state(players=[
        create_player(name="Johnny Mustard", trophies_owned=1),
        create_player(name="Joe Sixpack", trophies_owned=0),
    ])
    result = handle_trophy_heist(state, {"target_player_index": 1})
    assert result.players[0].trophies_owned == 1
    assert result.players[1].trophies_owned == 0



def test_handle_construction_grant_adds_floors(state_with_property):
    payload = {"tile_id": 29}
    result = handle_construction_grant(state_with_property, payload)
    assert result.players[0].properties[0].floors == 3 # 1 -> 3



def test_handle_construction_grant_4_floors_built():
    state = create_state(players=[create_player(name="Johnny Mustard", properties=[OwnedProperty(tile_id=29, floors=4)])])
    payload = {"tile_id": 29}
    result = handle_construction_grant(state, payload)
    assert result.players[0].properties[0].floors == 5



def test_handle_ponzi_scheme_not_enough_money():
    state = create_state(players=[
        create_player(name="Johnny Mustard"),
        create_player(name="Burl Cutterback", cash=0),
        create_player(name="Tripp Dunwhislte", cash=100),
        create_player(name="Joe Sixpack", cash=501),
    ])
    result = handle_ponzi_scheme(state, {})

    assert result.players[0].cash == 5600
    assert result.players[1].cash == 0
    assert result.players[2].cash == 0
    assert result.players[3].cash == 1



def test_handle_insurance_add_insurance(state_with_property):
    result = handle_insurance(state_with_property, {})
    assert Penalty(type=PenaltyType.INSURANCE) in result.players[0].penalties



#-----------------------process card effects-------------------------
def test_process_card_effect_no_pending_card():
    state = create_state(pending_card=None)
    result = process_card_effect(state, {})
    assert result is state



def test_process_card_effect_insurance_card_consumption():
    payload = {"target_player_index": 1}
    state = create_state(players=[
        create_player(name="Johnny Mustard", trophies_owned=1),
        create_player(name="Joe Sixpack", penalties=[Penalty(type=PenaltyType.INSURANCE)], trophies_owned=1)
    ], pending_card=WildCardType.TROPHY_HEIST)
    result = process_card_effect(state, payload)

    assert result.pending_card is None
    assert result.players[1].penalties == []
    assert result.players[0].trophies_owned == state.players[0].trophies_owned
    assert result.players[1].trophies_owned == state.players[1].trophies_owned



def test_process_card_effect_insurance_card_no_consumtion_on_a_no_target_wild_card():
    payload = {"target_player_index": 1}
    state = create_state(players=[
        create_player(name="Johnny Mustard", trophies_owned=1),
        create_player(name="Joe Sixpack", penalties=[Penalty(type=PenaltyType.INSURANCE)], trophies_owned=1)
    ], pending_card=WildCardType.HYPERINFLATION)
    result = process_card_effect(state, payload)

    assert result.pending_card is None
    assert result.players[1].penalties == [Penalty(type=PenaltyType.INSURANCE)]
    assert result.players[0].cash == 2500
    assert result.players[1].cash == 2500

