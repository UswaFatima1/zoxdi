/**
 * Turns a mastery profile into a concrete next action.
 *
 * The rule is deliberately simple and explainable: in a learning game the
 * student should always know *why* the system chose the next exercise.
 */

import { CONCEPTS, type ConceptId } from "./concepts";
import { emptyMastery, masteryPercent, type ConceptMastery } from "./mastery";

export interface RecommendationLevel {
  id: string;
  chapterId: string;
  order: number;
  conceptIds: ConceptId[];
}

export interface WeakConcept {
  conceptId: ConceptId;
  score: number;
  percent: number;
  attempts: number;
}

export interface LearningRecommendation {
  /** The single exercise the student should do next, if one is available. */
  nextLevelId: string | null;
  focusConcept: ConceptId | null;
  headline: string;
  reason: string;
}

export function weakestConcepts(
  mastery: Partial<Record<ConceptId, ConceptMastery>>,
  options?: { limit?: number; minAttempts?: number },
): WeakConcept[] {
  const limit = options?.limit ?? 3;
  const minAttempts = options?.minAttempts ?? 1;

  return (Object.values(CONCEPTS) as { id: ConceptId }[])
    .map((concept) => {
      const record = mastery[concept.id] ?? emptyMastery(concept.id);
      return {
        conceptId: concept.id,
        score: record.score,
        percent: masteryPercent(record.score),
        attempts: record.attempts,
      };
    })
    .filter((item) => item.attempts >= minAttempts)
    .sort((a, b) => a.score - b.score)
    .slice(0, limit);
}

/**
 * Pick the level that best targets the student's weakest practised concept.
 * Falls back to the earliest incomplete level if nothing has been practised.
 */
export function buildLearningPlan(
  mastery: Partial<Record<ConceptId, ConceptMastery>>,
  levels: RecommendationLevel[],
  completedLevelIds: string[],
): LearningRecommendation {
  const completed = new Set(completedLevelIds);
  const incomplete = [...levels]
    .sort((a, b) => a.order - b.order)
    .filter((level) => !completed.has(level.id));

  if (incomplete.length === 0) {
    return {
      nextLevelId: null,
      focusConcept: null,
      headline: "Every available chapter is complete",
      reason:
        "You have finished the content in this build. Revisit any chapter to keep your mastery sharp, or wait for the next chapter to unlock.",
    };
  }

  const weak = weakestConcepts(mastery, { limit: 5, minAttempts: 1 });
  const weakById = new Map(weak.map((item) => [item.conceptId, item]));

  const targeted = incomplete.find((level) =>
    level.conceptIds.some((conceptId) => weakById.has(conceptId)),
  );

  if (targeted) {
    const focusConcept =
      targeted.conceptIds.find((conceptId) => weakById.has(conceptId)) ?? null;
    const weakRecord = focusConcept ? weakById.get(focusConcept) : undefined;
    return {
      nextLevelId: targeted.id,
      focusConcept,
      headline: focusConcept
        ? `Strengthen ${CONCEPTS[focusConcept].name.toLowerCase()}`
        : "Keep going",
      reason: focusConcept
        ? `Your ${CONCEPTS[focusConcept].name.toLowerCase()} mastery is ${
            weakRecord?.percent ?? 0
          }%. This exercise targets it directly.`
        : "This is the next exercise in your path.",
    };
  }

  const next = incomplete[0];
  return {
    nextLevelId: next.id,
    focusConcept: next.conceptIds[0] ?? null,
    headline: "Continue the campaign",
    reason: "This is the next level in the chapter order.",
  };
}
