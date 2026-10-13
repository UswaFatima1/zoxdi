/**
 * The game's currency: the popo.
 *
 * Deliberately fictional so the game reads the same everywhere in the world,
 * and so the numbers stay small and friendly. The glyph is a circled P, which
 * renders on every platform without a custom font.
 */

export const POPO = {
  code: "POPO",
  glyph: "\u24C5",
  name: "popo",
  plural: "popo",
} as const;

export interface PopoFormatOptions {
  /** Prefix a "+" or "-" so deltas read clearly. */
  sign?: boolean;
  /** Spell "popo" instead of drawing the glyph. */
  words?: boolean;
}

/** Format an amount of popo, e.g. 1250 -> "Ⓟ1,250". */
export function formatPopo(amount: number, options: PopoFormatOptions = {}): string {
  const rounded = Math.round(amount * 100) / 100;
  const body = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(Math.abs(rounded));
  const prefix = options.sign && rounded > 0 ? "+" : rounded < 0 ? "-" : "";
  return options.words ? `${prefix}${body} popo` : `${prefix}${POPO.glyph}${body}`;
}
