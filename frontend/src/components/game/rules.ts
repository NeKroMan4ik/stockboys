import marketData from "../../../../app/engine/data/market.json";
import type { PlayerState } from "./types";

export const FLOOR_PRICE = 250;
export const MAX_FLOORS_PER_TILE = 5;
export const TOTAL_FLOORS = 16;
export const BASE_RENT_TIERS = [550, 650, 900, 1100, 1500];
export const REFERENCE_PRICE = 1250;
export const BASE_TROPHY_COST = 2000;
export const WIN_NETWORTH = 100000;

export const MARKET_SIZE = (marketData as { companies: { prices: number[] }[] }).companies[0].prices.length;
export const MARKET_MAX = MARKET_SIZE - 1;
export const DUEL_REFUSE_FINE = 500;

export function stockPrice(gameState: any, companyId: string): number | undefined {
  return gameState.price_change?.[companyId]?.new_price;
}

export function rentFor(purchasePrice: number, floors: number): number {
  return Math.round((BASE_RENT_TIERS[floors - 1] * purchasePrice) / REFERENCE_PRICE);
}

export function floorsRemaining(players: PlayerState[]): number {
  const used = players.reduce(
    (sum, p) => sum + p.properties.reduce((s, prop) => s + prop.floors, 0),
    0,
  );
  return TOTAL_FLOORS - used;
}

export function totalTrophies(players: PlayerState[]): number {
  return players.reduce((sum, p) => sum + p.trophies_owned, 0);
}

export function trophyPrice(players: PlayerState[]): number {
  return BASE_TROPHY_COST * (totalTrophies(players) + 1);
}

export function trophyPriceAfterBuy(players: PlayerState[]): number {
  return BASE_TROPHY_COST * (totalTrophies(players) + 2);
}

export const clampPointer = (n: number) => Math.min(Math.max(n, 0), MARKET_MAX);

export function netWorthParts(gameState: any, player: PlayerState, tiles: any[]) {
  const cash = player.cash;

  const shares = Object.entries(player.stocks ?? {}).reduce(
    (sum, [id, amount]) => sum + amount * (stockPrice(gameState, id) ?? 0),
    0,
  );

  const properties = player.properties.reduce(
    (sum, prop) => sum + (tiles.find((t) => t.tile_id === prop.tile_id)?.purchase_price ?? 0),
    0,
  );

  const trophies = player.trophies_owned * trophyPrice(gameState.players);

  return { cash, shares, properties, trophies, total: cash + shares + properties + trophies };
}

export function netWorth(gameState: any, player: PlayerState, tiles: any[]): number {
  return netWorthParts(gameState, player, tiles).total;
}
