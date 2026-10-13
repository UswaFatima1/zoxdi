/**
 * Versioned progress storage.
 *
 * The blob is versioned and every read is validated, so corrupted or outdated
 * data is migrated or discarded rather than crashing the app. When a Supabase
 * project is configured the same state is mirrored to the cloud, so a learner's
 * books follow them to any device they sign in from.
 */

import type { ConceptId } from "../learning/concepts";
import type { ConceptMastery } from "../learning/mastery";
import { avatarForName, defaultShopName, isAvatar } from "../profile/identity";

export const STORAGE_KEY = "zoxdi.progress";
export const THEME_KEY = "zoxdi.theme";
export const SCHEMA_VERSION = 4;

export type ThemePreference = "light" | "dark";

/** The player's profile and shop identity. */
export interface UserProfile {
  name: string;
  email: string;
  /** Two-letter initials derived from the name, used for the avatar. */
  initials: string;
  /** A fun emoji the student picks to represent themselves. */
  avatar: string;
  /** The name the student gives their shop — the story's home base. */
  shopName: string;
  joinedAt: number;
}

export interface LevelResult {
  levelId: string;
  correct: boolean;
  attempts: number;
  hintsUsed: number;
  completedAt: number;
}

export interface StreakState {
  current: number;
  best: number;
  /** Local calendar day (YYYY-MM-DD) of the last completion. */
  lastCompletedDay: string | null;
}

/** The once-a-day drill. */
export interface DailyState {
  /** The local day of the most recently completed daily challenge. */
  lastCompletedDay: string | null;
  /** How many daily challenges have ever been finished. */
  completions: number;
  /** The best score (out of the daily length) achieved. */
  best: number;
}

/** The timed 60-second round. */
export interface SpeedState {
  /** Most questions answered correctly inside the time limit. */
  best: number;
  plays: number;
  lastScore: number | null;
}

export interface ProgressStats {
  totalAttempts: number;
  totalCorrect: number;
  hintsUsed: number;
}

export interface ProgressSettings {
  urdu: boolean;
  reducedMotion: boolean;
  theme: ThemePreference;
  /** Whether the game's sound cues play. */
  sound: boolean;
}

/** Everything that feeds the leaderboard. */
export interface ProgressXp {
  total: number;
  /** Level id -> XP awarded, so replays cannot farm points. */
  awarded: Record<string, number>;
}

export interface ProgressState {
  version: number;
  profile: UserProfile | null;
  xp: ProgressXp;
  completedLevelIds: string[];
  levelResults: Record<string, LevelResult>;
  mastery: Partial<Record<ConceptId, ConceptMastery>>;
  misconceptionCounts: Record<string, number>;
  streak: StreakState;
  daily: DailyState;
  speed: SpeedState;
  stats: ProgressStats;
  settings: ProgressSettings;
}

export function createEmptyProgress(): ProgressState {
  return {
    version: SCHEMA_VERSION,
    profile: null,
    xp: { total: 0, awarded: {} },
    completedLevelIds: [],
    levelResults: {},
    mastery: {},
    misconceptionCounts: {},
    streak: { current: 0, best: 0, lastCompletedDay: null },
    daily: { lastCompletedDay: null, completions: 0, best: 0 },
    speed: { best: 0, plays: 0, lastScore: null },
    stats: { totalAttempts: 0, totalCorrect: 0, hintsUsed: 0 },
    settings: { urdu: false, reducedMotion: false, theme: "dark", sound: true },
  };
}

export const DEFAULT_THEME: ThemePreference = "dark";

/** Build initials from a display name, e.g. "Alex Morgan" -> "AM". */
export function initialsFromName(name: string): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

/**
 * Coerce whatever was found in storage into a valid ProgressState. Unknown
 * fields are dropped and missing fields are filled with defaults, so a
 * partially-written payload can never crash the game.
 */
