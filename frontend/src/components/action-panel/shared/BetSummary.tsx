import { describeBet } from "../../game/bets";
import type { Bet } from "../../game/types";

export function BetSummary({ title, bet }: { title: string; bet: Bet | undefined }) {
  const lines = bet ? describeBet(bet) : [];

  return (
    <div className="py-2">
      <div className="text-xs text-white/50">{title}</div>
      {lines.length === 0 ? (
        <div className="mt-1 text-white/50">пусто</div>
      ) : (
        <ul className="mt-1 space-y-0.5 text-white/90">
          {lines.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
