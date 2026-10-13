import { describe, expect, it } from "vitest";
import {
  DAILY_LENGTH,
  SPEED_LENGTH,
  SPEED_SECONDS,
  buildDrillPool,
  dailyQuestions,
  dailyXp,
  speedQuestions,
  speedXp,
} from "@/lib/learning/drill";

describe("quick drills", () => {
  it("builds a pool from real curriculum content", () => {
    const pool = buildDrillPool();
    expect(pool.length).toBeGreaterThanOrEqual(20);
    for (const question of pool) {
      expect(question.prompt.length).toBeGreaterThan(0);
      expect(question.options.some((option) => option.id === question.correctOptionId)).toBe(true);
    }
  });

  it("never asks for a dollar figure without stating one", () => {
    // When the correct answer is itself a dollar figure, the prompt must supply
    // the numbers to work from — the bug that made "Which side wins?" and the
    // balance drills ambiguous. (An amount mentioned *inside* an option, like a
    // one-sided entry of $5,000, is illustrative and needs no prompt figure.)
    const pool = buildDrillPool();
    for (const question of pool) {
      const correct = question.options.find((option) => option.id === question.correctOptionId);
      const answerIsAnAmount = correct ? /^\s*\$\s?\d/.test(correct.label) : false;
      if (answerIsAnAmount) {
        expect(/\$\s?\d/.test(question.prompt), `prompt must state amounts: ${question.id}`).toBe(
          true,
        );
      }
    }
  });

  it("picks the same set for the same day", () => {
    const pool = buildDrillPool();
    const first = dailyQuestions(pool, "2026-10-11");
    const second = dailyQuestions(pool, "2026-10-11");
    expect(first).toHaveLength(DAILY_LENGTH);
    expect(first.map((question) => question.id)).toEqual(second.map((question) => question.id));
  });

  it("changes the set from one day to the next", () => {
    const pool = buildDrillPool();
    const monday = dailyQuestions(pool, "2026-10-12");
    const tuesday = dailyQuestions(pool, "2026-10-13");
    expect(monday.map((question) => question.id).join(",")).not.toBe(
      tuesday.map((question) => question.id).join(","),
    );
  });

  it("shuffles options without losing the correct answer", () => {
    const pool = buildDrillPool();
    for (const question of speedQuestions(pool, "2026-10-11")) {
      expect(new Set(question.options.map((option) => option.id)).size).toBe(
        question.options.length,
      );
      expect(
        question.options.some((option) => option.id === question.correctOptionId),
      ).toBe(true);
    }
  });

  it("has sensible XP curves and timing", () => {
    expect(dailyXp(0)).toBe(25);
    expect(dailyXp(5)).toBe(150);
    expect(speedXp(0)).toBe(0);
    expect(speedXp(5)).toBe(75);
    expect(SPEED_LENGTH).toBe(5);
    expect(SPEED_SECONDS).toBe(60);
  });
});
