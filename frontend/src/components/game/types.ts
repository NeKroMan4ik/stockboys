export type Bet = {
  cash: number;
  trophies: number;
  stocks: { company_id: number; amount: number }[];
};

export type PlayerState = {
  username: string;
  character: string;
  cash: number;
  stocks: Record<string, number>;
  properties: { tile_id: number; floors: number }[];
  trophies_owned: number;
  penalties: { type: string }[];
  is_bankrupt: boolean;
};

export type PriceMap = Record<string, { new_price: number }>;
