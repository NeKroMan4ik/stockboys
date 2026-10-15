import { useState, type ReactNode } from "react";

import { COMPANY_IDS, COMPANY_NAMES } from "../../game/companies";
import { money } from "../../game/format";
import { MARKET_MAX, MAX_FLOORS_PER_TILE, clampPointer, floorsRemaining, stockPrice } from "../../game/rules";
import type { PlayerState } from "../../game/types";
import { CARD_INFO, DECISION_CARDS } from "../../game/wildCards";
import type { ScreenProps, SendFn } from "../types";
import { ChoiceButton } from "../shared/ChoiceButton";
import { CompanyPicker } from "../shared/CompanyPicker";
import { PanelButton, PanelFrame, playerLabel } from "../shared/PanelFrame";
import { PlayerPicker } from "../shared/PlayerPicker";
import { Row } from "../shared/Row";

type FormProps = {
  gameState: any;
  tiles: any[];
  card: string;
  busy: boolean;
  onAction: SendFn;
};

function CardHeader({ card }: { card: string }) {
  const info = CARD_INFO[card];
  return (
    <div className="mb-4">
      <div className="font-bold text-amber-400">{info.title}</div>
      <p className="mt-1 text-white/70">{info.description}</p>
    </div>
  );
}

function CardFrame({
  card,
  busy,
  onAction,
  children,
  primary,
}: {
  card: string;
  busy: boolean;
  onAction: SendFn;
  children?: ReactNode;
  primary?: ReactNode;
}) {
  return (
    <PanelFrame
      title="Wild Card"
      active
      secondary={
        primary ? undefined : (
          <PanelButton disabled={busy} onClick={() => onAction("pass")}>
            Пропустить
          </PanelButton>
        )
      }
      primary={primary}
    >
      <CardHeader card={card} />
      {children}
    </PanelFrame>
  );
}

function Burned({ card, reason, busy, onAction }: { card: string; reason: string; busy: boolean; onAction: SendFn }) {
  return (
    <PanelFrame
      title="Wild Card"
      active
      primary={
        <PanelButton variant="primary" disabled={busy} onClick={() => onAction("pass")}>
          Пропустить
        </PanelButton>
      }
    >
      <CardHeader card={card} />
      <p className="text-amber-400">Карта сгорает: {reason}</p>
    </PanelFrame>
  );
}

function Apply({ disabled, onClick }: { disabled: boolean; onClick: () => void }) {
  return (
    <PanelButton variant="primary" disabled={disabled} onClick={onClick}>
      Разыграть
    </PanelButton>
  );
}

const hasStocks = (p: PlayerState) => Object.values(p.stocks ?? {}).some((n) => n > 0);
const ownedCompanies = (p: PlayerState) => COMPANY_IDS.filter((id) => (p.stocks?.[id] ?? 0) > 0);

