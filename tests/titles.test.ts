import { describe, expect, it } from "vitest";
import { LEVELS } from "@/data/accounting";
import { TITLES, nextTitle, titleFor, titleProgress } from "@/lib/learning/titles";

describe("titles", () => {
  it("starts at Newcomer and ends at Accounting Hero", () => {
    expect(titleFor(0).id).toBe("newcomer");
    expect(titleFor(LEVELS.length).id).toBe("hero");
  });

  it("never goes backwards as more levels are cleared", () => {
    let previousIndex = -1;
    for (let count = 0; count <= LEVELS.length; count += 1) {
      const index = TITLES.indexOf(titleFor(count));
      expect(index).toBeGreaterThanOrEqual(previousIndex);
      previousIndex = index;
    }
  });

  it("has a reachable threshold for every title", () => {
    for (const title of TITLES) {
      expect(title.at).toBeLessThanOrEqual(LEVELS.length);
      expect(title.at).toBeGreaterThanOrEqual(0);
    }
  });

  it("reports progress toward the next title, clamped to 0..1", () => {
    for (let count = 0; count <= LEVELS.length; count += 1) {
      const progress = titleProgress(count);
      expect(progress.ratio).toBeGreaterThanOrEqual(0);
      expect(progress.ratio).toBeLessThanOrEqual(1);
    }
    expect(nextTitle(LEVELS.length)).toBeNull();
    expect(titleProgress(LEVELS.length).ratio).toBe(1);
  });
});
