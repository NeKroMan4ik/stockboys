export function CornerTile({ name = "", colour = "#151820", market = null, arrow = null }: {
  name?: string,
  colour?: string,
  market?: number | null,       // positive: — Up, negative: — Down
  arrow?: string | null         // ↑ ↓ ← →
}) {
  return (
    <div
      className="relative w-20 h-20 border border-white/10 overflow-hidden text-white/50"
      style={{ backgroundColor: colour + "22" }}
    >
      <div
        className="absolute left-1/2 w-18 text-center text-[9px] leading-tight"
        style={{ top: "40%", transform: "translate(-50%, -50%) rotate(-45deg)" }}
      >
        {name}
      </div>

      <div className="absolute bottom-1 left-0 right-0 flex flex-col items-center leading-none text-[8px]">
        {market ? <span>{market > 0 ? `Up ${market}` : `Down ${-market}`}</span> : null}
        {arrow && <span className="text-sm mt-0.5">{arrow}</span>}
      </div>
    </div>
  );
}