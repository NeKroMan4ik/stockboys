export const TOKEN_COLORS = [
  "bg-red-500",
  "bg-blue-500",
  "bg-green-500",
  "bg-yellow-400",
];

export const TOKEN_HEX = ["#ef4444", "#3b82f6", "#22c55e", "#facc15"];

export const tokenColor = (index: number): string => TOKEN_COLORS[index % TOKEN_COLORS.length];
export const tokenHex = (index: number): string => TOKEN_HEX[index % TOKEN_HEX.length];
