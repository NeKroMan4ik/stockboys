import { useState } from "react";

import { money } from "../../game/format";
import type { ScreenProps } from "../types";
import { ChoiceButton } from "../shared/ChoiceButton";
import { PanelButton, PanelFrame, playerLabel } from "../shared/PanelFrame";
import { QuantityPicker } from "../shared/QuantityPicker";
import { Row } from "../shared/Row";
import { VegasDuelForm } from "./VegasDuelForm";

type Mode = "menu" | "bank" | "duel";

export function VegasScreen(props: ScreenProps) {
  const { gameState, isMyTurn, busy, onAction } = props;
  const current = gameState.players[gameState.current_turn_index];

  const [mode, setMode] = useState<Mode>("menu");
  const [amount, setAmount] = useState(1);

  if (!isMyTurn) {
    return <PanelFrame title="Vegas">{playerLabel(current)} играет в Vegas</PanelFrame>;
  }

  const cash: number = current.cash;
  const bankrupt: boolean = Boolean(current.is_bankrupt);
  const hasRival = gameState.players.some((p: any, i: number) => i !== gameState.current_turn_index && !p.is_bankrupt);

  if (mode === "duel") {
    return <VegasDuelForm gameState={gameState} busy={busy} onAction={onAction} onBack={() => setMode("menu")} />;
  }

  const skip = (
    <PanelButton disabled={busy} onClick={() => onAction("pass")}>
      Пропустить
    </PanelButton>
  );

  if (mode === "bank") {
    const value = Math.min(Math.max(amount, 1), Math.max(cash, 1));
    const canBet = !bankrupt && cash >= 1;

    return (
      <PanelFrame
        title="Vegas: против банка"
        active
        secondary={
          <PanelButton disabled={busy} onClick={() => setMode("menu")}>
            Назад
          </PanelButton>
        }
        primary={
          <PanelButton
            variant="primary"
            disabled={busy || !canBet}
            onClick={() => onAction("vegas_house", { amount: value })}
          >
            Сделать ставку
          </PanelButton>
        }
      >
        <p className="mb-4 text-xs text-white/50">
          Бросаются два кубика. Если выпало больше 7, вы выигрываете и получаете ещё 1,5 ставки, иначе теряете
          ставку. Шанс выигрыша 15 из 36, примерно 42%.
        </p>

        <div className="divide-y divide-white/10">
          <Row label="Наличные" value={money(cash)} />
          {canBet && <Row label="При выигрыше" value={`+${money(Math.floor(value * 1.5))}`} />}
          {canBet && <Row label="При проигрыше" value={`-${money(value)}`} />}
        </div>

        {bankrupt && <p className="mt-4 text-amber-400">Вы банкрот, ставки недоступны.</p>}
        {!bankrupt && cash < 1 && <p className="mt-4 text-amber-400">Нет наличных для ставки.</p>}

        {canBet && (
          <div className="mt-4">
            <QuantityPicker value={value} min={1} max={cash} onChange={setAmount} disabled={busy} />
          </div>
        )}
      </PanelFrame>
    );
  }

  return (
    <PanelFrame title="Vegas" active secondary={skip}>
      <div className="flex flex-col gap-2">
        <ChoiceButton disabled={busy || bankrupt || cash < 1} onClick={() => setMode("bank")}>
          <span className="block font-bold">Против банка</span>
          <span className="block text-xs text-white/50">Ставка наличными, выигрыш при сумме кубиков больше 7</span>
        </ChoiceButton>

        <ChoiceButton disabled={busy || bankrupt || !hasRival} onClick={() => setMode("duel")}>
          <span className="block font-bold">Дуэль</span>
          <span className="block text-xs text-white/50">Ставка против другого игрока, победитель забирает всё</span>
        </ChoiceButton>
      </div>

      {bankrupt && <p className="mt-4 text-amber-400">Вы банкрот, Vegas недоступен.</p>}
      {!bankrupt && cash < 1 && <p className="mt-4 text-amber-400">Нет наличных для ставки против банка.</p>}
      {!bankrupt && !hasRival && <p className="mt-4 text-amber-400">Нет соперников для дуэли.</p>}
    </PanelFrame>
  );
}
