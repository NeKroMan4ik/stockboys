import { useEffect, useState, type ReactNode } from "react";
import { useGame } from "./useGame";
import { API } from "./api";

import { PlayersPanel } from "./components/players-panel/PlayersPanel";
import { Ticker } from "./components/Ticker";
import { WaitingRoom } from "./components/WaitingRoom";
import { MarketPanel } from "./components/market-panel/MarketPanel";
import { FreeLunchPot } from "./components/FreeLunchPot";
import { LobbyScreen } from "./components/LobbyScreen";
import { Dice } from "./components/Dice"
import { Token, type Point } from "./components/Token";
import { locate, moveArrow } from "./components/game/boardLayout";
import { tokenHex } from "./components/game/tokenColors";

import { EventLog } from "./components/event-log/EventLog";

import { CornerTile } from "./components/tiles/CornerTile";
import { RegularTile } from "./components/tiles/RegularTile";
import { RealEstateTile } from "./components/tiles/RealEstateTile";
import { StartTile } from "./components/tiles/StartTile";
import type { FaceProps } from "./components/tiles/TileFace";

import { ActionPanel } from "./components/action-panel/ActionPanel";
import { PanelButton } from "./components/action-panel/shared/PanelFrame";


// Routing by URL:
//   ?game=<id>&player=<имя>   -> game
//   ?lobby=<id>&player=<имя>  -> waiting screen
//   no params                 -> main (create/join lobby)

type Screen =
  | { kind: "menu" }
  | { kind: "lobby"; lobbyId: string; character: string }
  | { kind: "game"; gameId: string; character: string };

const STORAGE_KEY = "stockboys.screen";

// Starting screen
function loadScreen(): Screen {
  const params = new URLSearchParams(window.location.search);
  const gameId = params.get("game");
  const lobbyId = params.get("lobby");
  const player = params.get("player");

  let fromUrl: Screen | null = null;
  if (gameId && player) fromUrl = { kind: "game", gameId, character: player };
  else if (lobbyId && player) fromUrl = { kind: "lobby", lobbyId, character: player };

  if (fromUrl) {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(fromUrl));
    } catch {}
    window.history.replaceState(null, "", window.location.pathname);
    return fromUrl;
  }

  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Screen;
  } catch {}

  return { kind: "menu" };
}

export default function App() {
  const [screen, setScreen] = useState<Screen>(loadScreen);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(screen));
    } catch {}
  }, [screen]);

  const toMenu = () => setScreen({ kind: "menu" });

  if (screen.kind === "game") {
    return <GameView gameId={screen.gameId} playerName={screen.character} onExit={toMenu} />;
  }

  if (screen.kind === "lobby") {
    return (
      <WaitingRoom
        lobbyId={screen.lobbyId}
        character={screen.character}
        onGameStart={(id) => setScreen({ kind: "game", gameId: id, character: screen.character })}
      />
    );
  }

  return (
    <LobbyScreen
      onEnter={(id, character) => setScreen({ kind: "lobby", lobbyId: id, character })}
    />
  );
}

type Tile = {
  tile_id: number;
  name: string;
  type: string;
  direction: number;
  colour: string;
  market_impact?: number | null;
  dividends?: number | null;
  purchase_price?: number | null;
  player_can_choose_direction?: boolean;
};

type BoardData = {
  tiles: Tile[];
  starts: Record<string, number>;
};

// Minimal information about players to properly render tokens and real estate
type PlayerView = {
  username: string;
  character: string;
  current_tile_id: number;
  properties?: { tile_id: number; floors: number }[];
};

