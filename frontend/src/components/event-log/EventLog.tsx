// components/event-log/EventLog.tsx
import { useEffect, useRef } from "react";
import { COMPANY_NAMES } from "../game/companies";
import { money } from "../game/format";
import { CARD_INFO } from "../game/wildCards";
import { tokenColor } from "../game/tokenColors";
import { playerLabel } from "../action-panel/shared/PanelFrame";

type Entry = { seq: number; type: string; player: number | null; data: Record<string, any> };

function describe(e: Entry, players: any[], tiles: any[]): string {
  const d = e.data;
  const name = (i: number | null | undefined) => (i != null && players[i] ? playerLabel(players[i]) : "банк");
  const tile = (id: number) => tiles.find((t) => t.tile_id === id)?.name ?? `клетка ${id}`;
  const company = (id: number) => COMPANY_NAMES[String(id)] ?? `#${id}`;

  switch (e.type) {
    case "turn_start":     return `Ход: ${name(e.player)}`;
    case "double_again":   return `${name(e.player)} выбросил дубль и ходит ещё раз`;
    case "roll":           return `${name(e.player)} бросил ${d.dice[0]} и ${d.dice[1]}`;
    case "landed":         return `${name(e.player)} встал на ${tile(d.tile_id)}`;
    case "bonus_passed":   return `${name(e.player)} получил бонус ${money(d.amount)}`;
    case "market":         return `Рынок ${d.delta > 0 ? "вырос" : "упал"} на ${Math.abs(d.delta)} (позиция ${d.pointer})`;
    case "dividend":       return `${name(e.player)} получил дивиденды ${money(d.amount)} (${company(d.company_id)})`;
    case "paid":           return `${name(e.player)} заплатил ${money(d.amount)} ${d.to != null ? `игроку ${name(d.to)}` : "в Free Lunch"}`;
    case "rent_waived":    return `${name(e.player)} не платит аренду: у него самая высокая башня`;
    case "bankrupt":       return `${name(e.player)} обанкротился (долг ${money(d.owed)})`;
    case "free_lunch":     return `${name(e.player)} забрал Free Lunch ${money(d.amount)}`;
    case "buy_shares":     return `${name(e.player)} купил ${d.amount} шт. ${company(d.company_id)} по ${money(d.price)}`;
    case "sell_shares":    return `${name(e.player)} продал ${d.amount} шт. ${company(d.company_id)} по ${money(d.price)}`;
    case "buy_property":   return `${name(e.player)} купил ${tile(d.tile_id)}`;
    case "build_floor":    return `${name(e.player)} достроил этаж на ${tile(d.tile_id)} (всего ${d.floors})`;
    case "buy_trophy":     return `${name(e.player)} купил трофей за ${money(d.price)}`;
    case "shareholder":    return `${name(e.player)}: кубик ${d.die}, акций ${company(d.company_id)} теперь ${d.shares}`;
    case "card_drawn":     return `${name(e.player)} вытянул карту «${CARD_INFO[d.card]?.title ?? d.card}»`;
    case "insurance_blocked": return `Страховка ${name(e.player)} отменила карту`;
    case "vegas_house":    return `${name(e.player)} сыграл в Vegas на ${money(d.bet)}: выпало ${d.dice}, ${d.won ? "выигрыш" : "проигрыш"}`;
    case "duel_challenge": return `${name(e.player)} вызвал на дуэль ${name(d.target)}`;
    case "duel_refused":   return `${name(e.player)} отказался от дуэли`;
    case "duel_result":    return `Дуэль: победил ${name(d.winner)}`;
    case "win":            return `${name(e.player)} победил!`;
    default:               return e.type;
  }
}

export function EventLog({ log, players, tiles }: { log: Entry[]; players: any[]; tiles: any[] }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const stickRef = useRef(true);

  useEffect(() => {
    const el = boxRef.current;
    if (el && stickRef.current) el.scrollTop = el.scrollHeight;
  }, [log]);

  return (
    <section className="flex min-h-0 flex-col border border-white/10 bg-[#0d0f14] text-xs">
      <header className="border-b border-white/10 px-3 py-2 text-[10px] tracking-widest text-white/30">ЖУРНАЛ</header>
      <div
        ref={boxRef}
        onScroll={(ev) => {
          const el = ev.currentTarget;
          stickRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 24;
        }}
        className="max-h-72 overflow-y-auto px-3 py-2 space-y-1"
      >
        {log.map((e) => (
          <div key={e.seq} className={e.type === "turn_start" ? "mt-2 border-t border-white/10 pt-1 text-white/90 font-semibold" : "text-white/70"}>
            {e.player != null && e.type !== "turn_start" && (
              <span aria-hidden className={`mr-1.5 inline-block h-2 w-2 rounded-full ${tokenColor(e.player)}`} />
            )}
            {describe(e, players, tiles)}
          </div>
        ))}
      </div>
    </section>
  );
}