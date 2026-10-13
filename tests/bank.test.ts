import { describe, expect, it } from "vitest";
import {
  BANK_SIZE,
  QUESTION_BANK,
  countByDifficulty,
  drawQuestions,
} from "@/lib/questions/bank";

describe("question bank", () => {
  it("offers well over five hundred questions", () => {
    expect(BANK_SIZE).toBeGreaterThanOrEqual(500);
  });

  it("gives every question a unique id", () => {
    const ids = QUESTION_BANK.map((question) => question.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("gives every question a real prompt and a correct option that exists", () => {
    for (const question of QUESTION_BANK) {
      expect(question.prompt.trim().length, question.id).toBeGreaterThan(8);
      const ids = question.options.map((option) => option.id);
      expect(new Set(ids).size, question.id).toBe(ids.length);
      // "Which side?" questions offer two options; most offer four, and
      // classification offers all five account types.
      expect(ids.length, question.id).toBeGreaterThanOrEqual(2);
      // Classification offers all five account types; every other question
      // offers the usual four (or three) options.
      expect(ids.length, question.id).toBeLessThanOrEqual(5);
      expect(
        question.options.some((option) => option.id === question.correctOptionId),
        `correct option present: ${question.id}`,
      ).toBe(true);
      expect(question.explanation.trim().length, question.id).toBeGreaterThan(10);
    }
  });

  it("never gives two identical options in one question", () => {
    for (const question of QUESTION_BANK) {
      const labels = question.options.map((option) => option.label.trim());
      expect(new Set(labels).size, question.id).toBe(labels.length);
    }
  });

  it("states the figures whenever the answer is itself an amount", () => {
    // Same ambiguity guard the drills carry: a bare money answer is only fair
    // if the prompt actually supplies the numbers to work from.
    for (const question of QUESTION_BANK) {
      const correct = question.options.find(
        (option) => option.id === question.correctOptionId,
      );
      if (correct && /^\$[\d,]/.test(correct.label.trim())) {
        expect(/\$\s?\d/.test(question.prompt), `prompt states amounts: ${question.id}`).toBe(true);
      }
    }
  });

  it("spreads across all four difficulty tiers", () => {
    const counts = countByDifficulty();
    for (const difficulty of ["easy", "medium", "hard", "expert"] as const) {
      expect(counts[difficulty], difficulty).toBeGreaterThan(10);
    }
  });

  it("draws a deterministic, filtered run", () => {
    const first = drawQuestions({ difficulty: "hard", count: 8, seed: "t" });
    const second = drawQuestions({ difficulty: "hard", count: 8, seed: "t" });
    expect(first.map((question) => question.id)).toEqual(second.map((question) => question.id));
    expect(first.length).toBe(8);
    expect(first.every((question) => question.difficulty === "hard")).toBe(true);
  });
});