export function migrateProgress(raw: unknown): ProgressState {
  const base = createEmptyProgress();
  if (!isRecord(raw)) return base;

  const completedLevelIds = Array.isArray(raw.completedLevelIds)
    ? raw.completedLevelIds.filter((id): id is string => typeof id === "string")
    : base.completedLevelIds;

  const levelResults = isRecord(raw.levelResults) ? (raw.levelResults as Record<string, LevelResult>) : {};
  const mastery = isRecord(raw.mastery)
    ? (raw.mastery as Partial<Record<ConceptId, ConceptMastery>>)
    : {};
  const misconceptionCounts = isRecord(raw.misconceptionCounts)
    ? Object.fromEntries(
        Object.entries(raw.misconceptionCounts).filter(
          ([, value]) => typeof value === "number",
        ),
      ) as Record<string, number>
    : {};

  const streakRaw = isRecord(raw.streak) ? raw.streak : {};
  const dailyRaw = isRecord(raw.daily) ? raw.daily : {};
  const speedRaw = isRecord(raw.speed) ? raw.speed : {};
  const statsRaw = isRecord(raw.stats) ? raw.stats : {};
  const settingsRaw = isRecord(raw.settings) ? raw.settings : {};
  const xpRaw = isRecord(raw.xp) ? raw.xp : {};
  const profileRaw = isRecord(raw.profile) ? raw.profile : null;

  const profile: UserProfile | null =
    profileRaw && typeof profileRaw.name === "string" && profileRaw.name.trim().length > 0
      ? (() => {
          const name = profileRaw.name.trim().slice(0, 60);
          return {
            name,
            email:
              typeof profileRaw.email === "string" ? profileRaw.email.trim().slice(0, 120) : "",
            initials:
              typeof profileRaw.initials === "string" && profileRaw.initials.length > 0
                ? profileRaw.initials.slice(0, 2).toUpperCase()
                : initialsFromName(name),
            avatar: isAvatar(profileRaw.avatar) ? profileRaw.avatar : avatarForName(name),
            shopName:
              typeof profileRaw.shopName === "string" && profileRaw.shopName.trim().length > 0
                ? profileRaw.shopName.trim().slice(0, 40)
                : defaultShopName(name),
            joinedAt: asNumber(profileRaw.joinedAt, Date.now()),
          };
        })()
      : null;

  const theme: ThemePreference =
    settingsRaw.theme === "light" || settingsRaw.theme === "dark"
      ? settingsRaw.theme
      : DEFAULT_THEME;

  return {
    version: SCHEMA_VERSION,
    profile,
    xp: {
      total: asNumber(xpRaw.total, 0),
      awarded: isRecord(xpRaw.awarded)
        ? Object.fromEntries(
            Object.entries(xpRaw.awarded).filter(([, value]) => typeof value === "number"),
          ) as Record<string, number>
        : {},
    },
    completedLevelIds,
    levelResults,
    mastery,
    misconceptionCounts,
    streak: {
      current: asNumber(streakRaw.current, 0),
      best: asNumber(streakRaw.best, 0),
      lastCompletedDay:
        typeof streakRaw.lastCompletedDay === "string" ? streakRaw.lastCompletedDay : null,
    },
    daily: {
      lastCompletedDay:
        typeof dailyRaw.lastCompletedDay === "string" ? dailyRaw.lastCompletedDay : null,
      completions: asNumber(dailyRaw.completions, 0),
      best: asNumber(dailyRaw.best, 0),
    },
    speed: {
      best: asNumber(speedRaw.best, 0),
      plays: asNumber(speedRaw.plays, 0),
      lastScore: typeof speedRaw.lastScore === "number" ? speedRaw.lastScore : null,
    },
    stats: {
      totalAttempts: asNumber(statsRaw.totalAttempts, 0),
      totalCorrect: asNumber(statsRaw.totalCorrect, 0),
      hintsUsed: asNumber(statsRaw.hintsUsed, 0),
    },
    settings: {
      urdu: typeof settingsRaw.urdu === "boolean" ? settingsRaw.urdu : false,
      reducedMotion:
        typeof settingsRaw.reducedMotion === "boolean" ? settingsRaw.reducedMotion : false,
      theme,
      sound: typeof settingsRaw.sound === "boolean" ? settingsRaw.sound : true,
    },
  };
}

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function getStorage(): StorageLike | null {
  try {
    if (typeof window === "undefined" || !window.localStorage) return null;
    return window.localStorage;
  } catch {
    // Storage can throw in private modes; degrade to a session-only game.
    return null;
  }
}

export function loadProgress(storage: StorageLike | null = getStorage()): ProgressState {
  return loadProgressFrom(storage, STORAGE_KEY);
}

/**
 * Read a progress blob from a specific key. Accounts keep their own blob so two
 * people on one device never see each other's books.
 */
export function loadProgressFrom(
  storage: StorageLike | null = getStorage(),
  key: string = STORAGE_KEY,
): ProgressState {
  if (!storage) return createEmptyProgress();
  try {
    const serialized = storage.getItem(key);
    if (!serialized) return createEmptyProgress();
    return migrateProgress(JSON.parse(serialized));
  } catch {
    return createEmptyProgress();
  }
}

export function saveProgress(
  progress: ProgressState,
  storage: StorageLike | null = getStorage(),
  key: string = STORAGE_KEY,
): void {
  if (!storage) return;
  try {
    storage.setItem(key, JSON.stringify({ ...progress, version: SCHEMA_VERSION }));
  } catch {
    // Ignore quota/security errors: the game stays playable without persistence.
  }
}

export function clearProgress(
  storage: StorageLike | null = getStorage(),
  key: string = STORAGE_KEY,
): void {
  if (!storage) return;
  try {
    storage.removeItem(key);
  } catch {
    // Nothing to do.
  }
}

/** The storage key that holds a given account's private progress. */
export function accountProgressKey(email: string): string {
  const safe = email.trim().toLowerCase().replace(/[^a-z0-9.@_-]/g, "");
  return `${STORAGE_KEY}.acct.${safe}`;
}

/** Remember the theme on its own key so the pre-paint script can read it fast. */
export function saveThemePreference(
  theme: ThemePreference,
  storage: StorageLike | null = getStorage(),
): void {
  if (!storage) return;
  try {
    storage.setItem(THEME_KEY, theme);
  } catch {
    // Nothing to do.
  }
}

export function hasCompleted(progress: ProgressState, levelId: string): boolean {
  return progress.completedLevelIds.includes(levelId);
}

export function localDayKey(at: number = Date.now()): string {
  const date = new Date(at);
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Parse "YYYY-MM-DD" as a *local* day, never UTC, to avoid off-by-one. */
function parseLocalDay(key: string): Date {
  const [year, month, dayOfMonth] = key.split("-").map(Number);
  return new Date(year, month - 1, dayOfMonth);
}

function toLocalDayKey(date: Date): string {
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Advance a streak given a new completion on `day`. Pure. */
export function advanceStreak(streak: StreakState, day: string): StreakState {
  if (streak.lastCompletedDay === day) return streak;

  const yesterday = (() => {
    const date = parseLocalDay(day);
    date.setDate(date.getDate() - 1);
    return toLocalDayKey(date);
  })();

  const current = streak.lastCompletedDay === yesterday ? streak.current + 1 : 1;
  return {
    current,
    best: Math.max(streak.best, current),
    lastCompletedDay: day,
  };
}
