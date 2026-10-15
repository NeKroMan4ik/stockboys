import type { ReactNode } from "react";

export function ChoiceButton({
  selected = false,
  disabled = false,
  onClick,
  children,
}: {
  selected?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onClick}
      className={`w-full px-4 py-3 text-left text-sm border transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400 disabled:opacity-40 disabled:cursor-not-allowed ${
        selected
          ? "border-amber-400 text-white"
          : "border-white/20 text-white/80 hover:border-white/40 disabled:hover:border-white/20"
      }`}
    >
      {children}
    </button>
  );
}
