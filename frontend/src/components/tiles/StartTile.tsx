import { TileFace, type FaceProps } from "./TileFace";

type Direction = "up" | "down" | "left" | "right";

export function StartTile({ colour = "#151820", bumpDirection = "down", vertical = false, ...face }: FaceProps & {
  colour?: string,
  bumpDirection?: Direction,
  vertical?: boolean
}) {
  const bumpClass: Record<Direction, string> = {
    down:  "w-8 h-8 absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full",
    up:    "w-8 h-8 absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full",
    left:  "w-8 h-8 absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full",
    right: "w-8 h-8 absolute right-0 top-1/2 -translate-y-1/2 translate-x-full",
  };

  return (
    <div className={`relative ${vertical ? "w-20 h-14" : "w-14 h-20"}`}>
      {/* main tile */}
      <div
        className="relative w-full h-full border border-white/10"
        style={{ backgroundColor: colour + "22" }}
      >
        <TileFace {...face} />
      </div>

      {/* elongation */}
      <div
        className={`${bumpClass[bumpDirection]} border border-white/10`}
        style={{ backgroundColor: colour + "33" }}
      />
    </div>
  );
}