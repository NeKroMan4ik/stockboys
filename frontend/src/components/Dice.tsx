import { useEffect, useRef, useState } from "react";

const PIPS: Record<number, number[]> = {
  1: [4], 2: [0, 8], 3: [0, 4, 8],
  4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8],
};
const rnd = () => Math.floor(Math.random() * 6) + 1;

type Roll = { id: number; dice: number[] };

function useRollDetector(gameState: any): Roll | null {
  const prev = useRef<any>(null);
  const [roll, setRoll] = useState<Roll | null>(null);

  useEffect(() => {
    const p = prev.current;
    if (p && gameState?.last_dice) {
      const i = p.current_turn_index;
      const moved = p.players[i].current_tile_id !== gameState.players[i].current_tile_id;
      if (moved) {
        const dice = gameState.last_dice;
        setRoll((r) => ({ id: (r?.id ?? 0) + 1, dice }));
      }
    }
    prev.current = gameState;
  }, [gameState]);

  return roll;
}

function Die({ value, rolling }: { value: number; rolling: boolean }) {
  return (
    <div className={`w-12 h-12 grid grid-cols-3 grid-rows-3 p-1.5 rounded-lg bg-white ${rolling ? "dice-shake" : ""}`}>
      {Array.from({ length: 9 }, (_, i) => (
        <div key={i} className="flex items-center justify-center">
          {PIPS[value].includes(i) && <span className="w-2 h-2 rounded-full bg-black" />}
        </div>
      ))}
    </div>
  );
}

export function Dice({ gameState, onDone }: { gameState: any; onDone?: () => void }) {
  const roll = useRollDetector(gameState);

  // show the last known value upon connection
  const initial = gameState?.last_dice ?? [1, 1];
  const [shown, setShown] = useState<number[]>([initial[0], initial[1]]);
  const [rolling, setRolling] = useState(false);

  useEffect(() => {
    if (!roll) return;

    setRolling(true);
    const flicker = setInterval(() => setShown([rnd(), rnd()]), 80);
    const stop = setTimeout(() => {
      clearInterval(flicker);
      setShown([roll.dice[0], roll.dice[1]]); // real values from the backend
      setRolling(false);
      onDone?.();
    }, 900);

    return () => {
      clearInterval(flicker);
      clearTimeout(stop);
    };
  }, [roll?.id]); // only id of the throw

  return (
    <div className="flex gap-3">
      <style>{`
        @keyframes dice-shake {
          0%   { transform: rotate(0deg) translateY(0); }
          25%  { transform: rotate(-15deg) translateY(-6px); }
          50%  { transform: rotate(10deg) translateY(0); }
          75%  { transform: rotate(-8deg) translateY(-4px); }
          100% { transform: rotate(0deg) translateY(0); }
        }
        .dice-shake { animation: dice-shake 0.3s linear infinite; }
      `}</style>
      <Die value={shown[0]} rolling={rolling} />
      <Die value={shown[1]} rolling={rolling} />
    </div>
  );
}