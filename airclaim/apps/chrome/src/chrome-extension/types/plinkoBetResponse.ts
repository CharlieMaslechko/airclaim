export type PlinkoPathElement = "L" | "R";

export interface PlinkoStateResponse {
  path: PlinkoPathElement[];
  point: number;
  risk: string;
  rows: number;
}
export interface PlinkoBetResponse {
  active: string;
  amount: number;
  amountMultiplier: number;
  currency: string;
  game: string;
  id: string;
  payout: number;
  payoutMultiplier: number;
  state: PlinkoStateResponse;
}
