# Stockboys

A real-time multiplayer browser board game where up to four players race around the board, trading stocks, building towers, buying trophies and gambling in Vegas. The first player to reach **$100,000 in net worth** wins.

## Features

- Lobby system: create a lobby, share the code, join from a list of open lobbies or by code
- Real-time gameplay over WebSockets, with state synced through Redis pub/sub
- Server-authoritative game engine: the client only sends actions, the server validates and applies them
- Stock market driven by a single slider; every landed tile moves it
- Real estate with buildable floors, trophies, shareholder meetings, Vegas (house bets and player duels)
- 14 Wild Cards
- Live price ticker, market scale with price tooltips, and an event log

## Tech stack

**Backend**
- Python, FastAPI (REST + WebSocket)
- Pydantic / pydantic-settings
- Redis (game and lobby state with TTL, pub/sub for broadcasting)

**Frontend**
- React + TypeScript, built with Vite
- Tailwind CSS

## Project structure

```
backend/
  app/
    main.py              # FastAPI app, CORS, router registration, optional static frontend
    config.py            # Settings (app, redis)
    redis_client.py      # Async Redis client
    engine/
      game.py            # Turn logic: roll, tile effects, buy/sell, Vegas, duels
      func.py            # Helpers: market pointer, rent, net worth, bankruptcy, win check
      wild_cards.py      # Wild Card definitions and handlers
      schemas.py         # Pydantic models (GameState, Player, BoardTile, ...)
      constants.py       # Balance constants
      board.py           # Loads board.json and market.json
      data/
        board.json       # Board tiles and starting positions
        market.json      # Price scales for the six companies
    routers/
      games.py           # POST /games
      lobbies.py         # Lobby CRUD, join, start
      board.py           # GET /board
      dev.py             # POST /dev/games (debug mode only)
      ws.py              # WebSocket endpoint /ws/{game_id}
    ws/
      ws_manager.py      # Connections and Redis pub/sub
      ws_schemas.py      # WebSocket actions, responses, lobby models
frontend/
  src/
    App.tsx              # Routing between menu, waiting room and game; board rendering
    useGame.ts           # WebSocket hook
    api.ts               # API base URL
    components/
      LobbyScreen.tsx, WaitingRoom.tsx, Ticker.tsx, Token.tsx, ...
      action-panel/      # One screen per turn phase (roll, buy shares, real estate, Vegas, cards, ...)
      players-panel/     # Player cards: cash, stocks, properties, trophies, net worth
      market-panel/      # Market slider visualization
      game/              # Shared client-side rules, formatting, company names, board layout
```

## Getting started

### Prerequisites

- Python 3.11+
- Node.js 18+
- A running Redis instance

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt

uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The dev server runs on `http://localhost:5173`, which is the default allowed CORS origin.

## Configuration

Settings are read from a `.env` file (see `app/config.py`).

| Variable | Default | Description |
| --- | --- | --- |
| `REDIS_HOST` | `localhost` | Redis host |
| `REDIS_PORT` | `6379` | Redis port |
| `REDIS_URL` | unset | Full Redis URL; takes precedence over host/port/db |

Other settings (allowed CORS origins, game TTL, default 12 hours) are defined in `app/config.py`.

Frontend:

| Variable | Default | Description |
| --- | --- | --- |
| `VITE_API_URL` | `http://localhost:8000` | Backend base URL (HTTP and WebSocket) |

If the built frontend is placed in a `static/` directory next to `app/`, FastAPI serves it from `/`.

## API overview

REST

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/board` | Board tiles and starting positions |
| `POST` | `/games` | Create a game from a list of players |
| `GET` | `/lobbies` | List lobbies |
| `POST` | `/lobbies` | Create a lobby |
| `GET` | `/lobbies/{id}` | Get a lobby |
| `POST` | `/lobbies/{id}/join` | Join a lobby |
| `POST` | `/lobbies/{id}/start` | Start the game (host only) |

WebSocket: `/ws/{game_id}?character=<name>`

The client sends `{ "action": "...", "payload": {...} }`. The server replies with `{ "type": "state_update", "game_state": {...} }` or `{ "type": "error", "error": "..." }`.

Actions: `roll`, `pass`, `buy_shares`, `sell_shares`, `shareholder_roll`, `buy_real_estate`, `trophy_buy`, `build_floors`, `vegas_house`, `trigger_vegas_duel`, `vegas_duel_refuse`, `vegas_duel_resolve`, `choose_direction`, `card_effect`.

## Game rules

**Goal.** Be the first to reach $100,000 in net worth (cash + stocks + real estate + trophies). Up to 4 players, each with $5,000 to start.

**Characters.** Johnny Mustard, Burl Cutterback, Tripp Dunwhistle, Joe Sixpack.

**Turn.** Roll two dice and move. The direction of travel is set by the arrow on the tile you start from. Doubles give you another turn, with no limit. During your turn you can sell shares at the current price and build floors on properties you own.

**Stock market.** Every time a player lands on a tile, the market slider moves by that tile's market impact. Each company has its own price scale tied to the slider position. When anyone lands on a company tile, all shareholders of that company receive that tile's dividend per share.

**Tiles**

| Tile | Effect |
| --- | --- |
| Company | Buy shares; shareholders are paid dividends |
| Shareholder meeting (`$`) | Buy one share, then multiply your holding of that company by a die roll |
| Bonus | Passing it pays $1,000; landing on it lets you choose direction |
| Star | Buy a trophy; each trophy owned by anyone raises the price ($2,000 × (trophies owned + 1)) |
| Real estate | Buy the property; pay rent if someone else owns it |
| Free Lunch | Collect the pot of accumulated fines and taxes |
| Vegas | Bet against the house (win on a roll above 7 for 1.5×) or challenge another player to a duel |
| Wild Card | Draw a random card |
| Black Thursday / Broker Fee | Pay $10 per share you own |
| Tax Man Cometh | Pay 20% of cash, trophies and real estate (stocks excluded) |

**Real estate.** There are 16 floors in total for all players. A floor costs $250, up to 5 per property. Rent depends on the property price and its number of floors. The owner of the tallest tower pays no rent.

**Bankruptcy.** A player who cannot pay sells stocks to cover the debt, then loses all cash and restarts from their starting tile with the "B" status (half bonus and half Free Lunch payouts). On a double, bankrupt players receive $1,000 until they climb back to $2,000.

## Tests

```bash
cd backend
pytest
```

Test helpers for building players and game states live in `conftest.py`.
