import { useState } from "react";

import { money } from "../../game/format";
import type { ScreenProps } from "../types";
import { PanelButton, PanelFrame, playerLabel } from "../shared/PanelFrame";
import { QuantityPicker } from "../shared/QuantityPicker";
import { Row } from "../shared/Row";

export function BuySharesScreen({ gameState, tiles, isMyTurn, busy, onAction }: ScreenProps) {
  const current = gameState.players[gameState.current_turn_index];
  const tile = tiles.find((t) => t.tile_id === current.current_tile_id);
  const companyName: string = tile?.name ?? "компанию";

  const price: number | undefined =
    tile?.company_id != null ? gameState.price_change?.[String(tile.company_id)]?.new_price : undefined;

  const cash: number = current.cash;
  const max = price && price > 0 ? Math.floor(cash / price) : 0;
  const bankrupt: boolean = Boolean(current.is_bankrupt);
  const canBuy = !bankrupt && max >= 1;

  const [amount, setAmount] = useState(1);
  const value = Math.min(Math.max(amount, 1), Math.max(max, 1));

  if (!isMyTurn) {
    return (
      <PanelFrame title={`${playerLabel(current)} встал на ${companyName}`}>
        {playerLabel(current)} выбирает, сколько акций купить
      </PanelFrame>
    );
  }

  const skip = (
    <PanelButton disabled={busy} onClick={() => onAction("pass")}>
      Пропустить
    </PanelButton>
  );

  if (price === undefined) {
    return (
      <PanelFrame title={`Вы встали на ${companyName}`} active primary={skip}>
        Нет данных о цене акции.
      </PanelFrame>
    );
  }

  return (
    <PanelFrame
      title={`Вы встали на ${companyName}`}
      active
      secondary={skip}
      primary={
        <PanelButton
          variant="primary"
          disabled={busy || !canBuy}
          onClick={() => onAction("buy_shares", { amount: value })}
        >
          Купить
        </PanelButton>
      }
    >
      <div className="divide-y divide-white/10">
        <Row label="Компания" value={companyName} />
        <Row label="Цена акции" value={money(price)} />
        <Row label="Наличные" value={money(cash)} />
        <Row label="Можно купить" value={String(max)} />
      </div>

      {bankrupt && <p className="mt-4 text-amber-400">Вы банкрот, покупка акций недоступна.</p>}
      {!bankrupt && max < 1 && <p className="mt-4 text-amber-400">Не хватает денег даже на одну акцию.</p>}

      {canBuy && (
        <div className="mt-4 flex items-center justify-between gap-4">
          <QuantityPicker value={value} min={1} max={max} onChange={setAmount} disabled={busy} />
          <div className="text-right">
            <div className="text-white/50 text-xs">Итого</div>
            <div className="text-white text-base font-bold">{money(value * price)}</div>
          </div>
        </div>
      )}
    </PanelFrame>
  );
}