function NationalizationForm({ gameState, card, busy, onAction }: FormProps) {
  const players: PlayerState[] = gameState.players;
  const me: number = gameState.current_turn_index;
  const [target, setTarget] = useState<number | null>(null);
  const [company, setCompany] = useState<string | null>(null);

  if (!players.some((p, i) => i !== me && hasStocks(p))) {
    return <Burned card={card} reason="ни у одного соперника нет акций." busy={busy} onAction={onAction} />;
  }

  const rival = target !== null ? players[target] : null;
  const available = rival ? ownedCompanies(rival) : [];
  const chosen = company !== null && available.includes(company) ? company : null;
  const price = chosen !== null ? stockPrice(gameState, chosen) : undefined;
  const shares = rival && chosen !== null ? rival.stocks[chosen] : 0;
  const valid = rival !== null && chosen !== null;

  return (
    <CardFrame
      card={card}
      busy={busy}
      onAction={onAction}
      primary={
        <Apply
          disabled={busy || !valid}
          onClick={() =>
            valid && onAction("card_effect", { target_player_index: target, company_id: Number(chosen) })
          }
        />
      }
    >
      <div className="text-xs text-white/50 mb-1">Игрок</div>
      <PlayerPicker
        players={players}
        selected={target}
        onSelect={(i) => {
          setTarget(i);
          setCompany(null);
        }}
        hide={(_, i) => i === me}
        blockedReason={(p) => (hasStocks(p) ? null : "нет акций")}
        disabled={busy}
      />

      {rival && (
        <>
          <div className="text-xs text-white/50 mt-4 mb-1">Компания</div>
          <CompanyPicker
            prices={gameState.price_change}
            holder={rival}
            selected={chosen}
            onSelect={setCompany}
            available={available}
            unavailableLabel="нет акций"
            disabled={busy}
          />
        </>
      )}

      {rival && chosen !== null && price !== undefined && (
        <p className="mt-4 text-xs text-white/50">
          {playerLabel(rival)} продаёт все акции {COMPANY_NAMES[chosen]} ({shares} шт.) по текущей цене{" "}
          {money(price)} и получает {money(shares * price)}.
        </p>
      )}
    </CardFrame>
  );
}

function TrophyHeistForm({ gameState, card, busy, onAction }: FormProps) {
  const players: PlayerState[] = gameState.players;
  const me: number = gameState.current_turn_index;
  const [target, setTarget] = useState<number | null>(null);

  if (!players.some((p, i) => i !== me && p.trophies_owned > 0)) {
    return <Burned card={card} reason="ни у одного соперника нет трофеев." busy={busy} onAction={onAction} />;
  }

  const valid = target !== null && target !== me && players[target].trophies_owned > 0;

  return (
    <CardFrame
      card={card}
      busy={busy}
      onAction={onAction}
      primary={
        <Apply
          disabled={busy || !valid}
          onClick={() => valid && onAction("card_effect", { target_player_index: target })}
        />
      }
    >
      <PlayerPicker
        players={players}
        selected={target}
        onSelect={setTarget}
        hide={(_, i) => i === me}
        blockedReason={(p) => (p.trophies_owned > 0 ? null : "нет трофеев")}
        detail={(p) => `трофеев: ${p.trophies_owned}`}
        disabled={busy}
      />
    </CardFrame>
  );
}

function ConstructionGrantForm({ gameState, tiles, card, busy, onAction }: FormProps) {
  const players: PlayerState[] = gameState.players;
  const me: PlayerState = players[gameState.current_turn_index];
  const [tileId, setTileId] = useState<number | null>(null);

  const remaining = floorsRemaining(players);
  const buildable = me.properties.filter((p) => p.floors < MAX_FLOORS_PER_TILE);

  if (remaining <= 0) {
    return <Burned card={card} reason="свободных этажей на поле не осталось." busy={busy} onAction={onAction} />;
  }
  if (buildable.length === 0) {
    return (
      <Burned card={card} reason="у вас нет объектов, где можно достроить этажи." busy={busy} onAction={onAction} />
    );
  }

  const chosen = buildable.find((p) => p.tile_id === tileId) ?? null;

  return (
    <CardFrame
      card={card}
      busy={busy}
      onAction={onAction}
      primary={
        <Apply
          disabled={busy || chosen === null}
          onClick={() => chosen && onAction("card_effect", { tile_id: chosen.tile_id })}
        />
      }
    >
      <div className="flex flex-col gap-2">
        {buildable.map((prop) => {
          const name = tiles.find((t) => t.tile_id === prop.tile_id)?.name ?? `Объект ${prop.tile_id}`;
          const gain = Math.min(2, MAX_FLOORS_PER_TILE - prop.floors, remaining);
          return (
            <ChoiceButton
              key={prop.tile_id}
              selected={chosen?.tile_id === prop.tile_id}
              disabled={busy}
              onClick={() => setTileId(prop.tile_id)}
            >
              <span className="flex justify-between gap-3">
                <span>{name}</span>
                <span className="text-white/50">
                  этажей: {prop.floors} → {prop.floors + gain}
                </span>
              </span>
            </ChoiceButton>
          );
        })}
      </div>
    </CardFrame>
  );
}

