import { money } from "./game/format";

export function FreeLunchPot({ amount }: { amount: number }) {
  return (
    <div className="shrink-0 flex items-baseline justify-between gap-2 border border-white/10 bg-[#0d0f14] px-3 py-2">
      <span className="text-xs text-white/50">Free Lunch</span>
      <span className="text-lg font-bold text-amber-400">{money(amount)}</span>
    </div>
  );
}
