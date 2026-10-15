export type Side = "right" | "top" | "left" | "bottom";

export function locate(tileId: number, n: number): { side: Side; isCorner: boolean; row: number; col: number } {
  const grid = n + 1;
  const sideIndex = Math.floor(tileId / n);
  const offset = tileId % n;
  const isCorner = offset === 0;

  switch (sideIndex) {
    case 0:  return { side: "right",  isCorner, row: grid - offset, col: grid };
    case 1:  return { side: "top",    isCorner, row: 1,            col: grid - offset };
    case 2:  return { side: "left",   isCorner, row: 1 + offset,   col: 1 };
    default: return { side: "bottom", isCorner, row: grid,         col: 1 + offset };
  }
}

export function moveArrow(direction: number, side: Side): "left" | "right" {
  return (direction === 1) !== (side === "top") ? "right" : "left";
}

export type ScreenDirection = "up" | "down" | "left" | "right";

const FORWARD: Record<Side, ScreenDirection> = { right: "up", top: "left", left: "down", bottom: "right" };
const OPPOSITE: Record<ScreenDirection, ScreenDirection> = { up: "down", down: "up", left: "right", right: "left" };


export function screenDirection(direction: number, side: Side): ScreenDirection {
  return direction === 1 ? FORWARD[side] : OPPOSITE[FORWARD[side]];
}
