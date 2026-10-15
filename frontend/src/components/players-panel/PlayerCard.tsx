import { useState, type ReactNode } from "react";

import { playerLabel } from "../action-panel/shared/PanelFrame";
import { QuantityPicker } from "../action-panel/shared/QuantityPicker";
import type { SendFn } from "../action-panel/types";
import { COMPANY_IDS, COMPANY_NAMES } from "../game/companies";
import { money } from "../game/format";
import { FLOOR_PRICE, MAX_FLOORS_PER_TILE, floorsRemaining, netWorthParts, stockPrice, trophyPrice } from "../game/rules";
import { tokenColor } from "../game/tokenColors";
import type { PlayerState } from "../game/types";
import { NetWorthBar } from "./NetWorthBar";

type Props = {
  index: number;
  player: PlayerState;
  gameState: any;
  tiles: any[];
  isMe: boolean;
  isActive: boolean;
  canAct: boolean;
  busy: boolean;
  onAction: SendFn;
};

const PENALTY_INFO: Record<string, { title: string; text: string }> = {
  b: { title: "B", text: "после банкротства: бонус и Free Lunch в два раза меньше" },
  insurance: { title: "Страховка", text: "отменит следующую карту, нацеленную на игрока" },
};

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="border-t border-white/10 py-2">
      <div className="mb-1 text-[10px] tracking-widest text-white/30">{title}</div>
      {children}
    </div>
  );
}

function SmallButton({
  disabled,
  variant = "secondary",
  onClick,
  children,
}: {
  disabled?: boolean;
  variant?: "primary" | "secondary";
  onClick: () => void;
  children: ReactNode;
}) {
  const style =
    variant === "primary"
      ? "bg-amber-400 text-[#0d0f14] font-bold hover:bg-amber-300"
      : "border border-white/20 text-white/80 hover:border-white/40 disabled:hover:border-white/20";
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`shrink-0 px-2 py-1 text-xs transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400 disabled:opacity-40 disabled:cursor-not-allowed ${style}`}
    >
      {children}
    </button>
  );
}

