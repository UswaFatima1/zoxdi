import { describe, expect, it } from "vitest";
import {
  applyAttempt,
  applyAttemptToConcepts,
  emptyMastery,
  evidenceScore,
  masteryBand,
} from "@/lib/learning/mastery";

describe("mastery model", () => {
  it("rewards a first-try, no-hint success most", () => {
    const at = 1_700_000_000_000;
    expect(evidenceScore({ correct: true, hintsUsed: 0, attemptsUsed: 1, at })).toBe(1);
  });

  it("discounts hint-assisted success", () => {
    const at = 1_700_000_000_000;
    expect(evidenceScore({ correct: true, hintsUsed: 1, attemptsUsed: 1, at })).toBe(0.8);
    expect(evidenceScore({ correct: true, hintsUsed: 3, attemptsUsed: 2, at })).toBe(0.2);
  });

  it("scores a wrong answer as zero", () => {
    expect(evidenceScore({ correct: false, hintsUsed: 0, attemptsUsed: 1, at: 0 })).toBe(0);
  });

  it("pays a small retention bonus for late correct answers", () => {
    const previous = 1_600_000_000_000;
    const now = previous + 21 * 60 * 60 * 1000;
    const score = evidenceScore({
      correct: true,
      hintsUsed: 0,
      attemptsUsed: 1,
      at: now,
      previousPracticedAt: previous,
    });
    expect(score).toBe(1.15);
  });

  it("moves mastery toward evidence over repeated attempts", () => {
    let mastery = emptyMastery("account-classification");
    const at = 1_700_000_000_000;
    mastery = applyAttempt(mastery, { correct: true, hintsUsed: 0, attemptsUsed: 1, at });
    expect(mastery.score).toBeCloseTo(0.35, 5);
    mastery = applyAttempt(mastery, { correct: true, hintsUsed: 0, attemptsUsed: 1, at });
    expect(mastery.score).toBeCloseTo(0.5775, 5);
    mastery = applyAttempt(mastery, { correct: false, hintsUsed: 0, attemptsUsed: 1, at });
    expect(mastery.score).toBeLessThan(0.5775);
    expect(mastery.streak).toBe(0);
  });

  it("tracks first-try independence and hint usage", () => {
    let mastery = emptyMastery("journal-entries");
    const at = 1_700_000_000_000;
    mastery = applyAttempt(mastery, { correct: true, hintsUsed: 0, attemptsUsed: 1, at });
    mastery = applyAttempt(mastery, { correct: true, hintsUsed: 1, attemptsUsed: 2, at });
    expect(mastery.firstTryCorrect).toBe(1);
    expect(mastery.hintsUsed).toBe(1);
    expect(mastery.attempts).toBe(2);
  });

  it("updates multiple concepts from a single attempt", () => {
    const mastery: Partial<Record<string, never>> = {};
    const updated = applyAttemptToConcepts(
      mastery,
      ["accounting-equation", "journal-entries"],
      { correct: true, hintsUsed: 0, attemptsUsed: 1, at: 1_700_000_000_000 },
    );
    expect(updated["accounting-equation"]?.attempts).toBe(1);
    expect(updated["journal-entries"]?.attempts).toBe(1);
  });

  it("labels bands sensibly", () => {
    expect(masteryBand(0.1)).toBe("beginning");
    expect(masteryBand(0.4)).toBe("developing");
    expect(masteryBand(0.7)).toBe("proficient");
    expect(masteryBand(0.95)).toBe("mastered");
  });
});
