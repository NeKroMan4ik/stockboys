import { useEffect, useState } from "react";

type Props = {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  disabled?: boolean;
};

export function QuantityPicker({ value, min, max, onChange, disabled = false }: Props) {
  const [draft, setDraft] = useState(String(value));

  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  const clamp = (n: number) => Math.min(Math.max(Math.trunc(n), min), max);

  const handleInput = (text: string) => {
    const digits = text.replace(/\D/g, "");
    if (digits === "") {
      setDraft("");
      return;
    }
    const next = clamp(Number(digits));
    setDraft(String(next));
    onChange(next);
  };

  const stepClass =
    "w-9 h-9 border border-white/20 text-white/80 hover:border-white/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-white/20";

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        aria-label="Меньше"
        className={stepClass}
        disabled={disabled || value <= min}
        onClick={() => onChange(clamp(value - 1))}
      >
        −
      </button>

      <input
        type="text"
        inputMode="numeric"
        aria-label="Количество"
        value={draft}
        disabled={disabled}
        onChange={(e) => handleInput(e.target.value)}
        onBlur={() => setDraft(String(value))}
        className="w-16 h-9 bg-transparent border border-white/20 text-center text-white focus:border-amber-400 focus:outline-none disabled:opacity-40"
      />

      <button
        type="button"
        aria-label="Больше"
        className={stepClass}
        disabled={disabled || value >= max}
        onClick={() => onChange(clamp(value + 1))}
      >
        +
      </button>

      <button
        type="button"
        className="h-9 px-3 border border-white/20 text-xs text-white/80 hover:border-white/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-white/20"
        disabled={disabled || value >= max}
        onClick={() => onChange(max)}
      >
        Максимум
      </button>
    </div>
  );
}