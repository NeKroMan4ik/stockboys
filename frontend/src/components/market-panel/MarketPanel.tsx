import { useEffect, useLayoutEffect, useRef, useState } from "react";

import marketData from "../../../../app/engine/data/market.json";
import { money } from "../game/format";
import { MARKET_MAX, MARKET_SIZE } from "../game/rules";

type Company = {
  company_id: number;
  name: string;
  prices: number[];
};

const COMPANIES = (marketData as { companies: Company[] }).companies;

const shortName = (name: string) => name.replace(/[.,]/g, "").toUpperCase();

const RISING = COMPANIES.filter((c) => c.prices[c.prices.length - 1] > c.prices[0]).map((c) => shortName(c.name));
const FALLING = COMPANIES.filter((c) => c.prices[c.prices.length - 1] < c.prices[0]).map((c) => shortName(c.name));

const START_POSITION = Math.floor(MARKET_SIZE / 2);
const MIN_ROW_PX = 8;
const PAD_PX = 12;
const TOOLTIP_W = 208;
const TOOLTIP_H = 190;

const shiftLabel = (n: number) => `${n > 0 ? "+" : "−"}${Math.abs(n)}`;
const diffLabel = (n: number) => (n === 0 ? "0" : `${n > 0 ? "+" : "−"}$${Math.abs(n)}`);

type Hover = { pos: number; top: number; left: number };

export function MarketPanel({ marketPointer }: { marketPointer: number }) {
  const pointer = Math.min(Math.max(marketPointer, 0), MARKET_MAX);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [viewH, setViewH] = useState(0);
  const [hover, setHover] = useState<Hover | null>(null);

  const prevRef = useRef(pointer);
  const [shift, setShift] = useState(0);

  useEffect(() => {
    if (pointer !== prevRef.current) {
      setShift(pointer - prevRef.current);
      prevRef.current = pointer;
    }
  }, [pointer]);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const update = () => setViewH(el.clientHeight);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const rowH = Math.max(MIN_ROW_PX, Math.floor((viewH - 2 * PAD_PX) / MARKET_SIZE));
  const trackH = rowH * MARKET_SIZE;
  const centerY = (pos: number) => (MARKET_MAX - pos) * rowH + rowH / 2;

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || el.scrollHeight <= el.clientHeight) return;
    el.scrollTo({ top: PAD_PX + centerY(pointer) - el.clientHeight / 2, behavior: "smooth" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pointer, rowH]);

  useEffect(() => {
    if (!hover) return;
    const close = (e: PointerEvent) => {
      if (!(e.target as HTMLElement).closest("[data-market-row]")) setHover(null);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [hover]);

  const showTip = (pos: number, el: HTMLElement) => {
    const rect = el.getBoundingClientRect();
    setHover({ pos, top: rect.top + rect.height / 2, left: rect.right + 8 });
  };

  const positions = Array.from({ length: MARKET_SIZE }, (_, i) => MARKET_MAX - i);

  return (
    <section className="flex min-h-0 flex-1 flex-col border border-white/10 bg-[#0d0f14] text-xs">
      <header className="space-y-1 border-b border-white/10 px-3 py-2">
        <span className="text-[10px] tracking-widest text-white/30">MARKET</span>
        {RISING.length > 0 && (
          <p className="text-[10px] leading-snug text-green-400/80">▲ Дорожают при движении вверх: {RISING.join(", ")}</p>
        )}
        {FALLING.length > 0 && (
          <p className="text-[10px] leading-snug text-red-400/80">▼ Дешевеют при движении вверх: {FALLING.join(", ")}</p>
        )}
      </header>

      <div className="flex shrink-0 justify-between px-3 pt-2 text-[10px] text-white/40">
        <span>▲ максимум</span>
        <span></span>
      </div>

      <div ref={scrollRef} onScroll={() => setHover(null)} className="min-h-0 flex-1 overflow-y-auto">
        <div style={{ padding: `${PAD_PX}px 0` }}>
          <div className="relative" style={{ height: trackH }}>
            {positions.map((pos) => {
              const major = pos % 5 === 0 || pos === MARKET_MAX;
              return (
                <div
                  key={pos}
                  data-market-row
                  aria-label={`Позиция ${pos}`}
                  onMouseEnter={(e) => showTip(pos, e.currentTarget)}
                  onMouseLeave={() => setHover(null)}
                  onClick={(e) => showTip(pos, e.currentTarget)}
                  className={`flex cursor-default items-center hover:bg-white/10 ${hover?.pos === pos ? "bg-white/10" : ""}`}
                  style={{ height: rowH }}
                >
                  <span className="w-8 pr-2 text-right text-[9px] leading-none text-white/40">{major ? pos : ""}</span>
                  <span className={`h-0 border-t ${major ? "w-4 border-white/30" : "w-2 border-white/15"}`} />
                </div>
              );
            })}

            {/* start pos */}
            <div
              className="pointer-events-none absolute inset-x-0 border-t border-dashed border-white/40"
              style={{ top: centerY(START_POSITION) }}
            >
              <span className="absolute right-1 -translate-y-full text-[9px] leading-none text-white/40"></span>
            </div>

            <div
              className="pointer-events-none absolute inset-x-0 transition-[top] duration-500 ease-in-out"
              style={{ top: centerY(pointer) }}
            >
              <div className="absolute inset-x-0 border-t border-amber-400/70" />
              <div className="absolute left-10 flex -translate-y-1/2 items-center gap-2">
                <span className="rounded bg-amber-400 px-2 py-0.5 text-sm font-bold text-[#0d0f14]">{pointer}</span>
                {shift !== 0 && (
                  <span className={`font-semibold ${shift > 0 ? "text-green-400" : "text-red-400"}`}>
                    {shiftLabel(shift)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex shrink-0 justify-between px-3 pb-2 text-[10px] text-white/40">
        <span>▼ минимум</span>
        <span></span>
      </div>

      {hover && (
        <div
          className="pointer-events-none fixed z-50 border border-white/20 bg-[#0d0f14] p-2 shadow-lg"
          style={{
            width: TOOLTIP_W,
            left: Math.min(hover.left, window.innerWidth - TOOLTIP_W - 8),
            top: Math.min(Math.max(hover.top - TOOLTIP_H / 2, 8), window.innerHeight - TOOLTIP_H - 8),
          }}
        >
          <div className="mb-1 text-[10px] tracking-widest text-white/30">
            ПОЗИЦИЯ {hover.pos}
            {hover.pos === pointer && " · ТЕКУЩАЯ"}
          </div>
          <ul className="space-y-0.5">
            {COMPANIES.map((c) => {
              const price = c.prices[hover.pos];
              const diff = price - c.prices[pointer];
              const color = diff > 0 ? "text-green-400" : diff < 0 ? "text-red-400" : "text-white/40";
              return (
                <li key={c.company_id} className="flex justify-between gap-2">
                  <span className="truncate text-white/60">{shortName(c.name)}</span>
                  <span className="flex gap-2 whitespace-nowrap">
                    <span className="text-white/90">{money(price)}</span>
                    <span className={`w-10 text-right ${color}`}>{diffLabel(diff)}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}
