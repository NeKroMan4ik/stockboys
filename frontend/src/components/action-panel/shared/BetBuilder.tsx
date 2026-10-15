import type { ReactNode } from "react";

import { COMPANY_IDS, COMPANY_NAMES } from "../../game/companies";
import type { Bet, PlayerState } from "../../game/types";
import { QuantityPicker } from "./QuantityPicker";

type Props = {
  portfolio: PlayerState;
  value: Bet;
  onChange: (bet: Bet) => void;
  disabled?: boolean;
};

function BetRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <span className="text-xs text-white/70">{label}</span>
      {children}
    </div>
  );
}

export function BetBuilder({ portfolio, value, onChange, disabled = false }: Props) {
  const ownedCompanies = COMPANY_IDS.filter((id) => (portfolio.stocks?.[id] ?? 0) > 0);
  const stockAmount = (id: string) => value.stocks.find((s) => s.company_id === Number(id))?.amount ?? 0;

  const setStock = (id: string, amount: number) => {
    const rest = value.stocks.filter((s) => s.company_id !== Number(id));
    onChange({ ...value, stocks: amount > 0 ? [...rest, { company_id: Number(id), amount }] : rest });
  };

  return (
    <div className="divide-y divide-white/10">
      <BetRow label="Наличные">
        <QuantityPicker
          value={value.cash}
          min={0}
          max={portfolio.cash}
          onChange={(cash) => onChange({ ...value, cash })}
          disabled={disabled || portfolio.cash < 1}
        />
      </BetRow>

      <BetRow label="Трофеи">
        <QuantityPicker
          value={value.trophies}
          min={0}
          max={portfolio.trophies_owned}
          onChange={(trophies) => onChange({ ...value, trophies })}
          disabled={disabled || portfolio.trophies_owned < 1}
        />
      </BetRow>

      {ownedCompanies.map((id) => (
        <BetRow key={id} label={COMPANY_NAMES[id]}>
          <QuantityPicker
            value={stockAmount(id)}
            min={0}
            max={portfolio.stocks[id]}
            onChange={(amount) => setStock(id, amount)}
            disabled={disabled}
          />
        </BetRow>
      ))}
    </div>
  );
}
