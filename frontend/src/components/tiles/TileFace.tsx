// Regular tiles, graphically split into 3 parts in 5:11:4: proportion
//   1. dividens or price (if empty)
//   2. name or symbol
//   3. arrows and number

export type FaceProps = {
  name?: string;
  top?: string | null;           // dividends or prices
  market?: number | null;
  arrow?: "left" | "right" | "both" | null;
  symbol?: boolean;              // symbols ($, ★): drawn larger
  rotate?: 0 | 90 | -90;         // rotation
};

function LineArrow({ dir }: { dir: "left" | "right" | "both" }) {
  return (
    <svg
      viewBox="0 0 40 6"
      className="w-8 h-1.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
    >
      <line x1="2" y1="3" x2="38" y2="3" />
      {dir !== "left" && <path d="M34 0.5 L38 3 L34 5.5" />}
      {dir !== "right" && <path d="M6 0.5 L2 3 L6 5.5" />}
    </svg>
  );
}

export function TileFace({
  name = "",
  top = null,
  market = null,
  arrow = null,
  symbol = false,
  rotate = 0,
}: FaceProps) {
  const hasTop = top !== null;

  return (
    <div
      className="absolute left-1/2 top-1/2 grid text-white/50 text-[8px] leading-none"
      style={{
        width: 54,
        height: 78,
        gridTemplateRows: "minmax(0, 5fr) minmax(0, 11fr) minmax(0, 4fr)",
        transform: `translate(-50%, -50%) rotate(${rotate}deg)`,
      }}
    >
      {hasTop && (
        <div
          className="flex items-center justify-center text-white/80"
          style={{ gridRow: 1 }}
        >
          {top}
        </div>
      )}

      <div
        className={`flex items-center justify-center text-center px-0.5 ${
          symbol ? "text-base" : "leading-tight"
        }`}
        style={{ gridRow: hasTop ? "2" : "1 / 3", overflowWrap: "anywhere" }}
      >
        {name}
      </div>

      <div
        className="flex flex-col items-center justify-end gap-px pb-px"
        style={{ gridRow: 3 }}
      >
        {market ? <span>{market > 0 ? `Up ${market}` : `Down ${-market}`}</span> : null}
        {arrow && <LineArrow dir={arrow} />}
      </div>
    </div>
  );
}