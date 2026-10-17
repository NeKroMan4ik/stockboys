import type { ScreenProps } from "../../../types";
import { PanelButton, PanelFrame, playerLabel } from "../shared/PanelFrame";

export function RollScreen({ gameState, isMyTurn, busy, onAction }: ScreenProps) {
  const current = gameState.players[gameState.current_turn_index];

  if (!isMyTurn) {
    return (
      <PanelFrame title={`Ход: ${playerLabel(current)}`}>
        {playerLabel(current)} бросает кубики
      </PanelFrame>
    );
  }

  const dice = gameState.last_dice;
  const isDouble = Array.isArray(dice) && dice[0] === dice[1];

  return (
    <PanelFrame
      title="Ваш ход"
      active
      primary={
        <PanelButton variant="primary" disabled={busy} onClick={() => onAction("roll")}>
          Бросить кубики
        </PanelButton>
      }
    >
      {isDouble && <p className="text-amber-400">Дубль, ходите ещё раз</p>}
    </PanelFrame>
  );
}