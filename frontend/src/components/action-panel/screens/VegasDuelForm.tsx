import { useState } from "react";

import { emptyBet, isBetEmpty, isBetValid } from "../../game/bets";
import { DUEL_REFUSE_FINE } from "../../game/rules";
import { money } from "../../game/format";
import type { Bet, PlayerState } from "../../game/types";
import type { SendFn } from "../types";
import { BetBuilder } from "../shared/BetBuilder";
import { PanelButton, PanelFrame } from "../shared/PanelFrame";
import { PlayerPicker } from "../shared/PlayerPicker";

export function VegasDuelForm({
  gameState,
  busy,
  onAction,
  onBack,
}: {
  gameState: any;
  busy: boolean;
  onAction: SendFn;
  onBack: () => void;
}) {
  const players: PlayerState[] = gameState.players;
  const meIndex: number = gameState.current_turn_index;
  const me = players[meIndex];

  const [target, setTarget] = useState<number | null>(null);
  const [myBet, setMyBet] = useState<Bet>(emptyBet());
  const [theirBet, setTheirBet] = useState<Bet>(emptyBet());

  const rival = target !== null ? players[target] : null;

  const valid =
    rival !== null &&
    !rival.is_bankrupt &&
    !isBetEmpty(myBet) &&
    !isBetEmpty(theirBet) &&
    isBetValid(myBet, me) &&
    isBetValid(theirBet, rival);

  return (
    <PanelFrame
      title="Vegas: дуэль"
      active
      secondary={
        <PanelButton disabled={busy} onClick={onBack}>
          Назад
        </PanelButton>
      }
      primary={
        <PanelButton
          variant="primary"
          disabled={busy || !valid}
          onClick={() =>
            valid &&
            onAction("trigger_vegas_duel", { target_index: target, initiator_bet: myBet, target_bet: theirBet })
          }
        >
          Вызвать на дуэль
        </PanelButton>
      }
    >
      <p className="mb-4 text-xs text-white/50">
        Победитель забирает ставку проигравшего. Если соперник откажется, он заплатит штраф {money(DUEL_REFUSE_FINE)}.
      </p>

      <div className="text-xs text-white/50 mb-1">Соперник</div>
      <PlayerPicker
        players={players}
        selected={target}
        onSelect={(i) => {
          setTarget(i);
          setTheirBet(emptyBet());
        }}
        hide={(_, i) => i === meIndex}
        blockedReason={(p) => (p.is_bankrupt ? "банкрот" : null)}
        disabled={busy}
      />

      {rival && (
        <>
          <div className="text-xs text-white/50 mt-4">Ваша ставка</div>
          <BetBuilder portfolio={me} value={myBet} onChange={setMyBet} disabled={busy} />

          <div className="text-xs text-white/50 mt-4">Ставка соперника</div>
          <BetBuilder portfolio={rival} value={theirBet} onChange={setTheirBet} disabled={busy} />

          {(isBetEmpty(myBet) || isBetEmpty(theirBet)) && (
            <p className="mt-3 text-xs text-amber-400">Обе ставки должны быть непустыми.</p>
          )}
        </>
      )}
    </PanelFrame>
  );
}
