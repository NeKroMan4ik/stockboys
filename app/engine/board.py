from app.engine.schemas import BoardTile, CellType, Direction, Company


START_LANDING_MAP = { # starting position for each character
    "Johnny Mustard": 10,
    "Burl Cutterback": 5,
    "Tripp Dunwhistle": 29,
    "Joe Sixpack": 38,
}

BOARD = [
    # === UPPER ROW ===
    BoardTile(tile_id=0, name="BROKER FEE", type=CellType.TAX, direction=Direction.RIGHT, colour="#FFFDF7"),
    BoardTile(tile_id=1, name="JETCETERA AIRLINES", type=CellType.COMPANY, direction=Direction.LEFT, colour="#E67E22", market_impact=3, company_id=Company.JETCETERA_AIRLINES, dividends=3),
    BoardTile(tile_id=2, name="ACME", type=CellType.COMPANY, direction=Direction.LEFT, colour="#9B59B6", market_impact=1, company_id=Company.ACME, dividends=1),
    BoardTile(tile_id=3, name="AUH20", type=CellType.COMPANY, direction=Direction.RIGHT, colour="#F1C40F", market_impact=2, company_id=Company.AUH20, dividends=2),
    BoardTile(tile_id=4, name="FREE LUNCH!", type=CellType.FREE_LUNCH, direction=Direction.LEFT, colour="#D35400", market_impact=1),
    BoardTile(tile_id=5, name="CALDO SUPPLY", type=CellType.COMPANY, direction=Direction.RIGHT, colour="#3498DB", market_impact=2, company_id=Company.CALDO_SUPPLY, dividends=2),
    BoardTile(tile_id=6, name="$", type=CellType.SHAREHOLDER, direction=Direction.LEFT, colour="#FFFFFF", market_impact=1),
    BoardTile(tile_id=7, name="JP PARTNERS ARCHITECTS", type=CellType.REAL_ESTATE, direction=Direction.LEFT, colour="#95A5A6", purchase_price=900),
    BoardTile(tile_id=8, name="fiasCo. FILMS", type=CellType.COMPANY, direction=Direction.LEFT, colour="#1ABC9C", market_impact=1, company_id=Company.FIASCO_FILMS, dividends=1),
    BoardTile(tile_id=9, name="ACME", type=CellType.COMPANY, direction=Direction.RIGHT, colour="#9B59B6", market_impact=1, company_id=Company.ACME, dividends=1),
    BoardTile(tile_id=10, name="VEGAS", type=CellType.VEGAS, direction=Direction.LEFT, colour="#E74C3C"),

    # === RIGHT ROW (top to bottom) ===
    BoardTile(tile_id=11, name="$", type=CellType.SHAREHOLDER, direction=Direction.LEFT, colour="#FFFFFF", market_impact=2),
    BoardTile(tile_id=12, name="CALDO SUPPLY", type=CellType.COMPANY, direction=Direction.RIGHT, colour="#3498DB", market_impact=3, company_id=Company.CALDO_SUPPLY, dividends=3),
    BoardTile(tile_id=13, name="JETCETERA AIRLINES", type=CellType.COMPANY, direction=Direction.LEFT, colour="#E67E22", market_impact=2, company_id=Company.JETCETERA_AIRLINES, dividends=2),
    BoardTile(tile_id=14, name="$", type=CellType.SHAREHOLDER, direction=Direction.LEFT, colour="#FFFFFF", market_impact=4),
    BoardTile(tile_id=15, name="AUH20", type=CellType.COMPANY, direction=Direction.LEFT, colour="#F1C40F", market_impact=4, company_id=Company.AUH20, dividends=4),
    BoardTile(tile_id=16, name="CONSTRUCTION", type=CellType.REAL_ESTATE, direction=Direction.RIGHT, colour="#95A5A6", purchase_price=1000),
    BoardTile(tile_id=17, name="WILD CARD", type=CellType.WILD_CARD, direction=Direction.LEFT, colour="#FFFFFF", market_impact=2),
    BoardTile(tile_id=18, name="STAR", type=CellType.TROPHY, direction=Direction.LEFT, colour="#D4AC0D", market_impact=3, purchase_price=2000),
    BoardTile(tile_id=19, name="DOUGH, RAY & ME", type=CellType.COMPANY, direction=Direction.LEFT, colour="#2ECC71", market_impact=1, company_id=Company.DOUGH_RAY_AND_ME, dividends=1),
    BoardTile(tile_id=20, name="fiasCo. FILMS", type=CellType.COMPANY, direction=Direction.RIGHT, colour="#1ABC9C", market_impact=2, company_id=Company.FIASCO_FILMS, dividends=2),
    BoardTile(tile_id=21, name="$", type=CellType.SHAREHOLDER, direction=Direction.RIGHT, colour="#FFFFFF", market_impact=1),

    # === BOTTOM ROW (right to left) ===
    BoardTile(tile_id=22, name="TAX MAN COMETH", type=CellType.TAX, direction=Direction.RIGHT, colour="#FFFDF7"),
    BoardTile(tile_id=23, name="CALDO SUPPLY", type=CellType.COMPANY, direction=Direction.LEFT, colour="#3498DB", market_impact=4, company_id=Company.CALDO_SUPPLY, dividends=4),
    BoardTile(tile_id=24, name="JETCETERA AIRLINES", type=CellType.COMPANY, direction=Direction.LEFT, colour="#E67E22", market_impact=1, company_id=Company.JETCETERA_AIRLINES, dividends=1),
    BoardTile(tile_id=25, name="$", type=CellType.SHAREHOLDER, direction=Direction.RIGHT, colour="#FFFFFF", market_impact=4),
    BoardTile(tile_id=26, name="WILD CARD", type=CellType.WILD_CARD, direction=Direction.LEFT, colour="#FFFFFF", market_impact=4),
    BoardTile(tile_id=27, name="DOUGH, RAY & ME", type=CellType.COMPANY, direction=Direction.RIGHT, colour="#2ECC71", market_impact=3, company_id=Company.DOUGH_RAY_AND_ME, dividends=3),
    BoardTile(tile_id=28, name="fiasCo. FILMS", type=CellType.COMPANY, direction=Direction.LEFT, colour="#000000", market_impact=2, company_id=Company.FIASCO_FILMS, dividends=2),
    BoardTile(tile_id=29, name="CVC REAL ESTATE", type=CellType.REAL_ESTATE, direction=Direction.RIGHT, colour="#95A5A6", purchase_price=1000),
    BoardTile(tile_id=30, name="ACME", type=CellType.COMPANY, direction=Direction.RIGHT, colour="#9B59B6", market_impact=3, company_id=Company.ACME, dividends=3),
    BoardTile(tile_id=31, name="AUH20", type=CellType.COMPANY, direction=Direction.LEFT, colour="#F1C40F", market_impact=1, company_id=Company.AUH20, dividends=1),
    BoardTile(tile_id=32, name="STAR", type=CellType.TROPHY, direction=Direction.RIGHT, colour="#D4AC0D", market_impact=3, purchase_price=2000),

    # === LEFT ROW (bottom to top) ===
    BoardTile(tile_id=33, name="BLACK THURSDAY", type=CellType.TAX, direction=Direction.RIGHT, colour="#000000"),
    BoardTile(tile_id=34, name="CALDO SUPPLY", type=CellType.COMPANY, direction=Direction.RIGHT, colour="#3498DB", market_impact=2, company_id=Company.CALDO_SUPPLY, dividends=2),
    BoardTile(tile_id=35, name="DOUGH, RAY & ME", type=CellType.COMPANY, direction=Direction.LEFT, colour="#2ECC71", market_impact=1, company_id=Company.DOUGH_RAY_AND_ME, dividends=1),
    BoardTile(tile_id=36, name="$", type=CellType.SHAREHOLDER, direction=Direction.RIGHT, colour="#FFFFFF", market_impact=2),
    BoardTile(tile_id=37, name="AUH20", type=CellType.COMPANY, direction=Direction.LEFT, colour="#F1C40F", market_impact=4, company_id=Company.AUH20, dividends=4),
    BoardTile(tile_id=38, name="JETCETERA AIRLINES", type=CellType.COMPANY, direction=Direction.LEFT, colour="#E67E22", market_impact=1, company_id=Company.JETCETERA_AIRLINES, dividends=1),
    BoardTile(tile_id=39, name="BONUS", type=CellType.BONUS, direction=Direction.LEFT, colour="#FFFDF7", player_can_choose_direction=True, is_bonus_tile=True),
    BoardTile(tile_id=40, name="EMPIRE BUILDERS", type=CellType.REAL_ESTATE, direction=Direction.LEFT, colour="#95A5A6", purchase_price=1250),
    BoardTile(tile_id=41, name="STAR", type=CellType.TROPHY, direction=Direction.RIGHT, colour="#D4AC0D", market_impact=2, purchase_price=2000),
    BoardTile(tile_id=42, name="ACME", type=CellType.COMPANY, direction=Direction.LEFT, colour="#9B59B6", market_impact=2, company_id=Company.ACME, dividends=2),
    BoardTile(tile_id=43, name="fiasCo. FILMS", type=CellType.COMPANY, direction=Direction.RIGHT, colour="#1ABC9C", market_impact=1, company_id=Company.FIASCO_FILMS, dividends=1),
]

