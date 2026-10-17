import { useState } from "react";

import { COMPANY_IDS, COMPANY_NAMES } from "../../game/companies";
import { money } from "../../game/format";
import { stockPrice } from "../../game/rules";
import type { ScreenProps } from "../../../types";
import { CompanyPicker } from "../shared/CompanyPicker";
import { PanelButton, PanelFrame, playerLabel } from "../shared/PanelFrame";
import { Row } from "../shared/Row";

export function ShareholderScreen({ gameState, isMyTurn, busy, onAction }: ScreenProps) {
  const current = gameState.players[gameState.current_turn_index];
  const [selected, setSelected] = useState<string | null>(null);

  if (!isMyTurn) {
    return (
      <PanelFrame title="Собрание акционеров">{playerLabel(current)} на собрании акционеров</PanelFrame>
    );
  }

  const cash: number = current.cash;
  const available = COMPANY_IDS.filter((id) => {
    const price = stockPrice(gameState, id);
    return price !== undefined && price <= cash;
  });

  if (available.length === 0) {
    return (
      <PanelFrame
        title="Собрание акционеров"
        active
        primary={
          <PanelButton variant="primary" disabled={busy} onClick={() => onAction("pass")}>
            Продолжить
          </PanelButton>
        }
      >
        Не хватает денег даже на одну акцию любой компании ({money(cash)}). Купить и бросить кубик нельзя.
      </PanelFrame>
    );
  }

  const chosen = selected !== null && available.includes(selected) ? selected : null;
  const price = chosen !== null ? stockPrice(gameState, chosen) : undefined;
  const owned: number = chosen !== null ? current.stocks?.[chosen] ?? 0 : 0;

  return (
    <PanelFrame
      title="Собрание акционеров"
      active
      primary={
        <PanelButton
          variant="primary"
          disabled={busy || chosen === null}
          onClick={() => chosen !== null && onAction("shareholder_roll", { company_id: Number(chosen) })}
        >
          Купить и бросить
        </PanelButton>
      }
    >
      <p className="mb-4 text-xs text-white/50">
        Вы обязаны купить одну акцию выбранной компании по текущей цене. Затем бросается кубик, и всё количество
        акций этой компании умножается на результат.
      </p>

      <CompanyPicker
        prices={gameState.price_change}
        holder={current}
        holderLabel="У вас"
        selected={chosen}
        onSelect={setSelected}
        available={available}
        unavailableLabel="не хватает денег"
        disabled={busy}
      />

      {chosen !== null && price !== undefined && (
        <div className="mt-4 divide-y divide-white/10">
          <Row label="Компания" value={COMPANY_NAMES[chosen]} />
          <Row label="Цена акции" value={money(price)} />
          <Row label="Акций у вас сейчас" value={String(owned)} />
          <Row label="После покупки и броска" value={`от ${owned + 1} до ${6 * (owned + 1)}`} />
        </div>
      )}
    </PanelFrame>
  );
}
