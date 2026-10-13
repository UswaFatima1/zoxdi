/**
 * The Quick Drills behind the daily challenge and the speed round.
 *
 * Every question is *derived* from content that already exists in the
 * curriculum — the multiple-choice levels and the chart of accounts — so the
 * drill can never drift out of step with what the student is being taught.
 * Selection is deterministic from the calendar day, so everyone in a cohort
 * gets the same puzzle on the same day and it changes at midnight.
 */

import { LEVELS, TRANSACTION_BY_ID } from "@/data/accounting";
import { ACCOUNTS } from "@/data/accounting/accounts";
import { findAccount, formatMoney } from "@/lib/accounting/engine";
import { ACCOUNT_TYPE_LABEL, ACCOUNT_TYPES } from "@/lib/accounting/rules";
import type { ConceptId } from "./concepts";

export interface DrillQuestion {
  id: string;
  prompt: string;
  options: { id: string; label: string }[];
  correctOptionId: string;
  explanation: string;
  conceptIds: ConceptId[];
}

export const DAILY_LENGTH = 5;
export const SPEED_LENGTH = 5;
export const SPEED_SECONDS = 60;

export const DAILY_XP_PER_CORRECT = 25;
export const DAILY_XP_COMPLETION = 25;
export const SPEED_XP_PER_CORRECT = 15;

export function dailyXp(correct: number): number {
  return Math.max(0, Math.round(correct)) * DAILY_XP_PER_CORRECT + DAILY_XP_COMPLETION;
}

export function speedXp(correct: number): number {
  return Math.max(0, Math.round(correct)) * SPEED_XP_PER_CORRECT;
}

/** A self-contained prompt for a level that already has options. */
function promptFor(level: (typeof LEVELS)[number]): string {
  if (level.mode === "effect") {
    const transaction = TRANSACTION_BY_ID[level.transactionId];
    return `${transaction?.scenario ?? ""} What happens to the accounting equation?`.trim();
  }
  if (level.mode === "balance") {
    const account = findAccount(ACCOUNTS, level.accountId);
    const debits = level.debits.reduce((sum, value) => sum + value, 0);
    const credits = level.credits.reduce((sum, value) => sum + value, 0);
    return (
      `${account?.name ?? level.accountId} has debits of $` +
      `${formatMoney(debits)} and credits of $${formatMoney(credits)}. ` +
      "What is its closing balance, and on which side?"
    );
  }
  if (level.mode === "quiz") {
    const instruction = level.instruction?.trim() ?? "";
    return instruction.includes("?") ? instruction : `${level.title} ${instruction}`.trim();
  }
  return level.title;
}

/**
 * Every multiple-choice question in the game, plus a "which type is this?"
 * question generated straight from the real chart of accounts.
 */
export function buildDrillPool(): DrillQuestion[] {
  const fromLevels: DrillQuestion[] = [];
  for (const level of LEVELS) {
    if (level.mode !== "effect" && level.mode !== "balance" && level.mode !== "quiz") continue;
    fromLevels.push({
      id: `drill-${level.id}`,
      prompt: promptFor(level),
      options: level.options.map((option) => ({ ...option })),
      correctOptionId: level.correctOptionId,
      explanation: level.explanation,
      conceptIds: level.conceptIds,
    });
  }

  const fromAccounts: DrillQuestion[] = ACCOUNTS.map((account) => ({
    id: `drill-type-${account.id}`,
    prompt: `Which type of account is ${account.name}?`,
    options: ACCOUNT_TYPES.map((type) => ({ id: type, label: ACCOUNT_TYPE_LABEL[type] })),
    correctOptionId: account.type,
    explanation: `${account.name} is ${ACCOUNT_TYPE_LABEL[account.type].toLowerCase()}. ${account.description}`,
    conceptIds: ["account-classification"],
  }));

  return [...fromLevels, ...fromAccounts];
}

/** FNV-1a, so a calendar day maps to a stable seed. */
function hashString(input: string): number {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** A tiny seeded PRNG; the same seed always yields the same sequence. */
function mulberry32(seed: number): () => number {
  let state = seed;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(items: T[], random: () => number): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [copy[index], copy[swap]] = [copy[swap], copy[index]];
  }
  return copy;
}

/** Deterministically choose `count` questions for a seed, shuffling the options. */
export function pickQuestions(
  pool: DrillQuestion[],
  seedKey: string,
  count: number,
): DrillQuestion[] {
  const random = mulberry32(hashString(seedKey));
  const picked = shuffle(pool, random).slice(0, Math.min(count, pool.length));
  return picked.map((question) => ({ ...question, options: shuffle(question.options, random) }));
}

export function dailyQuestions(
  pool: DrillQuestion[],
  dayKey: string,
  count: number = DAILY_LENGTH,
): DrillQuestion[] {
  return pickQuestions(pool, `daily:${dayKey}`, count);
}

export function speedQuestions(
  pool: DrillQuestion[],
  dayKey: string,
  count: number = SPEED_LENGTH,
): DrillQuestion[] {
  return pickQuestions(pool, `speed:${dayKey}`, count);
}

/** Local calendar key (YYYY-MM-DD), matching the streak day. */
export function todayKey(at: number = Date.now()): string {
  const date = new Date(at);
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}
