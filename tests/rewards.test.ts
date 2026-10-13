import { describe, expect, it } from "vitest";
import { LEVELS } from "@/data/accounting";
import { createEmptyProgress, type ProgressState } from "@/lib/storage/progress";
import { levelRewards, projectCompletion } from "@/lib/learning/rewards";

function withCompleted(ids: string[]): ProgressState {
  return { ...createEmptyProgress(), completedLevelIds: ids };
}

describe("level rewards", () => {
  it("grants the first title and the First Step badge on the very first clear", () => {
    const rewards = levelRewards(withCompleted([]), LEVELS[0].id, 100, 0);
    expect(rewards.title.id).toBe("first-entries");
    expect(rewards.titleUpgraded).toBe(true);
    expect(rewards.badges.map((entry) => entry.badge.id)).toContain("first-step");
  });

  it("unlocks the top title when the last level is cleared", () => {
    const allButLast = LEVELS.slice(0, -1).map((level) => level.id);
    const rewards = levelRewards(withCompleted(allButLast), LEVELS[LEVELS.length - 1].id, 100, 0);
    expect(rewards.title.id).toBe("hero");
    expect(rewards.titleUpgraded).toBe(true);
  });

  it("awards the chapter and tier badges when their last level falls", () => {
    const chapterOne = LEVELS.filter((level) => level.chapterId === "ch1").map((level) => level.id);
    const allButLastOfChapter = chapterOne.slice(0, -1);
    const rewards = levelRewards(
      withCompleted(allButLastOfChapter),
      chapterOne[chapterOne.length - 1],
      100,
      0,
    );
    const ids = rewards.badges.map((entry) => entry.badge.id);
    expect(ids).toContain("chapter-ch1");
  });

  it("grants nothing new on a replay of an already-cleared level", () => {
    const rewards = levelRewards(withCompleted([LEVELS[0].id]), LEVELS[0].id, 0, 0);
    expect(rewards.badges).toHaveLength(0);
    expect(rewards.titleUpgraded).toBe(false);
  });

  it("projects the completion without mutating the original state", () => {
    const original = withCompleted([]);
    const projected = projectCompletion(original, LEVELS[0].id, 120, 1);
    expect(original.completedLevelIds).toHaveLength(0);
    expect(projected.completedLevelIds).toEqual([LEVELS[0].id]);
    expect(projected.xp.total).toBe(120);
    expect(projected.xp.awarded[LEVELS[0].id]).toBe(120);
    expect(projected.stats.hintsUsed).toBe(1);
  });
});
