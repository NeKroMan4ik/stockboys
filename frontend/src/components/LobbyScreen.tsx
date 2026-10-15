import { useEffect, useState, type ReactNode } from "react";
import { API } from "../api";
import type { Lobby } from "../types";

const CHARACTERS = ["Johnny Mustard", "Burl Cutterback", "Tripp Dunwhistle", "Joe Sixpack"];
const MAX_PLAYERS = 4;
const POLL_MS = 3000;

type Props = {
  onEnter: (lobbyId: string, character: string) => void;
  footer?: ReactNode;
};

export function LobbyScreen({ onEnter, footer }: Props) {
  const [name, setName] = useState("");
  const [character, setCharacter] = useState(CHARACTERS[0]);
  const [lobbyCode, setLobbyCode] = useState("");
  const [lobbies, setLobbies] = useState<Lobby[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // lobby list is updated once every 3 seconds
  useEffect(() => {
    let stopped = false;
    let timer: number | undefined;

    const tick = async () => {
      try {
        const res = await fetch(`${API}/lobbies`);
        if (res.ok && !stopped) setLobbies(await res.json());
      } catch {
      }
      if (!stopped) timer = window.setTimeout(tick, POLL_MS);
    };

    tick();
    return () => {
      stopped = true;
      window.clearTimeout(timer);
    };
  }, []);

  const trimmedName = name.trim();
  const waiting = (lobbies ?? []).filter((l) => l.status === "waiting");

  async function post(url: string): Promise<Response | null> {
    setError(null);
    setBusy(true);
    try {
      return await fetch(`${API}${url}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slot: { username: trimmedName, character } }),
      });
    } catch {
      setError("Нет связи с сервером");
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function createLobby() {
    if (!trimmedName) return setError("Введите имя");
    const res = await post("/lobbies");
    if (!res) return;
    if (!res.ok) return setError("Не удалось создать лобби");
    const { lobby_id } = await res.json();
    onEnter(lobby_id, character);
  }

  async function joinLobby(id: string) {
    if (!trimmedName) return setError("Введите имя");
    const res = await post(`/lobbies/${id}/join`);
    if (!res) return;
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      return setError(typeof body?.detail === "string" ? body.detail : "Не удалось войти в лобби");
    }
    onEnter(id, character);
  }

  function joinByCode() {
    if (!lobbyCode.trim()) return setError("Введите код лобби");
    joinLobby(lobbyCode.trim());
  }

  return (
    <div className="min-h-screen bg-[#0e1016] text-white flex justify-center p-6">
      <div className="w-full max-w-lg space-y-8">
        <h1 className="text-2xl font-semibold">Stockboys</h1>

        <section className="space-y-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ваше имя"
            className="w-full rounded-md border border-white/20 bg-transparent px-3 py-2 text-sm placeholder:text-white/30"
          />
          <select
            value={character}
            onChange={(e) => setCharacter(e.target.value)}
            className="w-full rounded-md border border-white/20 bg-[#0e1016] px-3 py-2 text-sm"
          >
            {CHARACTERS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <button
            onClick={createLobby}
            disabled={busy}
            className="w-full rounded-md bg-white py-2.5 text-sm font-medium text-[#0e1016] hover:bg-white/90 disabled:opacity-50"
          >
            Создать лобби
          </button>
        </section>

        <section className="space-y-3">
          <p className="text-sm text-white/60">Открытые лобби</p>

          {lobbies === null && <p className="text-sm text-white/40">Загрузка…</p>}
          {lobbies !== null && waiting.length === 0 && (
            <p className="text-sm text-white/40">Открытых лобби нет. Создайте своё.</p>
          )}

          <ul className="space-y-2">
            {waiting.map((l) => {
              const host = l.players.find((p) => p.character === l.host);
              const full = l.players.length >= MAX_PLAYERS;
              const taken = l.players.some((p) => p.character === character);

              let hint = "";
              if (full) hint = "Лобби заполнено";
              else if (taken) hint = "Персонаж занят";

              return (
                <li
                  key={l.lobby_id}
                  className="flex items-center justify-between gap-3 rounded-md border border-white/15 bg-white/5 px-4 py-3"
                >
                  <div className="min-w-0 text-sm">
                    <p className="truncate">Лобби {host?.username ?? l.host}</p>
                    <p className="truncate text-white/50">
                      {l.players.length} / {MAX_PLAYERS} · {l.players.map((p) => p.character).join(", ")}
                    </p>
                  </div>
                  <button
                    onClick={() => joinLobby(l.lobby_id)}
                    disabled={busy || full || taken}
                    title={hint}
                    className="shrink-0 rounded-md border border-white/20 px-3 py-1.5 text-sm hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-transparent"
                  >
                    {hint || "Войти"}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="space-y-3">
          <p className="text-sm text-white/60">Войти по коду</p>
          <div className="flex gap-2">
            <input
              value={lobbyCode}
              onChange={(e) => setLobbyCode(e.target.value)}
              placeholder="Код лобби"
              className="min-w-0 flex-1 rounded-md border border-white/20 bg-transparent px-3 py-2 font-mono text-sm placeholder:font-sans placeholder:text-white/30"
            />
            <button
              onClick={joinByCode}
              disabled={busy}
              className="rounded-md border border-white/20 px-4 py-2 text-sm hover:bg-white/10 disabled:opacity-50"
            >
              Войти
            </button>
          </div>
        </section>

        {error && <p className="text-sm text-red-400">{error}</p>}

        {footer}
      </div>
    </div>
  );
}