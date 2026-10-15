import { COMPANY_IDS, COMPANY_NAMES } from "../../game/companies";
import { money } from "../../game/format";
import type { PlayerState, PriceMap } from "../../game/types";

type Props = {
  prices: PriceMap | undefined;
  holder?: PlayerState | null;
  holderLabel?: string;
  selected: string | null;
  onSelect: (companyId: string) => void;
  available: string[];
  unavailableLabel?: string | ((companyId: string) => string);
  disabled?: boolean;
};

export function CompanyPicker({
  prices,
  holder = null,
  holderLabel = "Акций",
  selected,
  onSelect,
  available,
  unavailableLabel,
  disabled = false,
}: Props) {
  return (
    <div role="radiogroup" aria-label="Компания" className="grid grid-cols-2 gap-2">
      {COMPANY_IDS.map((id) => {
        const isAvailable = available.includes(id);
        const isSelected = selected === id;
        const price = prices?.[id]?.new_price;
        const owned = holder?.stocks?.[id] ?? 0;
        const reason = typeof unavailableLabel === "function" ? unavailableLabel(id) : unavailableLabel;

        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            disabled={disabled || !isAvailable}
            onClick={() => onSelect(id)}
            className={`px-3 py-2 text-left border transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400 disabled:opacity-40 disabled:cursor-not-allowed ${
              isSelected
                ? "border-amber-400"
                : "border-white/20 hover:border-white/40 disabled:hover:border-white/20"
            }`}
          >
            <span className="block text-xs leading-tight text-white/90">{COMPANY_NAMES[id]}</span>
            <span className="mt-1 flex justify-between gap-2 text-xs">
              <span className="text-white/80">{price !== undefined ? money(price) : "—"}</span>
              {holder && <span className="text-white/50">{holderLabel}: {owned}</span>}
            </span>
            {!isAvailable && reason && (
              <span className="block mt-1 text-[10px] leading-tight text-amber-400/80">{reason}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
