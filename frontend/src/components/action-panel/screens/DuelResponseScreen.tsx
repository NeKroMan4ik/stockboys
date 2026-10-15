import { money } from "../../game/format";
import { DUEL_REFUSE_FINE } from "../../game/rules";
import type { ScreenProps } from "../types";
import { BetSummary } from "../shared/BetSummary";
import { PanelButton, PanelFrame, playerLabel } from "../shared/PanelFrame";

export function DuelResponseScreen({ gameState, isMyTurn, busy, onAction }: ScreenProps) {
  const duel = gameState.pending_duel;
  const initiator = typeof duel?.initiator_index === "number" ? gameState.players[duel.initiator_index] : null;
  const target = typeof duel?.target_index === "number" ? gameState.players[duel.target_index] : null;

  if (!initiator || !target) {
    const current = gameState.players[gameState.current_turn_index];
    return (
      <PanelFrame
        title="Дуэль в Vegas"
        active={isMyTurn}
        primary={
          isMyTurn ? (
            <PanelButton variant="primary" disabled={busy} onClick={() => onAction("pass")}>
              Пропустить
            </PanelButton>
          ) : null
        }
      >
        {isMyTurn ? "Нет данных о дуэли." : `${playerLabel(current)} ходит`}
      </PanelFrame>
    );
  }

  const bets = (
    <div className="divide-y divide-white/10">
      <BetSummary title={`Ставка ${playerLabel(initiator)}`} bet={duel.initiator_bet} />
      <BetSummary title={`Ставка ${playerLabel(target)}`} bet={duel.target_bet} />
    </div>
  );

  if (!isMyTurn) {
    return (
      <PanelFrame title="Дуэль в Vegas">
        <p className="mb-3">
          {playerLabel(initiator)} вызвал на дуэль {playerLabel(target)}. Ждём ответа от {playerLabel(target)}
        </p>
        {bets}
      </PanelFrame>
    );
  }

  const cannotAffordFine = target.cash < DUEL_REFUSE_FINE;

  return (
    <PanelFrame
      title="Вас вызвали на дуэль"
      active
      secondary={
        <PanelButton disabled={busy} onClick={() => onAction("vegas_duel_refuse")}>
          Отказаться, штраф {money(DUEL_REFUSE_FINE)}
        </PanelButton>
      }
      primary={
        <PanelButton variant="primary" disabled={busy} onClick={() => onAction("vegas_duel_resolve")}>
          Принять
        </PanelButton>
      }
    >
      <p className="mb-3">{playerLabel(initiator)} вызывает вас на дуэль. Победитель забирает ставку проигравшего.</p>
      {bets}

      {cannotAffordFine && (
        <p className="mt-4 text-amber-400">
          У вас меньше {money(DUEL_REFUSE_FINE)}: отказ приведёт к банкротству.
        </p>
      )}
    </PanelFrame>
  );
}
