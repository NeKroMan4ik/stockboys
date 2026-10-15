import { useEffect, useRef, useState } from "react";
import { API } from "./api";

export function useGame(gameId: string, character: string) {
  const [gameState, setGameState] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!gameId) return;

    let closedByCleanup = false;

    const url = `${API.replace(/^http/, "ws")}/ws/${gameId}?character=${encodeURIComponent(character)}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      setError(null);
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);

      if (msg.type === "state_update") {
        setGameState(msg.game_state);
      } else if (msg.type === "error") {
        setError(msg.error);
      }
    };

    ws.onerror = () => {
      if (!closedByCleanup) setError("Connection error");
    };

    return () => {
      closedByCleanup = true;
      ws.close();
    };
  }, [gameId, character]);

  function send(action: string, payload: Record<string, any> = {}) {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action, payload }));
    }
  }

  return { gameState, error, send };
}