import { money } from "../../game/format";
import { totalTrophies, trophyPrice, trophyPriceAfterBuy } from "../../game/rules";
import type { ScreenProps } from "../../../types";
import { PanelButton, PanelFrame, playerLabel } from "../shared/PanelFrame";
import { Row } from "../shared/Row";

export function TrophyScreen({ gameState, isMyTurn, busy, onAction }: ScreenProps) {
  const current = gameState.players[gameState.current_turn_index];

  if (!isMyTurn) {
    return (
      <PanelFrame title={`${playerLabel(current)} встал на золотую звезду`}>
        {playerLabel(current)} решает, покупать ли трофей
      </PanelFrame>
    );
  }

  const price = trophyPrice(gameState.players);
  const priceAfter = trophyPriceAfterBuy(gameState.players);
  const cash: number = current.cash;
  const bankrupt: boolean = Boolean(current.is_bankrupt);
  const canBuy = !bankrupt && cash >= price;

  return (
    <PanelFrame
      title="Вы встали на золотую звезду"
      active
      secondary={
        <PanelButton disabled={busy} onClick={() => onAction("pass")}>
          Пропустить
        </PanelButton>
      }
      primary={
        <PanelButton variant="primary" disabled={busy || !canBuy} onClick={() => onAction("trophy_buy")}>
          Купить
        </PanelButton>
      }
    >
      <div className="divide-y divide-white/10">
        <Row label="Цена трофея" value={money(price)} />
        <Row label="Наличные" value={money(cash)} />
        <Row label="Трофеев на поле" value={String(totalTrophies(gameState.players))} />
        <Row label="Ваших трофеев" value={String(current.trophies_owned)} />
      </div>

      {bankrupt && <p className="mt-4 text-amber-400">Вы банкрот, покупка недоступна.</p>}
      {!bankrupt && cash < price && <p className="mt-4 text-amber-400">Не хватает денег на трофей.</p>}

      <p className="mt-4 text-xs text-white/50">
        После покупки каждый трофей на поле будет оцениваться в {money(priceAfter)}: каждый следующий трофей
        дорожает.
      </p>
    </PanelFrame>
  );
}
