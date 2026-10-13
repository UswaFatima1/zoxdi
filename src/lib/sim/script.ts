/** Turning a seed and a tier into one day on the street. */

import type { CustomerType, DayEvent, DayScript } from "./types";
import { cupsSoldAt } from "./demand";
import { hashSeed, mulberry32 } from "./rng";
import type { TierConfig } from "@/data/campaign/tiers";

const CUSTOMERS: readonly CustomerType[] = ["kid", "worker", "family", "regular"];

/** How far into the day each cost lands, as a fraction of the day. */
const COST_AT: Record<string, number> = {
  ingredients: 0.03,
  utilities: 0.55,
  standing: 0.97,
};

/** The seed for a specific day of a specific campaign. */
export function daySeed(campaignSeed: number, day: number): number {
  return hashSeed(campaignSeed, `day-${day}`);
}

/**
 * Build the day. Pure: the same seed and tier always produce the same script,
 * which is what makes the reconcile phase gradeable and the day replayable.
 */
export function generateDay(campaignSeed: number, day: number, tier: TierConfig): DayScript {
  const rng = mulberry32(daySeed(campaignSeed, day));
  const lengthSeconds = tier.lengthSeconds;
  const events: DayEvent[] = [];

  // Word of mouth: some days the street is busier than others. Seeded, so the
  // variation is real but the day is still reproducible.
  const buzz = 0.8 + rng.next() * 0.4;

  const cups = cupsSoldAt({
    unitPrice: tier.unitPrice,
    referencePrice: tier.referencePrice,
    footTraffic: tier.footTraffic * buzz,
    elasticity: tier.elasticity,
    capacity: tier.capacity,
  });

  // Split the day's cups across walk-up customers, one or two cups each.
  const unitsPerCustomer: number[] = [];
  let remaining = cups;
  while (remaining > 0) {
    const units = remaining >= 2 && rng.next() < 0.35 ? 2 : 1;
    unitsPerCustomer.push(units);
    remaining -= units;
  }

  // Averaging two draws clusters arrivals around the middle of the day.
  const arrivals = unitsPerCustomer
    .map(() => (rng.next() + rng.next()) / 2)
    .sort((a, b) => a - b);

  unitsPerCustomer.forEach((units, index) => {
    events.push({
      kind: "sale",
      at: Math.round(lengthSeconds * (0.05 + 0.9 * arrivals[index])),
      customer: rng.pick(CUSTOMERS),
      units,
      unitPrice: tier.unitPrice,
      paid: "cash",
    });
  });

  // Fixed costs, plus ingredient cost that grows with the cups actually made.
  for (const cost of tier.costs) {
    const amount = Math.round((cost.fixed ?? 0) + (cost.perUnit ?? 0) * cups);
    if (amount <= 0) continue;
    events.push({
      kind: "cost",
      at: Math.round(lengthSeconds * (COST_AT[cost.category] ?? 0.5)),
      label: cost.label,
      category: cost.category,
      amount,
    });
  }

  events.sort((a, b) => a.at - b.at);

  return {
    seed: daySeed(campaignSeed, day),
    day,
    tierId: tier.id,
    tierLabel: tier.label,
    lengthSeconds,
    unitPrice: tier.unitPrice,
    plannedCups: cups,
    events,
  };
}
