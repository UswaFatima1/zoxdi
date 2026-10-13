/**
 * Stage One of the campaign: Days 1 to 8.
 *
 * The ladder is built from four dials turned at once — events per day, new
 * concepts, how much the Impact HUD gives away, and how long the day lasts.
 * Stage One turns the first two gently.
 */

import type { CostCategory } from "@/lib/sim/types";

export interface TierCost {
  label: string;
  category: CostCategory;
  /** The same every day, whatever you sell. */
  fixed?: number;
  /** Multiplied by the cups actually made. */
  perUnit?: number;
}

export interface TierConfig {
  id: string;
  /** Kid-facing name for the chapter of the story. */
  label: string;
  /** One line describing what is new. */
  blurb: string;
  /** Which days of the campaign this tier covers. */
  days: number[];
  /** How long the live day runs, in seconds. */
  lengthSeconds: number;
  unitPrice: number;
  referencePrice: number;
  elasticity: number;
  footTraffic: number;
  capacity: number;
  costs: TierCost[];
  /** What the Impact HUD is allowed to give away on these days. */
  scaffold: "full" | "accounts" | "none";
}

export const STARTING_CAPITAL = 500;

/** Days 1-3 — one thing happens: somebody buys juice. */
export const TIER_0: TierConfig = {
  id: "tier-0",
  label: "Just Sell",
  blurb: "Customers arrive. Every sale makes the cart a little heavier.",
  days: [1, 2, 3],
  lengthSeconds: 240,
  unitPrice: 10,
  referencePrice: 10,
  elasticity: 1.4,
  footTraffic: 22,
  capacity: 60,
  costs: [],
  scaffold: "full",
};

/** Days 4-8 — the cart starts costing money just to keep open. */
export const TIER_1: TierConfig = {
  id: "tier-1",
  label: "The Bills",
  blurb: "Ice and fruit cost more the more you sell. The lights and the pitch cost the same either way.",
  days: [4, 5, 6, 7, 8],
  lengthSeconds: 300,
  unitPrice: 10,
  referencePrice: 10,
  elasticity: 1.4,
  footTraffic: 30,
  capacity: 80,
  costs: [
    { label: "Ice and fruit", category: "ingredients", perUnit: 3 },
    { label: "The electricity bill", category: "utilities", fixed: 12 },
    { label: "The pitch fee", category: "standing", fixed: 8 },
  ],
  scaffold: "full",
};

export const TIERS: TierConfig[] = [TIER_0, TIER_1];

/** Stage One covers the first eight days. */
export const STAGE_ONE_DAYS: number[] = [1, 2, 3, 4, 5, 6, 7, 8];

export function tierForDay(day: number): TierConfig | null {
  return TIERS.find((tier) => tier.days.includes(day)) ?? null;
}
