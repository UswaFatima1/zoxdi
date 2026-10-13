import { describe, expect, it } from "vitest";
import { xpForLevel, rankPlayers, rankMedal } from "@/lib/learning/xp";

describe("xpForLevel", () => {
  it("pays the base plus difficulty bonus", () => {
    const award = xpForLevel({ difficulty: 1, attempts: 2, hintsUsed: 1 });
    expect(award.base).toBe(60);
    expect(award.difficultyBonus).toBe(0);
    expect(award.firstTryBonus).toBe(0);
    expect(award.noHintBonus).toBe(0);
    expect(award.total).toBe(60);
  });

  it("rewards a first-try, hint-free answer at high difficulty", () => {
    const award = xpForLevel({ difficulty: 3, attempts: 1, hintsUsed: 0 });
    expect(award.total).toBe(60 + 40 + 40 + 20);
  });

  it("clamps out-of-range difficulty", () => {
    expect(xpForLevel({ difficulty: 9, attempts: 1, hintsUsed: 0 }).difficultyBonus).toBe(40);
    expect(xpForLevel({ difficulty: 0, attempts: 1, hintsUsed: 0 }).difficultyBonus).toBe(0);
  });
});

describe("rankPlayers", () => {
  it("ranks by XP and marks the current player", () => {
    const ranked = rankPlayers(
      [
        { id: "a", name: "A", initials: "A", xp: 100, masteredLevels: 1 },
        { id: "b", name: "B", initials: "B", xp: 300, masteredLevels: 3 },
      ],
      { id: "you", name: "You", initials: "YO", xp: 200, masteredLevels: 2 },
    );
    expect(ranked.map((player) => player.id)).toEqual(["b", "you", "a"]);
    expect(ranked.find((player) => player.isYou)?.rank).toBe(2);
  });

  it("breaks XP ties by levels mastered", () => {
    const ranked = rankPlayers(
      [{ id: "a", name: "A", initials: "A", xp: 100, masteredLevels: 1 }],
      { id: "you", name: "You", initials: "YO", xp: 100, masteredLevels: 4 },
    );
    expect(ranked[0].id).toBe("you");
  });
});

describe("rankMedal", () => {
  it("returns medals for the podium only", () => {
    expect(rankMedal(1)).toBe("🥇");
    expect(rankMedal(4)).toBe("");
  });
});
