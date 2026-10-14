import { describe, expect, it } from "vitest";
import {
  browserStorage,
  challengeUrl,
  chasePercent,
  cleanName,
  clearChallenge,
  hasPassed,
  parseChallenge,
  readChallenge,
  saveChallenge,
  shareText,
  standingLine,
  type ChallengeStorage,
} from "@/lib/share/share";

/** A tiny in-memory stand-in for localStorage. */
function fakeStorage(seed: Record<string, string> = {}): ChallengeStorage & { dump(): Record<string, string> } {
  const data = { ...seed };
  return {
    getItem: (key) => (key in data ? data[key] : null),
    setItem: (key, value) => {
      data[key] = value;
    },
    removeItem: (key) => {
      delete data[key];
    },
    dump: () => data,
  };
}

describe("challenge links", () => {
  it("reads a name, an XP score and a level count from the query", () => {
    const challenge = parseChallenge("?challenge=Ayesha%20Khan&xp=1240&lv=13", 7);
    expect(challenge).toEqual({ name: "Ayesha Khan", xp: 1240, levels: 13, at: 7 });
  });

  it("ignores a link with no name on it", () => {
    expect(parseChallenge("?xp=900")).toBeNull();
    expect(parseChallenge("")).toBeNull();
  });

  it("survives junk numbers instead of crashing", () => {
    const challenge = parseChallenge("?challenge=Sam&xp=abc&lv=-4");
    expect(challenge?.xp).toBe(0);
    expect(challenge?.levels).toBe(0);
  });

  it("caps a very long name", () => {
    const long = "a".repeat(120);
    expect(cleanName(long)).toHaveLength(40);
  });

  it("drops control characters and collapses spaces", () => {
    expect(cleanName("  Emma \u0000  Wilson \n")).toBe("Emma Wilson");
  });

  it("builds a link that goes straight to the welcome screen", () => {
    const url = challengeUrl({ name: "Emma Wilson", xp: 985, levels: 9 });
    expect(url.startsWith("https://zoxdi.pages.dev/login/?")).toBe(true);
    const parsed = parseChallenge(url.slice(url.indexOf("?")));
    expect(parsed).toMatchObject({ name: "Emma Wilson", xp: 985, levels: 9 });
  });

  it("builds a link that works from any host", () => {
    const url = challengeUrl({ name: "Alex", xp: 10, levels: 1 }, "http://localhost:4173/");
    expect(url.startsWith("http://localhost:4173/login/?")).toBe(true);
  });

  it("names the sender when a link carries no name", () => {
    const url = challengeUrl({ name: "   ", xp: 0, levels: 0 });
    expect(url).toContain("challenge=A+friend");
  });
});

describe("challenge storage", () => {
  it("round-trips a challenge", () => {
    const storage = fakeStorage();
    saveChallenge(storage, { name: "Priya Nair", xp: 720, levels: 6, at: 5 });
    expect(readChallenge(storage)).toEqual({ name: "Priya Nair", xp: 720, levels: 6, at: 5 });
  });

  it("reads nothing from an empty storage", () => {
    expect(readChallenge(fakeStorage())).toBeNull();
    expect(readChallenge(null)).toBeNull();
  });

  it("ignores a corrupted blob", () => {
    expect(readChallenge(fakeStorage({ "zoxdi.challenge.v1": "{not json" }))).toBeNull();
  });

  it("clears the challenge", () => {
    const storage = fakeStorage();
    saveChallenge(storage, { name: "Alex", xp: 100, levels: 2, at: 1 });
    clearChallenge(storage);
    expect(readChallenge(storage)).toBeNull();
  });

  it("does nothing when storage is unavailable", () => {
    expect(() => saveChallenge(null, { name: "Alex", xp: 1, levels: 1, at: 1 })).not.toThrow();
    expect(() => clearChallenge(null)).not.toThrow();
  });

  it("survives a storage that refuses to write", () => {
    const hostile: ChallengeStorage = {
      getItem: () => null,
      setItem: () => {
        throw new Error("quota");
      },
      removeItem: () => {
        throw new Error("blocked");
      },
    };
    expect(() => saveChallenge(hostile, { name: "Alex", xp: 1, levels: 1, at: 1 })).not.toThrow();
    expect(() => clearChallenge(hostile)).not.toThrow();
  });

  it("has no storage on the server", () => {
    expect(browserStorage()).toBeNull();
  });
});

describe("standing against a challenge", () => {
  const challenge = { name: "Sofia Rossi", xp: 1000, levels: 10, at: 0 };

  it("counts how far along the climb is", () => {
    expect(chasePercent(challenge, 250)).toBe(25);
    expect(chasePercent(challenge, 4000)).toBe(100);
    expect(chasePercent({ ...challenge, xp: 0 }, 0)).toBe(100);
  });

  it("only calls it passed on a higher score", () => {
    expect(hasPassed(challenge, 1001)).toBe(true);
    expect(hasPassed(challenge, 1000)).toBe(false);
    expect(hasPassed({ ...challenge, xp: 0 }, 0)).toBe(false);
  });

  it("explains the gap, the tie and the win", () => {
    expect(standingLine(challenge, 600)).toBe("400 XP to pass Sofia Rossi (1,000 XP).");
    expect(standingLine(challenge, 1000)).toContain("Level with Sofia Rossi");
    expect(standingLine(challenge, 1200)).toBe("You passed Sofia Rossi (1,000 XP).");
    expect(standingLine({ ...challenge, xp: 0 }, 0)).toContain("dared you");
  });
});

describe("share messages", () => {
  it("names the level that was just cleared", () => {
    const text = shareText({
      name: "Ayesha Khan",
      xp: 1240,
      levels: 13,
      levelLabel: "Level 12",
      url: "https://zoxdi.pages.dev/login/?challenge=Ayesha",
    });
    expect(text).toContain("Ayesha Khan just mastered Level 12 on Zoxdi.");
    expect(text).toContain("1,240 XP and 13 levels done. Free, no ads.");
    expect(text).toContain("Beat that: https://zoxdi.pages.dev/login/?challenge=Ayesha");
  });

  it("falls back to a general line when no level is named", () => {
    const text = shareText({ name: "Sam", xp: 20, levels: 1, url: "https://zoxdi.pages.dev" });
    expect(text).toContain("Sam is learning accounting on Zoxdi, as a game.");
  });

  it("uses a neutral opener for an empty name", () => {
    const text = shareText({ name: "  ", xp: 0, levels: 0, url: "https://zoxdi.pages.dev" });
    expect(text.startsWith("Someone is learning accounting")).toBe(true);
  });
});
