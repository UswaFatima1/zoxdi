/**
 * Deterministic randomness.
 *
 * The live day must *feel* unpredictable and be *provably* identical on every
 * replay, so all randomness comes from a seeded generator. Never Math.random().
 */

export interface Rng {
  /** A float in [0, 1). */
  next(): number;
  /** An integer in [min, max], inclusive. */
  int(min: number, max: number): number;
  pick<T>(items: readonly T[]): T;
}

/** Mulberry32: tiny, fast, and good enough for busywork jitter. */
export function mulberry32(seed: number): Rng {
  let state = seed >>> 0;

  const next = (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  return {
    next,
    int(min, max) {
      if (max <= min) return min;
      return min + Math.floor(next() * (max - min + 1));
    },
    pick(items) {
      if (items.length === 0) throw new Error("rng.pick called with an empty list");
      return items[Math.floor(next() * items.length)];
    },
  };
}

/** Fold any list of parts into a stable 32-bit seed (FNV-1a). */
export function hashSeed(...parts: Array<string | number>): number {
  const joined = parts.join("|");
  let hash = 2166136261;
  for (let i = 0; i < joined.length; i += 1) {
    hash ^= joined.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}
