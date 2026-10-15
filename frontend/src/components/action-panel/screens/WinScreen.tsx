import { money } from "../../game/format";
import { netWorthParts } from "../../game/rules";
import type { PlayerState } from "../../game/types";
import type { ScreenProps } from "../types";
import { PanelButton, PanelFrame, playerLabel } from "../shared/PanelFrame";

export function WinScreen({
  gameState,
  tiles,
  onExit,
}: Pick<ScreenProps, "gameState" | "tiles"> & { onExit: () => void }) {
  const players: PlayerState[] = gameState.players;
  const winner: PlayerState | undefined = players[gameState.winner_index];

  const rows = players
    .map((player) => ({ player, parts: netWorthParts(gameState, player, tiles) }))
    .sort((a, b) => b.parts.total - a.parts.total);

  return (
    <PanelFrame
      title="Игра окончена"
      active
      primary={
        <PanelButton variant="primary" onClick={onExit}>
          В меню
        </PanelButton>
      }
    >
      {winner && (
        <p className="mb-4 text-base font-bold text-amber-400">Победил {playerLabel(winner)}</p>
      )}

      <ol className="space-y-2">
        {rows.map(({ player, parts }, i) => (
          <li
            key={player.character}
            className={`border px-3 py-2 ${player === winner ? "border-amber-400/60" : "border-white/10"}`}
          >
            <div className="flex justify-between gap-3">
              <span className="text-white/90">
                {i + 1}. {playerLabel(player)}
              </span>
              <span className="font-bold text-white">{money(parts.total)}</span>
            </div>
            <div className="mt-1 grid grid-cols-2 gap-x-3 text-xs text-white/50">
              <span>Наличные: {money(parts.cash)}</span>
              <span>Акции: {money(parts.shares)}</span>
              <span>Недвижимость: {money(parts.properties)}</span>
              <span>Трофеи: {money(parts.trophies)}</span>
            </div>
          </li>
        ))}
      </ol>
    </PanelFrame>
  );
}
