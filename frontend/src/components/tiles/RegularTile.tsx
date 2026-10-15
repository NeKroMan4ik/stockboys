import { TileFace, type FaceProps } from "./TileFace";

export function RegularTile({ colour = "#151820", vertical = false, ...face }: FaceProps & {
  colour?: string,
  vertical?: boolean   // true for left and right sides
}) {
  return (
    <div
      className={`relative border border-white/10 ${vertical ? "w-20 h-14" : "w-14 h-20"}`}
      style={{ backgroundColor: colour + "22" }}
    >
      <TileFace {...face} />
    </div>
  );
}