// Board loading
function useBoard() {
  const [board, setBoard] = useState<BoardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API}/board`)
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(setBoard)
      .catch(() => setError("Не удалось загрузить доску"));
  }, []);

  return { board, error };
}

const CORNER_PX = 80;
const EDGE_PX = 56;

const BUMP_PX = 32;
const PANEL_INSET = BUMP_PX + 8;

function trackCenter(line: number, n: number): number {
  const grid = n + 1;
  if (line === 1) return CORNER_PX / 2;
  if (line === grid) return CORNER_PX + (n - 1) * EDGE_PX + CORNER_PX / 2;
  return CORNER_PX + (line - 2) * EDGE_PX + EDGE_PX / 2;
}

const TOKEN_GAP = 14;  // Distance between tokens on the board

// Starting tile elongation render
const BUMP_TO_CENTER = { right: "left", top: "down", left: "right", bottom: "up" } as const;

// Arrows
const CORNER_ARROWS = [["↑", "←"], ["←", "↓"], ["↓", "→"], ["→", "↑"]];

function Board({ tiles, starts, players, children }: BoardData & { players: PlayerView[]; children?: ReactNode }) {
  const n = tiles.length / 4;
  const panelOffset = CORNER_PX + PANEL_INSET;
  const panelSize = (n - 1) * EDGE_PX - 2 * PANEL_INSET;
  const startIds = new Set<number>(Object.values(starts));

  // Centers of the tiles by tile_id for token animation
  const centers: Point[] = [];
  tiles.forEach((t) => {
    const { row, col } = locate(t.tile_id, n);
    centers[t.tile_id] = { x: trackCenter(col, n), y: trackCenter(row, n) };
  });

  const byTile = new Map<number, number[]>();
  players.forEach((p, i) => {
    byTile.set(p.current_tile_id, [...(byTile.get(p.current_tile_id) ?? []), i]);
  });

  // Tile owner
  const ownerOf = (tileId: number) => {
    for (let i = 0; i < players.length; i++) {
      const prop = players[i].properties?.find((p) => p.tile_id === tileId);
      if (prop) {
        return {
          label: `${players[i].username} (${players[i].character})`,
          hex: tokenHex(i),
          floors: prop.floors,
        };
      }
    }
    return null;
  };

  return (
    <div
      className="relative m-auto grid"
      style={{
        gridTemplateColumns: `${CORNER_PX}px repeat(${n - 1}, ${EDGE_PX}px) ${CORNER_PX}px`,
        gridTemplateRows: `${CORNER_PX}px repeat(${n - 1}, ${EDGE_PX}px) ${CORNER_PX}px`,
      }}
    >
      {tiles.map((tile) => {
        const { side, isCorner, row, col } = locate(tile.tile_id, n);
        const vertical = side === "left" || side === "right";
        const market = tile.market_impact || null;

        let card;
        if (isCorner) {
          const [forward, backward] = CORNER_ARROWS[tile.tile_id / n];
          card = (
            <CornerTile
              name={tile.name}
              colour={tile.colour}
              market={market}
              arrow={tile.direction === 1 ? forward : backward}
            />
          );
        } else {
          const price =
            tile.type === "real_estate" ? tile.purchase_price :
            tile.type === "company" ? tile.dividends : null;

          const arrow: FaceProps["arrow"] = tile.player_can_choose_direction
            ? "both"
            : moveArrow(tile.direction, side);

          const face: FaceProps = {
            name: tile.type === "shareholder" ? "$" : tile.type === "trophy" ? "★" : tile.name,
            symbol: tile.type === "shareholder" || tile.type === "trophy",
            top: price != null ? `$${price.toLocaleString("en-US")}` : null,
            market,
            arrow,
            // Tiles top is directed to the center on the left and right edges of the board
            rotate: side === "left" ? 90 : side === "right" ? -90 : 0,
          };

          if (tile.type === "real_estate" && tile.purchase_price != null) {
            card = (
              <RealEstateTile
                colour={tile.colour}
                vertical={vertical}
                grow={BUMP_TO_CENTER[side]}
                tileName={tile.name}
                price={tile.purchase_price}
                owner={ownerOf(tile.tile_id)}
                {...face}
              />
            );
          } else if (startIds.has(tile.tile_id)) {
            card = (
              <StartTile
                colour={tile.colour}
                bumpDirection={BUMP_TO_CENTER[side]}
                vertical={vertical}
                {...face}
              />
            );
          } else {
            card = <RegularTile colour={tile.colour} vertical={vertical} {...face} />;
          }
        }

        return (
          <div key={tile.tile_id} style={{ gridRow: row, gridColumn: col }}>
            {card}
          </div>
        );
      })}

      {children && (
        <div className="absolute z-10" style={{ left: panelOffset, top: panelOffset, width: panelSize, height: panelSize }}>
          {children}
        </div>
      )}

      {/* Tokens layer overlaying the board one */}
      <div className="absolute inset-0 z-20 pointer-events-none">
        {players.map((p, i) => {
          const group = byTile.get(p.current_tile_id) ?? [i];
          const offsetX = (group.indexOf(i) - (group.length - 1) / 2) * TOKEN_GAP;
          return (
            <Token
              key={p.character}
              index={i}
              username={p.username}
              character={p.character}
              tileId={p.current_tile_id}
              offsetX={offsetX}
              centers={centers}
            />
          );
        })}
      </div>
    </div>
  );
}

// Sever errors
const ERROR_TEXTS: Record<string, string> = {
  "Connection error": "Ошибка соединения с сервером",
  "game not found": "Игра не найдена или уже закрыта",
  "player not in the lobby": "Вас нет в списке игроков этой партии",
};

// Messages on the screen
function CenteredMessage({ title, tone = "neutral", children, action }: {
  title: string;
  tone?: "neutral" | "error";
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d0f14] p-6 text-white">
      <div className="w-full max-w-sm space-y-3 border border-white/10 px-5 py-4">
        <h1 className={`text-sm font-bold tracking-wide ${tone === "error" ? "text-red-400" : "text-white/70 animate-pulse"}`}>
          {title}
        </h1>
        {children && <p className="text-sm text-white/70">{children}</p>}
        {action}
      </div>
    </div>
  );
}

function GameView({ gameId, playerName, onExit }: { gameId: string; playerName: string; onExit: () => void }) {
  const { gameState, error, send } = useGame(gameId, playerName);
  const { board, error: boardError } = useBoard();

  if (error) {
    return (
      <CenteredMessage
        title="Ошибка соединения"
        tone="error"
        action={
          <PanelButton variant="primary" onClick={onExit}>
            В меню
          </PanelButton>
        }
      >
        {ERROR_TEXTS[error] ?? error}
      </CenteredMessage>
    );
  }

  if (!gameState) return <CenteredMessage title="Подключение…" />;

  return (
    <div className="h-screen flex flex-col bg-[#0d0f14] text-white overflow-hidden">

      {/* Header */}
      <header className="flex items-center gap-4 px-4 py-2 border-b border-white/10">
        <span className="font-bold tracking-widest text-sm">STOCKBOYS</span>
        <Ticker priceChange={gameState.price_change} />
      </header>

      {/* Main */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* Left — Free Lunch pot and market visualization */}
        <aside className="w-64 border-r border-white/10 p-3 flex flex-col gap-3 min-h-0">
          <FreeLunchPot amount={gameState.free_lunch_pot ?? 0} />
          <MarketPanel marketPointer={gameState.market_pointer} />
        </aside>

        {/* Center — board */}
        <main className="flex-1 flex items-center justify-center overflow-auto">
          {boardError && <p className="text-red-500 text-sm">{boardError}</p>}
          {board && (
            <Board {...board} players={gameState.players}>
              <ActionPanel gameState={gameState} playerName={playerName} tiles={board.tiles} send={send} onExit={onExit} />
            </Board>
          )}
        </main>

        {/* Right — dice and players */}
        <aside className="w-80 border-l border-white/10 flex flex-col min-h-0">
          <div className="shrink-0 flex justify-center p-3 border-b border-white/10">
            <Dice gameState={gameState} />
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto p-3 flex flex-col gap-3">
            {board && (
              <PlayersPanel gameState={gameState} playerName={playerName} tiles={board.tiles} send={send} />
            )}
            {board && <EventLog log={gameState.log ?? []} players={gameState.players} tiles={board.tiles} />}
          </div>
        </aside>

      </div>
    </div>
  );
}