import { useEffect, useState } from "react";
import { API } from "../api";
import type { Lobby, PlayerSlot } from "../types";

const MAX_PLAYERS = 4;
const POLL_MS = 2000;

type Props = {
  lobbyId: string;
  character: string;
  onGameStart: (gameId: string) => void;
};

export function WaitingRoom({ lobbyId, character, onGameStart }: Props) {
  const [lobby, setLobby] = useState<Lobby | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let stopped = false;
    let timer: number | undefined;

    const tick = async () => {
      try {
        const res = await fetch(`${API}/lobbies/${lobbyId}`);
        if (!res.ok) {
          setError(res.status === 404 ? "Лобби не найдено или уже закрыто" : "Не удалось загрузить лобби");
          return;
        }
        const data: Lobby = await res.json();
        if (stopped) return;

        setLobby(data);
        setError(null);

        if (data.status === "in_progress" && data.game_id) {
          onGameStart(data.game_id);
          return;
        }
      } catch {
        if (!stopped) setError("Нет связи с сервером");
      }
      if (!stopped) timer = window.setTimeout(tick, POLL_MS);
    };

    tick();
    return () => {
      stopped = true;
      window.clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lobbyId]);

  const isHost = lobby?.host === character;

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(lobbyId);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setError("Не удалось скопировать, выделите текст вручную");
    }
  }

  async function start() {
    setStarting(true);
    setError(null);
    try {
      const res = await fetch(`${API}/lobbies/${lobbyId}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ character }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(typeof body?.detail === "string" ? body.detail : "Не удалось начать игру");
        return;
      }
      const { game_id } = await res.json();
      onGameStart(game_id);
    } catch {
      setError("Нет связи с сервером");
    } finally {
      setStarting(false);
    }
  }

  const slots: (PlayerSlot | null)[] = Array.from(
    { length: MAX_PLAYERS },
    (_, i) => lobby?.players[i] ?? null
  );

  return (
    <div className="min-h-screen bg-[#0e1016] text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">
        <header>
          <h1 className="text-2xl font-semibold">Комната ожидания</h1>
          <p className="mt-1 text-sm text-white/50">
            Отправьте код друзьям, чтобы они присоединились.
          </p>
        </header>

        <section className="space-y-3">
          <p className="text-sm text-white/60">Код лобби</p>
          <div className="rounded-md border border-white/15 bg-white/5 px-4 py-3 font-mono text-sm break-all select-all">
            {lobbyId}
          </div>
          <button
            onClick={copyCode}
            className="w-full rounded-md border border-white/20 px-3 py-2 text-sm hover:bg-white/10"
          >
            {copied ? "Код скопирован" : "Скопировать код"}
          </button>
        </section>

        <section className="space-y-3">
          <p className="text-sm text-white/60">
            Игроки {lobby ? `${lobby.players.length} / ${MAX_PLAYERS}` : ""}
          </p>
          <ul className="space-y-2">
            {slots.map((slot, i) => (
              <li
                key={slot?.character ?? `empty-${i}`}
                className={`flex items-center justify-between rounded-md border px-4 py-3 text-sm ${
                  slot ? "border-white/20 bg-white/5" : "border-dashed border-white/10 text-white/30"
                }`}
              >
                {slot ? (
                  <>
                    <span>
                      {slot.character}
                      {slot.character === character && <span className="text-white/50"> (вы)</span>}
                    </span>
                    <span className="text-white/50">
                      {slot.username}
                      {slot.character === lobby?.host && " · хост"}
                    </span>
                  </>
                ) : (
                  <span>Ожидание игрока</span>
                )}
              </li>
            ))}
          </ul>
        </section>

        {error && <p className="text-sm text-red-400">{error}</p>}

        {isHost ? (
          <button
            onClick={start}
            disabled={starting || !lobby}
            className="w-full rounded-md bg-white py-3 font-medium text-[#0e1016] hover:bg-white/90 disabled:opacity-50"
          >
            {starting ? "Запуск…" : "Начать игру"}
          </button>
        ) : (
          <p className="text-center text-sm text-white/50">Ждём, пока хост начнёт игру</p>
        )}
      </div>
    </div>
  );
}