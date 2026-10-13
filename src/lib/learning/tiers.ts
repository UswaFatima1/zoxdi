/**
 * Difficulty tiers for the campaign.
 *
 * Tiers are derived from a level's position in the arc, so the whole path reads
 * as one difficulty curve from "Starter" to "Expert" without every level having
 * to restate its own rating.
 */

export type LevelTier = "starter" | "easy" | "medium" | "hard" | "expert";

export const TIER_ORDER: LevelTier[] = ["starter", "easy", "medium", "hard", "expert"];

export const TIER_LABEL: Record<LevelTier, string> = {
  starter: "Starter",
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
  expert: "Expert",
};

/** Tailwind classes for a small tier badge. */
export const TIER_TONE: Record<LevelTier, string> = {
  starter: "bg-good-soft text-good",
  easy: "bg-gold-soft text-gold-deep",
  medium: "bg-credit-soft text-credit-deep",
  hard: "bg-debit-soft text-debit-deep",
  expert: "bg-ink text-paper",
};

/** Map a level's 1-based order to a tier. */
export function tierOf(order: number): LevelTier {
  if (order <= 8) return "starter";
  if (order <= 17) return "easy";
  if (order <= 27) return "medium";
  if (order <= 32) return "hard";
  return "expert";
}
