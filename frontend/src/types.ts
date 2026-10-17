export type SendFn = (action: string, payload?: Record<string, any>) => void;

export type ScreenProps = {
  gameState: any;
  tiles: any[];
  isMyTurn: boolean;
  busy: boolean;
  onAction: SendFn;
};

export type PlayerSlot = {
  username: string;
  character: string;
};

export type Lobby = {
  lobby_id: string;
  host: string;
  players: PlayerSlot[];
  status: "waiting" | "in_progress";
  game_id: string | null;
};