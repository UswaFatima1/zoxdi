/**
 * The pure logic behind sharing a score: the "beat me" link, the message that
 * travels with it, and the challenge a visitor arrives holding. There is no
 * React and no DOM here, so every rule below is covered by tests rather than by
 * clicking around the site.
 */

export interface Challenge {
  /** Display name of the player who sent the link. */
  name: string;
  /** Their total XP at the moment they shared it. */
  xp: number;
  /** How many levels they had mastered. */
  levels: number;
  /** When the link was opened, in milliseconds. */
  at: number;
}

/** The slice of the Web Storage API this module needs. */
export interface ChallengeStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export const CHALLENGE_KEY = "zoxdi.challenge.v1";

/** Used when a link is built outside the browser, for example in a test. */
export const SITE_ORIGIN = "https://zoxdi.pages.dev";

const MAX_NAME = 40;
/** Control characters never belong in a shared name. */
const CONTROL_CHARS = /[\u0000-\u001f\u007f]/g;

/** Collapse whitespace, drop control junk and cap the length. */
export function cleanName(value: string): string {
  return value.replace(CONTROL_CHARS, " ").replace(/\s+/g, " ").trim().slice(0, MAX_NAME);
}

function positiveInt(value: string | null): number {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

/** Read the challenge a visitor arrived with, from "?challenge=...&xp=...". */
export function parseChallenge(search: string, at = Date.now()): Challenge | null {
  const params = new URLSearchParams(search.replace(/^\?/, ""));
  const name = cleanName(params.get("challenge") ?? "");
  if (!name) return null;
  return {
    name,
    xp: positiveInt(params.get("xp")),
    levels: positiveInt(params.get("lv")),
    at,
  };
}

/**
 * The link a player sends to a friend. It goes straight to the welcome screen,
 * so the friend reads the dare before anything else.
 */
export function challengeUrl(
  challenge: Pick<Challenge, "name" | "xp" | "levels">,
  origin: string = SITE_ORIGIN,
): string {
  const params = new URLSearchParams();
  params.set("challenge", cleanName(challenge.name) || "A friend");
  if (challenge.xp > 0) params.set("xp", String(Math.round(challenge.xp)));
  if (challenge.levels > 0) params.set("lv", String(Math.round(challenge.levels)));
  return `${origin.replace(/\/+$/, "")}/login/?${params.toString()}`;
}

/** The message that travels with a shared score. */
export function shareText(input: {
  name: string;
  xp: number;
  levels: number;
  /** For example "Level 12", used when a level was just cleared. */
  levelLabel?: string;
  url: string;
}): string {
  const who = cleanName(input.name) || "Someone";
  const opening = input.levelLabel
    ? `${who} just mastered ${input.levelLabel} on Zoxdi.`
    : `${who} is learning accounting on Zoxdi, as a game.`;
  const score = `${input.xp.toLocaleString("en-US")} XP and ${input.levels} levels done. Free, no ads.`;
  return [opening, score, `Beat that: ${input.url}`].join("\n");
}

export function readChallenge(storage: ChallengeStorage | null): Challenge | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(CHALLENGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Challenge>;
    const name = cleanName(typeof parsed.name === "string" ? parsed.name : "");
    if (!name) return null;
    return {
      name,
      xp: typeof parsed.xp === "number" && parsed.xp > 0 ? Math.round(parsed.xp) : 0,
      levels: typeof parsed.levels === "number" && parsed.levels > 0 ? Math.round(parsed.levels) : 0,
      at: typeof parsed.at === "number" && parsed.at > 0 ? parsed.at : 0,
    };
  } catch {
    return null;
  }
}

export function saveChallenge(storage: ChallengeStorage | null, challenge: Challenge): void {
  if (!storage) return;
  try {
    storage.setItem(CHALLENGE_KEY, JSON.stringify(challenge));
  } catch {
    // A full or blocked storage must never break the game.
  }
}

export function clearChallenge(storage: ChallengeStorage | null): void {
  if (!storage) return;
  try {
    storage.removeItem(CHALLENGE_KEY);
  } catch {
    // Ignore: the banner simply stays for this session.
  }
}

/** localStorage when it is usable, otherwise null (private mode blocks it). */
export function browserStorage(): ChallengeStorage | null {
  try {
    if (typeof window === "undefined" || !window.localStorage) return null;
    const probe = "zoxdi.storage-probe";
    window.localStorage.setItem(probe, "1");
    window.localStorage.removeItem(probe);
    return window.localStorage;
  } catch {
    return null;
  }
}

/** How far the player has climbed towards the challenger, in percent. */
export function chasePercent(challenge: Challenge, xp: number): number {
  if (challenge.xp <= 0) return 100;
  return Math.max(0, Math.min(100, Math.round((xp / challenge.xp) * 100)));
}

export function hasPassed(challenge: Challenge, xp: number): boolean {
  return challenge.xp > 0 && xp > challenge.xp;
}

/** One honest line telling the player where they stand. */
export function standingLine(challenge: Challenge, xp: number): string {
  const score = `${challenge.xp.toLocaleString("en-US")} XP`;
  if (challenge.xp <= 0) return `${challenge.name} dared you to try this.`;
  if (xp > challenge.xp) return `You passed ${challenge.name} (${score}).`;
  if (xp === challenge.xp) return `Level with ${challenge.name} at ${score}. One more level wins.`;
  return `${(challenge.xp - xp).toLocaleString("en-US")} XP to pass ${challenge.name} (${score}).`;
}