MARKET = { # move to json later
    Company.JETCETERA_AIRLINES: [30, 34, 38, 42, 46, 50, 54, 58, 62, 66, 70, 74, 78, 82, 86, 90, 94, 98, 102, 106, 110, 114, 118, 122, 126, 130, 134, 138, 142, 146, 150, 154, 158, 162, 166, 170, 174, 178, 182], # JETCETERA AIRLINES
    Company.ACME: [138, 135, 132, 129, 126, 123, 120, 117, 114, 111, 108, 105, 102, 99, 96, 93, 90, 87, 84, 81, 78, 75, 72, 69, 66, 63, 60, 57, 54, 51, 48, 45, 42, 39, 36, 33, 30, 27, 24], # ACME
    Company.AUH20: [182, 178, 174, 170, 166, 162, 158, 154, 150, 146, 142, 138, 134, 130, 126, 122, 118, 114, 110, 106, 102, 98, 94, 90, 86, 82, 78, 74, 70, 66, 62, 58, 54, 50, 46, 42, 38, 34, 30], # AUH20
    Company.CALDO_SUPPLY: [18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42, 44, 46, 48, 50, 52, 54, 56, 58, 60, 62, 64, 66, 68, 70, 72, 74, 76, 78, 80, 82, 84, 86, 88, 90, 92, 94], # CALDO SUPPLY
    Company.DOUGH_RAY_AND_ME: [124, 121, 118, 115, 112, 109, 106, 103, 100, 97, 94, 91, 88, 85, 82, 79, 76, 73, 70, 67, 64, 61, 58, 55, 52, 49, 46, 43, 40, 37, 34, 31, 28, 25, 22, 19, 16, 13, 10], # DOUGH, RAY & ME
    Company.FIASCO_FILMS: [10, 13, 16, 19, 22, 25, 28, 31, 34, 37, 40, 43, 46, 49, 52, 55, 58, 61, 64, 67, 70, 73, 76, 79, 82, 85, 88, 91, 94, 97, 100, 103, 106, 109, 112, 115, 118, 121, 124], # fiasCo. FILMS
}
