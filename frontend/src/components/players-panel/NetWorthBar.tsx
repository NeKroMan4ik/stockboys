import { money } from "../game/format";
import { WIN_NETWORTH } from "../game/rules";

export function NetWorthBar({ value }: { value: number }) {
  const percent = Math.min(Math.max(value / WIN_NETWORTH, 0), 1) * 100;

  return (
    <div className="flex flex-col gap-1">
      <div className="text-[10px] leading-none text-white/50">
        {money(value)} / {money(WIN_NETWORTH)}
      </div>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={WIN_NETWORTH}
        aria-valuenow={Math.min(value, WIN_NETWORTH)}
        aria-label="Общий капитал"
        className="h-1 w-full bg-white/10"
      >
        <div className="h-full bg-amber-400" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
