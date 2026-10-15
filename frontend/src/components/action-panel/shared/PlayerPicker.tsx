import { money } from "../../game/format";
import type { PlayerState } from "../../game/types";
import { playerLabel } from "./PanelFrame";

type Props = {
  players: PlayerState[];
  selected: number | null;
  onSelect: (index: number) => void;
  hide?: (player: PlayerState, index: number) => boolean;
  blockedReason?: (player: PlayerState, index: number) => string | null;
  detail?: (player: PlayerState, index: number) => string | null;
  disabled?: boolean;
};

export function PlayerPicker({ players, selected, onSelect, hide, blockedReason, detail, disabled = false }: Props) {
  return (
    <div role="radiogroup" aria-label="Игрок" className="flex flex-col gap-2">
      {players.map((player, index) => {
        if (hide?.(player, index)) return null;

        const reason = blockedReason?.(player, index) ?? null;
        const blocked = reason !== null;
        const isSelected = selected === index;
        const extra = detail?.(player, index);

        return (
          <button
            key={player.character}
            type="button"
            role="radio"
            aria-checked={isSelected}
            disabled={disabled || blocked}
            onClick={() => onSelect(index)}
            className={`w-full px-3 py-2 text-left text-sm border transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400 disabled:opacity-40 disabled:cursor-not-allowed ${
              isSelected
                ? "border-amber-400 text-white"
                : "border-white/20 text-white/80 hover:border-white/40 disabled:hover:border-white/20"
            }`}
          >
            <span className="flex items-center justify-between gap-3">
              <span>{playerLabel(player)}</span>
              <span className="text-xs text-white/50">
                {money(player.cash)}
                {extra ? ` · ${extra}` : ""}
              </span>
            </span>
            {blocked && reason && <span className="block mt-1 text-[10px] text-amber-400/80">{reason}</span>}
          </button>
        );
      })}
    </div>
  );
}
