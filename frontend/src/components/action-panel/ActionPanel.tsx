import { useCallback, useEffect, useState } from "react";

import type { ScreenProps, SendFn } from "../../types";
import { PanelButton, PanelFrame, playerLabel } from "./shared/PanelFrame";
import { BuySharesScreen } from "./screens/BuySharesScreen";
import { DirectionScreen } from "./screens/DirectionScreen";
import { DuelResponseScreen } from "./screens/DuelResponseScreen";
import { RealEstateScreen } from "./screens/RealEstateScreen";
import { RollScreen } from "./screens/RollScreen";
import { ShareholderScreen } from "./screens/ShareholderScreen";
import { TrophyScreen } from "./screens/TrophyScreen";
import { VegasScreen } from "./screens/VegasScreen";
import { WildCardScreen } from "./screens/WildCardScreen";
import { WinScreen } from "./screens/WinScreen";

const SCREENS: Record<string, (props: ScreenProps) => JSX.Element> = {
  waiting_roll: RollScreen,
  waiting_company_buy: BuySharesScreen,
  waiting_real_estate_buy: RealEstateScreen,
  waiting_trophy_buy: TrophyScreen,
  waiting_direction_choice: DirectionScreen,
  waiting_shareholder_roll: ShareholderScreen,
  waiting_card_effect: WildCardScreen,
  waiting_vegas: VegasScreen,
  waiting_duel_response: DuelResponseScreen,
};

const BUSY_TIMEOUT_MS = 5000;

function actingIndex(gameState: any, phase: string): number {
  if (phase === "waiting_duel_response") {
    const target = gameState.pending_duel?.target_index;
    if (typeof target === "number") return target;
  }
  return gameState.current_turn_index;
}

type Props = {
  gameState: any;
  playerName: string;
  tiles: any[];
  send: SendFn;
  onExit: () => void;
};

export function ActionPanel({ gameState, playerName, tiles, send, onExit }: Props) {
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

  const current = gameState.players[gameState.current_turn_index];
  const phase: string = gameState.turn_phase;
  const isMyTurn = gameState.players[actingIndex(gameState, phase)].character === playerName;

  if (gameState.winner_index != null) {
    return <WinScreen gameState={gameState} tiles={tiles} onExit={onExit} />;
  }

  const Screen = SCREENS[phase];
  if (Screen) {
    return <Screen gameState={gameState} tiles={tiles} isMyTurn={isMyTurn} busy={busy} onAction={onAction} />;
  }

  return (
    <PanelFrame
      title={`Фаза: ${phase}`}
      active={isMyTurn}
      primary={
        isMyTurn ? (
          <PanelButton variant="primary" disabled={busy} onClick={() => onAction("pass")}>
            Пропустить
          </PanelButton>
        ) : null
      }
    >
      {isMyTurn
        ? "Экран для этой фазы ещё не готов. Пока её можно только пропустить."
        : `${playerLabel(current)} ходит`}
    </PanelFrame>
  );
}
