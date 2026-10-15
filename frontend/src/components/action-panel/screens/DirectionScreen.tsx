import { locate, screenDirection, type ScreenDirection } from "../../game/boardLayout";
import type { ScreenProps } from "../types";
import { PanelFrame, playerLabel } from "../shared/PanelFrame";

const TITLE = "Бонусная клетка: выберите направление";

const ARROWS: Record<ScreenDirection, { glyph: string; label: string }> = {
  up: { glyph: "↑", label: "Вверх" },
  down: { glyph: "↓", label: "Вниз" },
  left: { glyph: "←", label: "Влево" },
  right: { glyph: "→", label: "Вправо" },
};

export function DirectionScreen({ gameState, tiles, isMyTurn, busy, onAction }: ScreenProps) {
  const current = gameState.players[gameState.current_turn_index];

  if (!isMyTurn) {
    return <PanelFrame title={TITLE}>{playerLabel(current)} выбирает направление</PanelFrame>;
  }

  const { side } = locate(current.current_tile_id, tiles.length / 4);

  return (
    <PanelFrame title={TITLE} active>
      <div className="grid grid-cols-2 gap-3">
        {[-1, 1].map((direction) => {
          const { glyph, label } = ARROWS[screenDirection(direction, side)];
          return (
            <button
              key={direction}
              type="button"
              disabled={busy}
              onClick={() => onAction("choose_direction", { direction })}
              className="flex flex-col items-center justify-center gap-1 py-6 border border-white/20 text-white/90 hover:border-amber-400 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-white/20"
            >
              <span className="text-3xl leading-none">{glyph}</span>
              <span className="text-sm">{label}</span>
            </button>
          );
        })}
      </div>
    </PanelFrame>
  );
}
