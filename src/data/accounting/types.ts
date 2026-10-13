import type { EntryLine, Side } from "@/lib/accounting/types";
import type { ConceptId } from "@/lib/learning/concepts";

/** A real-world business event that produces one journal entry. */
export interface Transaction {
  id: string;
  /** The student-facing narrative of what happened. */
  scenario: string;
  amount: number;
  currency: "USD";
  /**
   * The accounts shown in the tray. Deliberately includes plausible
   * distractors so the task is about understanding, not process of elimination.
   */
  accountIds: string[];
  /** The correct journal entry. */
  expected: EntryLine[];
  narration?: string;
  difficulty: 1 | 2 | 3;
}

export type LevelMode =
  | "classify"
  | "forge"
  | "effect"
  | "balance"
  | "trial"
  | "sort"
  | "quiz";

interface LevelBase {
  id: string;
  chapterId: string;
  order: number;
  title: string;
  subtitle: string;
  mode: LevelMode;
  /** Short task instruction shown above the interactive area. */
  instruction?: string;
  /** Concepts this level develops and reports mastery for. */
  conceptIds: ConceptId[];
  /** Misconceptions this level is designed to surface. */
  misconceptionTags: string[];
  /** Progressive hints, revealed one at a time. */
  hints: string[];
  /** Shown after a correct answer to consolidate the idea. */
  explanation: string;
}

/** "Which kind of account is this?" — single choice. */
export interface ClassifyLevel extends LevelBase {
  mode: "classify";
  accountId: string;
}

/** Build the journal entry — the Balance Forge. */
export interface ForgeLevel extends LevelBase {
  mode: "forge";
  transactionId: string;
}

/** "What happened to the accounting equation?" — single choice. */
export interface EffectLevel extends LevelBase {
  mode: "effect";
  transactionId: string;
  options: { id: string; label: string }[];
  correctOptionId: string;
}

/**
 * Balance an account: from the amounts already posted to a single T-account,
 * work out the closing balance and the side it sits on.
 */
export interface BalanceLevel extends LevelBase {
  mode: "balance";
  accountId: string;
  debits: number[];
  credits: number[];
  options: { id: string; label: string }[];
  correctOptionId: string;
}

/**
 * Build a trial balance: place each account's balance in the debit or credit
 * column. Rows arrive with amounts; the student decides the side.
 */
export interface TrialLevel extends LevelBase {
  mode: "trial";
  rows: { accountId: string; amount: number; correctSide: Side }[];
}

/** Sort items into buckets — used for the income statement and balance sheet. */
export interface SortLevel extends LevelBase {
  mode: "sort";
  buckets: { id: string; label: string; hint?: string }[];
  items: { id: string; label: string; bucketId: string }[];
}

/** A plain conceptual multiple-choice question. */
export interface QuizLevel extends LevelBase {
  mode: "quiz";
  options: { id: string; label: string }[];
  correctOptionId: string;
}

export type Level =
  | ClassifyLevel
  | ForgeLevel
  | EffectLevel
  | BalanceLevel
  | TrialLevel
  | SortLevel
  | QuizLevel;

export interface Chapter {
  id: string;
  order: number;
  title: string;
  tagline: string;
  description: string;
  conceptIds: ConceptId[];
  status: "playable" | "upcoming";
  /** Tailwind color token used to theme the chapter. */
  accent: "gold" | "debit" | "credit" | "good" | "ink";
}
