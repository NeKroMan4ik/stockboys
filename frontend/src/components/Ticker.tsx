import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";

import { COMPANY_NAMES } from "./game/companies";

type PriceChange = {
  new_price: number;
  old_price: number;
  diff_abs: number;
  diff_rel: number;
};

// JSON-keys of the dictionary are always "1".."6" lines
type Props = {
  priceChange: Record<string, PriceChange>;
};

type Slot = { key: number; id: string; change: PriceChange };

const SPEED_PX_S = 50;
const MAX_DT = 0.1;

const sign = (n: number) => (n > 0 ? "+" : n < 0 ? "−" : "");

const same = (a: PriceChange, b: PriceChange) =>
  a.new_price === b.new_price &&
  a.old_price === b.old_price &&
  a.diff_abs === b.diff_abs &&
  a.diff_rel === b.diff_rel;

function TickerItem({ id, change }: { id: string; change: PriceChange }) {
  const color =
    change.new_price > change.old_price
      ? "text-green-400"
      : change.new_price < change.old_price
      ? "text-red-400"
      : "text-white/50";

  return (
    <span className={`shrink-0 whitespace-nowrap px-6 text-xs ${color}`}>
      {COMPANY_NAMES[id] ?? `#${id}`}
      {" · "}${change.new_price}
      {" · "}
      {sign(change.diff_abs)}${Math.abs(change.diff_abs)}
      {" · "}
      {sign(change.diff_rel)}{Math.abs(change.diff_rel)}%
    </span>
  );
}

export function Ticker({ priceChange }: Props) {
  const latestRef = useRef(priceChange);
  latestRef.current = priceChange;

  const [slots, setSlots] = useState<Slot[]>([]);
  const slotsRef = useRef<Slot[]>([]);
  slotsRef.current = slots;

  const viewRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const keyRef = useRef(0);
  const scrolledRef = useRef(0);

  const makeSet = (data: Props["priceChange"]): Slot[] =>
    Object.entries(data).map(([id, change]) => ({ key: keyRef.current++, id, change }));


  useEffect(() => {
    if (slots.length === 0 && priceChange && Object.keys(priceChange).length > 0) {
      setSlots([...makeSet(priceChange), ...makeSet(priceChange)]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [priceChange, slots.length]);

  const ready = slots.length > 0;

  useEffect(() => {
    if (!ready) return;
    const view = viewRef.current;
    const track = trackRef.current;
    if (!view || !track) return;

    let raf = 0;
    let last = performance.now();

    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, MAX_DT);
      last = now;

      let x = scrolledRef.current + SPEED_PX_S * dt;

      const first = track.firstElementChild as HTMLElement | null;
      if (first && x >= first.offsetWidth) {
        x -= first.offsetWidth;
        flushSync(() => setSlots((p) => [...p.slice(1), p[0]]));
      }

      scrolledRef.current = x;
      track.style.transform = `translateX(${-x}px)`;

      const viewW = view.clientWidth;
      const latest = latestRef.current;
      const current = slotsRef.current;
      const children = Array.from(track.children) as HTMLElement[];

      const hidden = children.map((el) => el.offsetLeft - x >= viewW);
      const needUpdate = current.some(
        (s, i) => hidden[i] && latest[s.id] && !same(latest[s.id], s.change),
      );
      const grow = track.offsetWidth < viewW * 2;

      if (needUpdate || grow) {
        const extra = grow ? makeSet(latest) : [];
        setSlots((prev) => [
          ...prev.map((s, i) =>
            hidden[i] && latest[s.id] && !same(latest[s.id], s.change)
              ? { ...s, change: latest[s.id] }
              : s,
          ),
          ...extra,
        ]);
      }

      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  if (slots.length === 0) return null;

  return (
    <div ref={viewRef} className="flex flex-1 min-w-0 overflow-hidden">
      <div ref={trackRef} className="relative flex w-max items-center will-change-transform">
        {slots.map((s) => (
          <TickerItem key={s.key} id={s.id} change={s.change} />
        ))}
      </div>
    </div>
  );
}