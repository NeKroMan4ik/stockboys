import { COMPANY_NAMES } from "./companies";
import { money } from "./format";
import type { Bet, PlayerState } from "./types";

export const emptyBet = (): Bet => ({ cash: 0, trophies: 0, stocks: [] });

export function isBetEmpty(bet: Bet): boolean {
  return bet.cash <= 0 && bet.trophies <= 0 && bet.stocks.every((s) => s.amount <= 0);
}

export function isBetValid(bet: Bet, owner: PlayerState): boolean {
  if (bet.cash < 0 || bet.cash > owner.cash) return false;
  if (bet.trophies < 0 || bet.trophies > owner.trophies_owned) return false;
  return bet.stocks.every(
    (s) => s.amount >= 0 && s.amount <= (owner.stocks?.[String(s.company_id)] ?? 0),
  );
}

export function describeBet(bet: Bet): string[] {
  const lines: string[] = [];
  if (bet.cash > 0) lines.push(`Наличные: ${money(bet.cash)}`);
  if (bet.trophies > 0) lines.push(`Трофеи: ${bet.trophies}`);
  for (const s of bet.stocks) {
    if (s.amount > 0) lines.push(`${COMPANY_NAMES[String(s.company_id)] ?? `#${s.company_id}`} × ${s.amount}`);
  }
  return lines;
}
