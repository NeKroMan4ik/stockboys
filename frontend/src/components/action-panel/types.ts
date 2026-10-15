export type SendFn = (action: string, payload?: Record<string, any>) => void;

export type ScreenProps = {
  gameState: any;
  tiles: any[];
  isMyTurn: boolean;
  busy: boolean;
  onAction: SendFn;
};
