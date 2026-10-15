import { useEffect, useRef, useState } from "react";

import { money } from "../game/format";
import { BASE_RENT_TIERS, FLOOR_PRICE, MAX_FLOORS_PER_TILE, rentFor } from "../game/rules";
import { TileFace, type FaceProps } from "./TileFace";

type Direction = "up" | "down" | "left" | "right";

export type RealEstateOwner = {
  label: string;    // «username (character)»
  hex: string;      // token colour
  floors: number;
};

const EXTRA_PX = 10;       // elongation
const TOOLTIP_W = 224;
const TOOLTIP_H = 250;

type Props = FaceProps & {
  colour?: string;
  vertical?: boolean;        // true for the right and left sides
  grow: Direction;           // direction of elongation
  tileName: string;
  price: number;
  owner: RealEstateOwner | null;
};

type Tip = { top: number; left: number };

export function RealEstateTile({
  colour = "#151820",
  vertical = false,
  grow,
  tileName,
  price,
  owner,
  ...face
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [tip, setTip] = useState<Tip | null>(null);

  const showTip = () => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const fitsRight = r.right + 8 + TOOLTIP_W <= window.innerWidth;
    setTip({
      top: Math.min(Math.max(r.top + r.height / 2 - TOOLTIP_H / 2, 8), window.innerHeight - TOOLTIP_H - 8),
      left: fitsRight ? r.right + 8 : Math.max(r.left - TOOLTIP_W - 8, 8),
    });
  };

  useEffect(() => {
    if (!tip) return;
    const close = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setTip(null);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [tip]);

  const floors = owner?.floors ?? 0;
  const currentRent = floors > 0 ? rentFor(price, Math.min(floors, BASE_RENT_TIERS.length)) : 0;

  const boxStyle: React.CSSProperties = {
    top: grow === "up" ? -EXTRA_PX : 0,
    bottom: grow === "down" ? -EXTRA_PX : 0,
    left: grow === "left" ? -EXTRA_PX : 0,
    right: grow === "right" ? -EXTRA_PX : 0,
    backgroundColor: colour + "22",
    // regular tile when no owner, colored frame when owner
    ...(owner ? { borderColor: owner.hex + "99" } : {}),
  };

  return (
    <div
      ref={ref}
      className={`relative ${vertical ? "w-20 h-14" : "w-14 h-20"}`}
      onMouseEnter={showTip}
      onMouseLeave={() => setTip(null)}
      onClick={showTip}
    >
      <div
        className={`absolute ${owner ? "border-2" : "border border-white/10"}`}
        style={boxStyle}
      />

      <div className="absolute inset-0">
        <TileFace {...face} />
      </div>

      {tip && (
        <div
          className="pointer-events-none fixed z-50 border border-white/20 bg-[#0d0f14] p-2 text-xs shadow-lg"
          style={{ width: TOOLTIP_W, top: tip.top, left: tip.left }}
        >
          <div className="mb-1 text-[10px] tracking-widest text-white/30">НЕДВИЖИМОСТЬ</div>
          <div className="mb-2 font-bold text-white/90">{tileName}</div>

          <div className="divide-y divide-white/10">
            <div className="flex justify-between gap-2 py-1">
              <span className="text-white/50">Цена</span>
              <span className="text-white/90">{money(price)}</span>
            </div>
            <div className="flex justify-between gap-2 py-1">
              <span className="text-white/50">Владелец</span>
              {owner ? (
                <span className="flex items-center gap-1.5 text-white/90">
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: owner.hex }}
                  />
                  {owner.label}
                </span>
              ) : (
                <span className="text-white/50">свободна</span>
              )}
            </div>
            {owner && (
              <>
                <div className="flex justify-between gap-2 py-1">
                  <span className="text-white/50">Этажей</span>
                  <span className="text-white/90">
                    {owner.floors} из {MAX_FLOORS_PER_TILE}
                  </span>
                </div>
                <div className="flex justify-between gap-2 py-1">
                  <span className="text-white/50">Аренда сейчас</span>
                  <span className="text-white/90">{money(currentRent)}</span>
                </div>
              </>
            )}
          </div>

          <div className="mt-2 text-[10px] tracking-widest text-white/30">
            АРЕНДА ПО ЭТАЖАМ · ЭТАЖ {money(FLOOR_PRICE)}
          </div>
          <ul className="mt-1 space-y-0.5">
            {BASE_RENT_TIERS.map((_, i) => (
              <li
                key={i}
                className={`flex justify-between gap-2 ${
                  owner && owner.floors === i + 1 ? "text-amber-400" : "text-white/60"
                }`}
              >
                <span>{i + 1} эт.</span>
                <span>{money(rentFor(price, i + 1))}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}