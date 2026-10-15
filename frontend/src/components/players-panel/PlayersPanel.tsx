import { useCallback, useEffect, useState } from "react";

import type { SendFn } from "../action-panel/types";
import { PlayerCard } from "./PlayerCard";

const BUSY_TIMEOUT_MS = 5000;

type Props = {
  gameState: any;
  playerName: string;
  tiles: any[];
  send: SendFn;
};

export function PlayersPanel({ gameState, playerName, tiles, send }: Props) {
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setBusy(false);
  }, [gameState]);

  useEffect(() => {
    if (!busy) return;
    const timer = setTimeout(() => setBusy(false), BUSY_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [busy]);

  const onAction = useCallback<SendFn>(
    (action, payload) => {
      setBusy(true);
      send(action, payload);
    },
    [send],
  );

  const gameOver = gameState.winner_index != null;
  const currentIndex: number = gameState.current_turn_index;
  const myTurn = gameState.players[currentIndex]?.character === playerName;

  return (
    <div className="flex flex-col gap-2">
      {gameState.players.map((player: any, i: number) => (
        <PlayerCard
          key={player.character}
          index={i}
          player={player}
          gameState={gameState}
          tiles={tiles}
          isMe={player.character === playerName}
          isActive={i === currentIndex}
          canAct={myTurn && !gameOver}
          busy={busy}
          onAction={onAction}
        />
      ))}
    </div>
  );
}