function MarketManipulationForm({ gameState, card, busy, onAction }: FormProps) {
  const [impact, setImpact] = useState<5 | -5 | null>(null);
  const pointer: number = gameState.market_pointer;

  return (
    <CardFrame
      card={card}
      busy={busy}
      onAction={onAction}
      primary={
        <Apply
          disabled={busy || impact === null}
          onClick={() => impact !== null && onAction("card_effect", { market_impact: impact })}
        />
      }
    >
      <Row label="Ползунок сейчас" value={`${pointer} из ${MARKET_MAX}`} />
      <div className="mt-3 grid grid-cols-2 gap-3">
        {([5, -5] as const).map((delta) => (
          <ChoiceButton key={delta} selected={impact === delta} disabled={busy} onClick={() => setImpact(delta)}>
            <span className="block text-base font-bold">{delta > 0 ? "+5" : "-5"}</span>
            <span className="block text-xs text-white/50">
              {pointer} → {clampPointer(pointer + delta)}
            </span>
          </ChoiceButton>
        ))}
      </div>
    </CardFrame>
  );
}

function StockSplitForm({ gameState, card, busy, onAction }: FormProps) {
  const me: PlayerState = gameState.players[gameState.current_turn_index];
  const [company, setCompany] = useState<string | null>(null);

  const available = ownedCompanies(me);
  if (available.length === 0) {
    return <Burned card={card} reason="у вас нет акций." busy={busy} onAction={onAction} />;
  }

  const chosen = company !== null && available.includes(company) ? company : null;
  const shares = chosen !== null ? me.stocks[chosen] : 0;

  return (
    <CardFrame
      card={card}
      busy={busy}
      onAction={onAction}
      primary={
        <Apply
          disabled={busy || chosen === null}
          onClick={() => chosen !== null && onAction("card_effect", { company_id: Number(chosen) })}
        />
      }
    >
      <CompanyPicker
        prices={gameState.price_change}
        holder={me}
        holderLabel="У вас"
        selected={chosen}
        onSelect={setCompany}
        available={available}
        unavailableLabel="нет акций"
        disabled={busy}
      />

      {chosen !== null && (
        <div className="mt-4">
          <Row label="Акций станет" value={`${shares} → ${shares * 2}`} />
        </div>
      )}
    </CardFrame>
  );
}

export function WildCardScreen({ gameState, tiles, isMyTurn, busy, onAction }: ScreenProps) {
  const current = gameState.players[gameState.current_turn_index];
  const card: string | null = gameState.pending_card ?? null;
  const info = card ? CARD_INFO[card] : undefined;

  if (!isMyTurn) {
    return (
      <PanelFrame title="Wild Card">
        {playerLabel(current)} разыгрывает карту{info ? ` ${info.title}` : ""}
      </PanelFrame>
    );
  }

  if (card === null || !DECISION_CARDS.has(card)) {
    return (
      <PanelFrame
        title="Wild Card"
        active
        primary={
          <PanelButton variant="primary" disabled={busy} onClick={() => onAction("pass")}>
            Пропустить
          </PanelButton>
        }
      >
        Для этой карты нет экрана выбора.
      </PanelFrame>
    );
  }

  const props: FormProps = { gameState, tiles, card, busy, onAction };

  switch (card) {
    case "nationalization":
      return <NationalizationForm {...props} />;
    case "trophy_heist":
      return <TrophyHeistForm {...props} />;
    case "construction_grant":
      return <ConstructionGrantForm {...props} />;
    case "market_manipulation":
      return <MarketManipulationForm {...props} />;
    default:
      return <StockSplitForm {...props} />;
  }
}
