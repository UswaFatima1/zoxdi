/**
 * Mastery tracking.
 *
 * Mastery is a recency-weighted estimate of how well a student understands a
 * concept, built from evidence rather than from time spent. Evidence is
 * strongest when a student answers a *new* variation correctly, on the first
 * attempt, with no hints — and stronger again if they still remember it days
 * later. Guessing and hint-assisted answers count for less.
 */

import { clamp } from "../accounting/engine";
import type { ConceptId } from "./concepts";

export interface AttemptEvidence {
  correct: boolean;
  /** Hints revealed while working on this question. */
  hintsUsed: number;
  /** Which attempt at this question succeeded (1 = first try). */
  attemptsUsed: number;
  /** When the attempt happened, in epoch milliseconds. */
  at: number;
  /** When this concept was last practised before this attempt, if ever. */
  previousPracticedAt?: number | null;
}

export interface ConceptMastery {
  conceptId: ConceptId;
  attempts: number;
  correct: number;
  firstTryCorrect: number;
  hintsUsed: number;
  /** 0..1 estimate of understanding. */
  score: number;
  lastPracticedAt: number | null;
  /** Consecutive correct attempts. */
  streak: number;
}

/** How much weight new evidence carries against the existing estimate. */
const LEARNING_RATE = 0.35;

/** A correct answer this long after the last practice earns a retention bonus. */
const RETENTION_WINDOW_MS = 20 * 60 * 60 * 1000;
const RETENTION_BONUS = 0.15;

export function emptyMastery(conceptId: ConceptId): ConceptMastery {
  return {
    conceptId,
    attempts: 0,
    correct: 0,
    firstTryCorrect: 0,
    hintsUsed: 0,
    score: 0,
    lastPracticedAt: null,
    streak: 0,
  };
}

/** Convert a single attempt into an evidence score in [0, 1]. */
export function evidenceScore(evidence: AttemptEvidence): number {
  if (!evidence.correct) return 0;

  const attempts = Math.max(1, evidence.attemptsUsed);
  const attemptFactor = 1 / attempts; // first try 1.0, second 0.5, third 0.33
  const hintFactor = Math.max(0.4, 1 - 0.2 * Math.max(0, evidence.hintsUsed));

  let score = attemptFactor * hintFactor;

  const previous = evidence.previousPracticedAt ?? null;
  if (previous !== null && evidence.at - previous > RETENTION_WINDOW_MS) {
    score += RETENTION_BONUS;
  }

  // Evidence may slightly exceed 1 to reward retention: proving you remember a
  // concept days later is stronger evidence than a fresh first try. The
  // *mastery score* itself is still clamped to [0, 1] when it is applied.
  return clamp(score, 0, 1.2);
}

/** Fold one attempt into a concept's mastery record. Pure. */
export function applyAttempt(
  mastery: ConceptMastery,
  evidence: AttemptEvidence,
): ConceptMastery {
  const value = evidenceScore(evidence);
  const score = clamp(mastery.score + LEARNING_RATE * (value - mastery.score), 0, 1);

  return {
    ...mastery,
    attempts: mastery.attempts + 1,
    correct: mastery.correct + (evidence.correct ? 1 : 0),
    firstTryCorrect:
      mastery.firstTryCorrect +
      (evidence.correct && evidence.attemptsUsed === 1 && evidence.hintsUsed === 0 ? 1 : 0),
    hintsUsed: mastery.hintsUsed + Math.max(0, evidence.hintsUsed),
    score,
    lastPracticedAt: evidence.at,
    streak: evidence.correct ? mastery.streak + 1 : 0,
  };
}

export function applyAttemptToConcepts(
  mastery: Partial<Record<ConceptId, ConceptMastery>>,
  conceptIds: ConceptId[],
  evidence: Omit<AttemptEvidence, "previousPracticedAt">,
): Partial<Record<ConceptId, ConceptMastery>> {
  const next = { ...mastery };
  for (const conceptId of conceptIds) {
    const current = next[conceptId] ?? emptyMastery(conceptId);
    next[conceptId] = applyAttempt(current, {
      ...evidence,
      previousPracticedAt: current.lastPracticedAt,
    });
  }
  return next;
}

export type MasteryBand = "beginning" | "developing" | "proficient" | "mastered";

export function masteryBand(score: number): MasteryBand {
  if (score >= 0.85) return "mastered";
  if (score >= 0.6) return "proficient";
  if (score >= 0.3) return "developing";
  return "beginning";
}

export const MASTERY_BAND_LABEL: Record<MasteryBand, string> = {
  beginning: "Just starting",
  developing: "Developing",
  proficient: "Proficient",
  mastered: "Mastered",
};

export function masteryPercent(score: number): number {
  return Math.round(clamp(score, 0, 1) * 100);
}
