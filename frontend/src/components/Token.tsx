import { useLayoutEffect, useRef } from "react";

import { tokenColor } from "./game/tokenColors";

const TOKEN_SIZE = 16;      // w-4 h-4
const STEP_MS = 140;        // время на одну клетку пути
const MAX_WALK = 12;        // максимум клеток за ход (2 кубика); дальше — прыжок (например, банкротство)

export type Point = { x: number; y: number };

type Props = {
  index: number;        // индекс игрока в state.players
  username: string;
  character: string;
  tileId: number;       // текущая клетка
  offsetX: number;      // смещение, если на клетке стоит несколько фишек
  centers: Point[];     // центры клеток в координатах доски, индекс = tile_id
};

// Клетки, через которые фишка идёт от from к to, по кратчайшему пути.
// null — слишком далеко для обычного хода, тогда фишка переезжает напрямую.
function walkPath(from: number, to: number, total: number): number[] | null {
  const forward = (to - from + total) % total;
  const backward = total - forward;
  const len = Math.min(forward, backward);

  if (len === 0) return [];
  if (len > MAX_WALK) return null;

  const dir = forward <= backward ? 1 : -1;
  const path: number[] = [];
  for (let s = 1; s <= len; s++) {
    path.push((from + dir * s + total) % total);
  }
  return path;
}

export function Token({ index, username, character, tileId, offsetX, centers }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const last = useRef<{ tile: number; pos: Point } | null>(null);
  const centersRef = useRef(centers);
  centersRef.current = centers;

  const target: Point = {
    x: centers[tileId].x - TOKEN_SIZE / 2 + offsetX,
    y: centers[tileId].y - TOKEN_SIZE / 2,
  };

  useLayoutEffect(() => {
    const el = ref.current;
    const prev = last.current;
    last.current = { tile: tileId, pos: target };

    // первая отрисовка — без анимации
    if (!el || !prev) return;
    if (prev.pos.x === target.x && prev.pos.y === target.y) return;

    const cs = centersRef.current;
    const path = walkPath(prev.tile, tileId, cs.length);

    // промежуточные клетки (последняя — это target)
    const middle: Point[] = (path ?? []).slice(0, -1).map((t) => ({
      x: cs[t].x - TOKEN_SIZE / 2,
      y: cs[t].y - TOKEN_SIZE / 2,
    }));

    const points = [prev.pos, ...middle, target];
    const duration = path ? Math.max(250, path.length * STEP_MS) : 500;

    // ease-in-out на весь путь: медленный старт, быстрая середина, плавная остановка
    const anim = el.animate(
      points.map((p) => ({ transform: `translate(${p.x}px, ${p.y}px)` })),
      { duration, easing: "ease-in-out" }
    );

    return () => anim.cancel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tileId, target.x, target.y]);

  return (
    <div
      ref={ref}
      className="group absolute left-0 top-0 pointer-events-auto"
      style={{ transform: `translate(${target.x}px, ${target.y}px)` }}
    >
      <div
        className={`w-4 h-4 rounded-full border-2 border-white shadow ${tokenColor(index)}`}
      />
      <div
        className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1
                   hidden group-hover:block whitespace-nowrap z-50
                   rounded bg-black/90 border border-white/20 px-2 py-1 text-[11px] text-white"
      >
        ({username}) {character}
      </div>
    </div>
  );
}