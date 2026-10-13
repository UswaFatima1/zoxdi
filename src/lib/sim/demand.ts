/**
 * How many cups the street buys at a given price.
 *
 * This one function is the whole economics engine. Raise the price and fewer
 * people buy; lower it and more do. Everything a kid learns about pricing comes
 * back to this curve.
 */

export interface DemandInput {
  /** What the cart charges per cup, in popo. */
  unitPrice: number;
  /** The "normal" price of juice on this street. */
  referencePrice: number;
  /** How many people walk past in a day. */
  footTraffic: number;
  /** Price sensitivity. Above 1 means demand is elastic. */
  elasticity: number;
  /** The most cups the cart can physically make in a day. */
  capacity: number;
}

/**
 * Cups sold for the day. Monotonically decreasing in price, clamped to
 * `[0, capacity]`, and never negative.
 */
export function cupsSoldAt(input: DemandInput): number {
  const price = Math.max(1, input.unitPrice);
  const ratio = input.referencePrice / price;
  const raw = input.footTraffic * Math.pow(ratio, input.elasticity);
  return Math.max(0, Math.min(input.capacity, Math.round(raw)));
}