export function PlayerCard({ index, player, gameState, tiles, isMe, isActive, canAct, busy, onAction }: Props) {
  const [open, setOpen] = useState(isMe);
  const [selling, setSelling] = useState<string | null>(null);
  const [amount, setAmount] = useState(1);

  const players: PlayerState[] = gameState.players;
  const parts = netWorthParts(gameState, player, tiles);
  const holdings = COMPANY_IDS.filter((id) => (player.stocks?.[id] ?? 0) > 0);
  const remaining = floorsRemaining(players);
  const unitTrophy = trophyPrice(players);

  const showActions = isMe && canAct;

  const sellId = selling !== null && holdings.includes(selling) ? selling : null;
  const sellOwned = sellId !== null ? player.stocks[sellId] : 0;
  const sellAmount = Math.min(Math.max(amount, 1), Math.max(sellOwned, 1));

  const tileOf = (tileId: number) => tiles.find((t) => t.tile_id === tileId);

  return (
    <div
      className={`rounded border ${
        isActive ? "border-amber-400/50 bg-white/5" : "border-white/10 bg-white/[0.02]"
      }`}
    >
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full flex-col gap-1.5 p-3 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400"
      >
        <span className="flex flex-wrap items-center gap-2">
          <span aria-hidden className={`h-3 w-3 shrink-0 rounded-full border-2 border-white ${tokenColor(index)}`} />
          <span className="text-sm font-semibold">{playerLabel(player)}</span>
          {isMe && <span className="text-xs text-white/50">вы</span>}
          {player.is_bankrupt && <span className="text-xs text-red-400">банкрот</span>}
          <span aria-hidden className="ml-auto text-xs text-white/30">
            {open ? "▾" : "▸"}
          </span>
        </span>

        <span className="text-lg font-bold leading-none text-amber-400">{money(player.cash)}</span>

        <NetWorthBar value={parts.total} />
      </button>

      {open && (
        <div className="border-t border-white/10 px-3 pb-2 text-xs text-white/70">
          <Section title="НАЛИЧНЫЕ">
            <div className="text-white/90">{money(player.cash)}</div>
          </Section>

          <Section title="АКЦИИ">
            {holdings.length === 0 ? (
              <div className="text-white/50">нет акций</div>
            ) : (
              <ul className="space-y-2">
                {holdings.map((id) => {
                  const owned = player.stocks[id];
                  const price = stockPrice(gameState, id);
                  return (
                    <li key={id}>
                      <div className="flex justify-between gap-2 text-white/90">
                        <span>{COMPANY_NAMES[id]}</span>
                        <span>{price !== undefined ? money(owned * price) : "—"}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2 text-white/50">
                        <span>
                          {owned} шт. × {price !== undefined ? money(price) : "—"}
                        </span>
                        {showActions && (
                          <SmallButton
                            disabled={busy || price === undefined}
                            onClick={() => {
                              setSelling(sellId === id ? null : id);
                              setAmount(1);
                            }}
                          >
                            Продать
                          </SmallButton>
                        )}
                      </div>

                      {showActions && sellId === id && price !== undefined && (
                        <div className="mt-2 space-y-2 border border-white/10 p-2">
                          <QuantityPicker value={sellAmount} min={1} max={owned} onChange={setAmount} disabled={busy} />
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-white/50">
                              Выручка: <span className="text-white/90">{money(sellAmount * price)}</span>
                            </span>
                            <SmallButton
                              variant="primary"
                              disabled={busy}
                              onClick={() => {
                                onAction("sell_shares", { company_id: Number(id), amount: sellAmount });
                                setSelling(null);
                              }}
                            >
                              Продать {sellAmount} шт.
                            </SmallButton>
                          </div>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </Section>

          <Section title="НЕДВИЖИМОСТЬ">
            {player.properties.length === 0 ? (
              <div className="text-white/50">нет недвижимости</div>
            ) : (
              <ul className="space-y-2">
                {player.properties.map((prop) => {
                  const tile = tileOf(prop.tile_id);
                  const canBuild =
                    !busy && player.cash >= FLOOR_PRICE && prop.floors < MAX_FLOORS_PER_TILE && remaining > 0;
                  return (
                    <li key={prop.tile_id} className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-white/90">{tile?.name ?? `Объект ${prop.tile_id}`}</div>
                        <div className="text-white/50">
                          этажей: {prop.floors} из {MAX_FLOORS_PER_TILE}
                          {tile?.purchase_price != null && ` · ${money(tile.purchase_price)}`}
                        </div>
                      </div>
                      {showActions && (
                        <SmallButton disabled={!canBuild} onClick={() => onAction("build_floors", { tile_id: prop.tile_id })}>
                          + этаж {money(FLOOR_PRICE)}
                        </SmallButton>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </Section>

          <Section title="ТРОФЕИ">
            <div className="flex justify-between gap-2">
              <span>
                {player.trophies_owned} шт. × {money(unitTrophy)}
              </span>
              <span className="text-white/90">{money(parts.trophies)}</span>
            </div>
          </Section>

          {player.penalties.length > 0 && (
            <Section title="СТАТУСЫ">
              <ul className="space-y-1">
                {player.penalties.map((penalty, i) => {
                  const info = PENALTY_INFO[penalty.type];
                  return (
                    <li key={`${penalty.type}-${i}`}>
                      <span className="text-amber-400">{info?.title ?? penalty.type}</span>
                      {info && <span className="text-white/50">: {info.text}</span>}
                    </li>
                  );
                })}
              </ul>
            </Section>
          )}

          <div className="flex justify-between border-t border-white/10 pt-2 text-sm font-bold">
            <span className="text-white/70">Итого</span>
            <span className="text-amber-400">{money(parts.total)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
