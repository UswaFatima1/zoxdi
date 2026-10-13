/**
 * The question bank's own types.
 *
 * The bank is a flat, difficulty-labelled pool of unambiguous multiple-choice
 * questions. It is deliberately independent of the campaign levels: a level
 * teaches one idea with a hand-built interaction, while the bank is the wide,
 * repeatable practice surface behind the Drills hub.
 */

import type { ConceptId } from "@/lib/learning/concepts";

export type Difficulty = "easy" | "medium" | "hard" | "expert";

export const DIFFICULTY_ORDER: Difficulty[] = ["easy", "medium", "hard", "expert"];

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
  expert: "Expert",
};

/** Tailwind classes for a difficulty chip. */
export const DIFFICULTY_TONE: Record<Difficulty, string> = {
  easy: "bg-good-soft text-good",
  medium: "bg-gold-soft text-gold-deep",
  hard: "bg-credit-soft text-credit-deep",
  expert: "bg-ink text-paper",
};

export const DIFFICULTY_BLURB: Record<Difficulty, string> = {
  easy: "First principles: classification and the normal side.",
  medium: "Apply the rules to figures you must work through.",
  hard: "Multi-line ledgers, full entries and timing tricks.",
  expert: "Adjustments and the topics professional study loves.",
};

export interface BankOption {
  id: string;
  label: string;
}

export interface BankQuestion {
  id: string;
  /** Human-readable topic, used for filtering and grouping. */
  topic: string;
  difficulty: Difficulty;
  prompt: string;
  options: BankOption[];
  correctOptionId: string;
  explanation: string;
  conceptIds: ConceptId[];
}
