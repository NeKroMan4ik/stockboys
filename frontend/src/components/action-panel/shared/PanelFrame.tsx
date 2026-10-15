import type { ReactNode } from "react";

export function playerLabel(player: any): string {
  return `${player.username} (${player.character})`;
}

type FrameProps = {
  title: string;
  active?: boolean;
  children?: ReactNode;
  secondary?: ReactNode;
  primary?: ReactNode;
};

export function PanelFrame({ title, active = false, children, secondary, primary }: FrameProps) {
  const hasFooter = Boolean(secondary || primary);

  return (
    <section
      className={`h-full flex flex-col bg-[#0d0f14] border ${
        active ? "border-amber-400/60" : "border-white/10"
      }`}
    >
      <header className="px-5 py-3 border-b border-white/10">
        <h2 className={`text-sm font-bold tracking-wide ${active ? "text-amber-400" : "text-white/70"}`}>
          {title}
        </h2>
      </header>

      <div className="flex-1 min-h-0 overflow-auto px-5 py-4 text-sm text-white/70">{children}</div>

      {hasFooter && (
        <footer className="flex items-center justify-between gap-3 px-5 py-3 border-t border-white/10">
          <div>{secondary}</div>
          <div>{primary}</div>
        </footer>
      )}
    </section>
  );
}

type ButtonProps = {
  variant?: "primary" | "secondary";
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
};

export function PanelButton({ variant = "secondary", disabled = false, onClick, children }: ButtonProps) {
  const style =
    variant === "primary"
      ? "bg-amber-400 text-[#0d0f14] font-bold hover:bg-amber-300"
      : "border border-white/20 text-white/80 hover:border-white/40";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`px-4 py-2 text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-white/20 ${style}`}
    >
      {children}
    </button>
  );
}