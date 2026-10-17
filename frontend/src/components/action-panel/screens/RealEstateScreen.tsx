import { money } from "../../game/format";
import { BASE_RENT_TIERS, FLOOR_PRICE, TOTAL_FLOORS, floorsRemaining, rentFor } from "../../game/rules";
import type { ScreenProps } from "../../../types";
import { PanelButton, PanelFrame, playerLabel } from "../shared/PanelFrame";
import { Row } from "../shared/Row";

export function RealEstateScreen({ gameState, tiles, isMyTurn, busy, onAction }: ScreenProps) {
  const current = gameState.players[gameState.current_turn_index];
  const tile = tiles.find((t) => t.tile_id === current.current_tile_id);
  const tileName: string = tile?.name ?? "объект";

  if (!isMyTurn) {
    return (
      <PanelFrame title={`${playerLabel(current)} встал на ${tileName}`}>
        {playerLabel(current)} решает, покупать ли недвижимость
      </PanelFrame>
    );
  }

  const skip = (
    <PanelButton disabled={busy} onClick={() => onAction("pass")}>
      Пропустить
    </PanelButton>
  );

  const price: number | undefined = tile?.purchase_price ?? undefined;

  if (price === undefined) {
    return (
      <PanelFrame title={`Вы встали на ${tileName}`} active primary={skip}>
        Нет данных о цене объекта.
      </PanelFrame>
    );
  }

  const cash: number = current.cash;
  const bankrupt: boolean = Boolean(current.is_bankrupt);
  const canBuy = !bankrupt && cash >= price;
  const remaining = floorsRemaining(gameState.players);

  return (
    <PanelFrame
      title={`Вы встали на ${tileName}`}
      active
      secondary={skip}
      primary={
        <PanelButton variant="primary" disabled={busy || !canBuy} onClick={() => onAction("buy_real_estate")}>
          Купить
        </PanelButton>
      }
    >
      <div className="divide-y divide-white/10">
        <Row label="Цена объекта" value={money(price)} />
        <Row label="Наличные" value={money(cash)} />
        <Row label="Цена этажа" value={money(FLOOR_PRICE)} />
      </div>

      {bankrupt && <p className="mt-4 text-amber-400">Вы банкрот, покупка недоступна.</p>}
      {!bankrupt && cash < price && <p className="mt-4 text-amber-400">Не хватает денег на покупку.</p>}

      <div className="mt-4">
        <div className="text-xs text-white/50 mb-1">Аренда по этажам</div>
        <div className="divide-y divide-white/10">
          {BASE_RENT_TIERS.map((_, i) => (
            <Row key={i} label={`${i + 1} эт.`} value={money(rentFor(price, i + 1))} />
          ))}
        </div>
      </div>

      <ul className="mt-4 space-y-1 text-xs text-white/50">
        <li>Этажей на всех игроков всего {TOTAL_FLOORS}, свободно на поле: {remaining}.</li>
        <li>Владелец самой высокой башни не платит аренду другим.</li>
      </ul>
    </PanelFrame>
  );
}
