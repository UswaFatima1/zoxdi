import { describe, expect, it } from "vitest";
import { LEVELS } from "@/data/accounting";
import { BADGES, evaluateBadges, earnedBadgeCount } from "@/lib/learning/badges";
import { createEmptyProgress, type ProgressState } from "@/lib/storage/progress";

const trialLevelId = LEVELS.find((level) => level.mode === "trial")?.id ?? "ch4-01";

function withLevels(state: ProgressState, ids: string[]): ProgressState {
  return { ...state, completedLevelIds: ids };
}

function withResult(
  state: ProgressState,
  levelId: string,
  correct: boolean,
  attempts: number,
  hintsUsed: number,
): ProgressState {
  return {
    ...state,
    levelResults: {
      ...state.levelResults,
      [levelId]: { levelId, correct, attempts, hintsUsed, completedAt: Date.now() },
    },
  };
}

describe("badges", () => {
  it("a fresh profile earns nothing", () => {
    expect(earnedBadgeCount(createEmptyProgress())).toBe(0);
  });

  it("completing one level earns First Step", () => {
    const state = withLevels(createEmptyProgress(), ["ch1-01"]);
    const earned = evaluateBadges(state)
      .filter((entry) => entry.earned)
      .map((entry) => entry.badge.id);
    expect(earned).toContain("first-step");
  });

  it("a completed trial level earns First Balanced Trial Balance", () => {
    const state = withLevels(createEmptyProgress(), [trialLevelId]);
    const entry = evaluateBadges(state).find((item) => item.badge.id === "first-balance");
    expect(entry?.earned).toBe(true);
  });

  it("XP milestones follow the XP ledger", () => {
    const state: ProgressState = {
      ...createEmptyProgress(),
      xp: { total: 1000, awarded: {} },
    };
    const entry = evaluateBadges(state).find((item) => item.badge.id === "xp-1000");
    expect(entry?.earned).toBe(true);
  });

  it("streak bests unlock the fire badges", () => {
    const state: ProgressState = {
      ...createEmptyProgress(),
      streak: { current: 7, best: 12, lastCompletedDay: "2026-10-11" },
    };
    const earned = evaluateBadges(state)
      .filter((entry) => entry.earned)
      .map((entry) => entry.badge.id);
    expect(earned).toContain("streak-3");
    expect(earned).toContain("streak-7");
  });

  it("a first-try, no-hint solve earns Flawless and No Help Needed", () => {
    const state = withResult(
      withLevels(createEmptyProgress(), ["ch1-01"]),
      "ch1-01",
      true,
      1,
      0,
    );
    const earned = evaluateBadges(state)
      .filter((entry) => entry.earned)
      .map((entry) => entry.badge.id);
    expect(earned).toContain("flawless");
    expect(earned).toContain("hint-free");
  });

  it("every badge has a sane progress bar", () => {
    const state = createEmptyProgress();
    for (const entry of evaluateBadges(state)) {
      expect(entry.target).toBeGreaterThan(0);
      expect(entry.ratio).toBeGreaterThanOrEqual(0);
      expect(entry.ratio).toBeLessThanOrEqual(1);
    }
    expect(BADGES.length).toBeGreaterThanOrEqual(10);
  });
});
