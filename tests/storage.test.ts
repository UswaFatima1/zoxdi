import { describe, expect, it } from "vitest";
import {
  advanceStreak,
  createEmptyProgress,
  localDayKey,
  migrateProgress,
} from "@/lib/storage/progress";

describe("progress storage", () => {
  it("creates a sane empty state", () => {
    const progress = createEmptyProgress();
    expect(progress.version).toBe(4);
    expect(progress.completedLevelIds).toEqual([]);
    expect(progress.streak.current).toBe(0);
    expect(progress.profile).toBeNull();
    expect(progress.xp).toEqual({ total: 0, awarded: {} });
    expect(progress.settings.theme).toBe("dark");
    expect(progress.settings.sound).toBe(true);
    expect(progress.daily).toEqual({ lastCompletedDay: null, completions: 0, best: 0 });
    expect(progress.speed).toEqual({ best: 0, plays: 0, lastScore: null });
  });

  it("migrates corrupted data back to a valid state", () => {
    const migrated = migrateProgress("this is not json" as unknown as Record<string, unknown>);
    expect(migrated.completedLevelIds).toEqual([]);
    expect(migrated.settings.urdu).toBe(false);
  });

  it("migrates a null payload to a valid state", () => {
    const migrated = migrateProgress(null);
    expect(migrated.version).toBe(4);
  });

  it("gives an older profile an avatar and a shop name", () => {
    const migrated = migrateProgress({
      profile: { name: "Ayesha Khan", email: "ayesha@gmail.com" },
    } as unknown as Record<string, unknown>);
    expect(migrated.profile?.shopName).toBe("Ayesha's Shop");
    expect(typeof migrated.profile?.avatar).toBe("string");
    expect(migrated.profile?.avatar.length).toBeGreaterThan(0);
  });

  it("keeps a chosen avatar and shop name, and drops a bogus avatar", () => {
    const kept = migrateProgress({
      profile: { name: "Bilal", email: "b@x.com", avatar: "🐼", shopName: "Bilal Traders" },
    } as unknown as Record<string, unknown>);
    expect(kept.profile?.avatar).toBe("🐼");
    expect(kept.profile?.shopName).toBe("Bilal Traders");

    const bogus = migrateProgress({
      profile: { name: "Bilal", email: "b@x.com", avatar: "definitely-not-an-emoji" },
    } as unknown as Record<string, unknown>);
    expect(bogus.profile?.avatar).not.toBe("definitely-not-an-emoji");
  });

  it("migrates new daily and speed fields, dropping malformed ones", () => {
    const migrated = migrateProgress({
      daily: { lastCompletedDay: "2026-10-11", completions: 4, best: 5 },
      speed: { best: "fast", plays: 3, lastScore: 4 },
    } as unknown as Record<string, unknown>);
    expect(migrated.daily).toEqual({
      lastCompletedDay: "2026-10-11",
      completions: 4,
      best: 5,
    });
    expect(migrated.speed).toEqual({ best: 0, plays: 3, lastScore: 4 });
  });

  it("keeps valid fields and drops invalid ones", () => {
    const migrated = migrateProgress({
      version: 1,
      completedLevelIds: [42, "ch1-01", null, "ch1-02"],
      streak: { current: "three", best: 5 },
      settings: { urdu: true, reducedMotion: "no" },
    } as unknown as Record<string, unknown>);
    expect(migrated.completedLevelIds).toEqual(["ch1-01", "ch1-02"]);
    expect(migrated.streak.current).toBe(0);
    expect(migrated.streak.best).toBe(5);
    expect(migrated.settings.urdu).toBe(true);
    expect(migrated.settings.reducedMotion).toBe(false);
    expect(migrated.settings.theme).toBe("dark");
  });

  it("migrates a valid profile and XP, dropping malformed ones", () => {
    const migrated = migrateProgress({
      profile: { name: "  Ayesha Khan ", email: " ayesha@gmail.com ", joinedAt: 5 },
      xp: { total: 320, awarded: { "ch1-01": 120, bad: "x" } },
      settings: { theme: "light" },
    } as unknown as Record<string, unknown>);
    expect(migrated.profile).toMatchObject({
      name: "Ayesha Khan",
      email: "ayesha@gmail.com",
      initials: "AK",
      joinedAt: 5,
    });
    expect(migrated.xp.total).toBe(320);
    expect(migrated.xp.awarded).toEqual({ "ch1-01": 120 });
    expect(migrated.settings.theme).toBe("light");
  });

  it("rejects an invalid theme value", () => {
    const migrated = migrateProgress({
      settings: { theme: "neon" },
    } as unknown as Record<string, unknown>);
    expect(migrated.settings.theme).toBe("dark");
  });

  it("advances a streak across consecutive days and resets after a gap", () => {
    const monday = localDayKey(new Date("2026-10-12T00:00:00").getTime());
    const tuesday = localDayKey(new Date("2026-10-13T00:00:00").getTime());
    const thursday = localDayKey(new Date("2026-10-15T00:00:00").getTime());

    const first = advanceStreak({ current: 0, best: 0, lastCompletedDay: null }, monday);
    expect(first).toMatchObject({ current: 1, best: 1, lastCompletedDay: monday });

    const second = advanceStreak(first, tuesday);
    expect(second).toMatchObject({ current: 2, best: 2 });

    const afterGap = advanceStreak(second, thursday);
    expect(afterGap.current).toBe(1);
    expect(afterGap.best).toBe(2);
  });
});
