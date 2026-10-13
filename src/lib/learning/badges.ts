/**
 * Badges are milestones, and they are *derived*, never stored.
 *
 * Because each badge is a pure function of the progress the student already
 * has, there is no way for an award to get lost or duplicated, and adding a new
 * badge needs no storage migration. They are reinforcement on top of the
 * practice, not a substitute for it.
 */

import { LEVELS } from "@/data/accounting";
import { CHAPTERS } from "@/data/accounting/levels";
import type { ProgressState } from "@/lib/storage/progress";
import { TIER_LABEL, TIER_ORDER, tierOf, type LevelTier } from "./tiers";

export type BadgeTier = "bronze" | "silver" | "gold";

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  tier: BadgeTier;
  /**
   * Progress toward the badge. `current >= target` means it is earned, which
   * also gives the locked badge a meaningful bar to fill.
   */
  progress: (state: ProgressState) => { current: number; target: number };
}

export interface EvaluatedBadge {
  badge: Badge;
  earned: boolean;
  current: number;
  target: number;
  /** 0..1, clamped, for the progress bar. */
  ratio: number;
}

export const TIER_STYLE: Record<BadgeTier, { ring: string; gradient: string; label: string }> = {
  bronze: {
    ring: "border-gold/50",
    gradient: "linear-gradient(135deg,#F58529,#FFD93D)",
    label: "Bronze",
  },
  silver: {
    ring: "border-debit/50",
    gradient: "linear-gradient(135deg,#405DE6,#9B30BF)",
    label: "Silver",
  },
  gold: {
    ring: "border-credit/50",
    gradient: "linear-gradient(135deg,#E1306C,#FFD93D)",
    label: "Gold",
  },
};

const completedSet = (state: ProgressState) => new Set(state.completedLevelIds);

function completedInChapter(state: ProgressState, chapterId: string): number {
  const done = completedSet(state);
  return LEVELS.filter((level) => level.chapterId === chapterId && done.has(level.id)).length;
}

function completedWithMode(state: ProgressState, modes: string[]): number {
  const done = completedSet(state);
  return LEVELS.filter((level) => modes.includes(level.mode) && done.has(level.id)).length;
}

function accuracyPercent(state: ProgressState): number {
  return state.stats.totalAttempts === 0
    ? 0
    : state.stats.totalCorrect / state.stats.totalAttempts;
}

function countResults(
  state: ProgressState,
  predicate: (result: ProgressState["levelResults"][string]) => boolean,
): number {
  return Object.values(state.levelResults).filter(predicate).length;
}

const ratioOf = (current: number, target: number) =>
  target <= 0 ? 1 : Math.max(0, Math.min(1, current / target));

/** One badge per chapter: awarded when every level in the chapter is cleared. */
const CHAPTER_BADGES: Badge[] = CHAPTERS.map((chapter) => ({
  id: `chapter-${chapter.id}`,
  name: `${chapter.title} Cleared`,
  description: `Finish every level in “${chapter.title}”.`,
  icon: "🏅",
  tier: chapter.order <= 2 ? "bronze" : chapter.order <= 4 ? "silver" : "gold",
  progress: (state) => ({
    current: completedInChapter(state, chapter.id),
    target: LEVELS.filter((level) => level.chapterId === chapter.id).length,
  }),
}));

const TIER_ICON: Record<LevelTier, string> = {
  starter: "🥾",
  easy: "🌤️",
  medium: "⛰️",
  hard: "🧗",
  expert: "🏔️",
};

const TIER_BADGE_TIER: Record<LevelTier, BadgeTier> = {
  starter: "bronze",
  easy: "bronze",
  medium: "silver",
  hard: "silver",
  expert: "gold",
};

/** One badge per difficulty tier: awarded when every level in the tier is cleared. */
const TIER_BADGES: Badge[] = TIER_ORDER.map((tier) => ({
  id: `tier-${tier}`,
  name: `${TIER_LABEL[tier]} Cleared`,
  description: `Clear every ${TIER_LABEL[tier].toLowerCase()} level on the path.`,
  icon: TIER_ICON[tier],
  tier: TIER_BADGE_TIER[tier],
  progress: (state) => {
    const done = completedSet(state);
    const levels = LEVELS.filter((level) => tierOf(level.order) === tier);
    return { current: levels.filter((level) => done.has(level.id)).length, target: levels.length };
  },
}));

export const BADGES: Badge[] = [
  ...CHAPTER_BADGES,
  ...TIER_BADGES,
  {
    id: "first-step",
    name: "First Step",
    description: "Finish your very first level.",
    icon: "🌱",
    tier: "bronze",
    progress: (state) => ({ current: state.completedLevelIds.length, target: 1 }),
  },
  {
    id: "ledger-opener",
    name: "Ledger Opener",
    description: "Open and balance your first T-account.",
    icon: "📒",
    tier: "bronze",
    progress: (state) => ({ current: completedInChapter(state, "ch3"), target: 1 }),
  },
  {
    id: "first-balance",
    name: "First Balanced Trial Balance",
    description: "Complete a level where debits must equal credits.",
    icon: "⚖️",
    tier: "bronze",
    progress: (state) => ({ current: completedWithMode(state, ["trial"]), target: 1 }),
  },
  {
    id: "forger",
    name: "Journal Forger",
    description: "Build 6 complete journal entries.",
    icon: "🧾",
    tier: "silver",
    progress: (state) => ({ current: completedWithMode(state, ["forge"]), target: 6 }),
  },
  {
    id: "debit-credit-ninja",
    name: "Debit / Credit Ninja",
    description: "Answer 100 questions correctly.",
    icon: "🥷",
    tier: "silver",
    progress: (state) => ({ current: state.stats.totalCorrect, target: 100 }),
  },
  {
    id: "tower-climber",
    name: "Trial Balance Tower",
    description: "Clear every trial-balance level in the tower.",
    icon: "🗼",
    tier: "silver",
    progress: (state) => ({
      current: completedInChapter(state, "ch4"),
      target: LEVELS.filter((level) => level.chapterId === "ch4").length,
    }),
  },
  {
    id: "sharpshooter",
    name: "Sharpshooter",
    description: "Hold 90% accuracy over 10+ attempts.",
    icon: "🎯",
    tier: "silver",
    progress: (state) => ({
      current: state.stats.totalAttempts >= 10 ? Math.round(accuracyPercent(state) * 100) : 0,
      target: 90,
    }),
  },
  {
    id: "hint-free",
    name: "No Help Needed",
    description: "Solve a level without using a single hint.",
    icon: "🧠",
    tier: "bronze",
    progress: (state) => ({
      current: countResults(state, (result) => result.correct && result.hintsUsed === 0),
      target: 1,
    }),
  },
  {
    id: "flawless",
    name: "Flawless",
    description: "Get a level right on the very first try.",
    icon: "✨",
    tier: "bronze",
    progress: (state) => ({
      current: countResults(state, (result) => result.correct && result.attempts <= 1),
      target: 1,
    }),
  },
  {
    id: "streak-3",
    name: "Warming Up",
    description: "Practise three days in a row.",
    icon: "🔥",
    tier: "bronze",
    progress: (state) => ({ current: state.streak.best, target: 3 }),
  },
  {
    id: "streak-7",
    name: "On Fire",
    description: "Keep a seven-day practice streak.",
    icon: "🔥",
    tier: "silver",
    progress: (state) => ({ current: state.streak.best, target: 7 }),
  },
  {
    id: "streak-30",
    name: "Unstoppable",
    description: "A thirty-day streak. The books never slept.",
    icon: "🌟",
    tier: "gold",
    progress: (state) => ({ current: state.streak.best, target: 30 }),
  },
  {
    id: "daily-first",
    name: "Daily Habit",
    description: "Finish your first Daily Challenge.",
    icon: "☀️",
    tier: "bronze",
    progress: (state) => ({ current: state.daily.completions, target: 1 }),
  },
  {
    id: "daily-7",
    name: "Daily Devotee",
    description: "Finish seven Daily Challenges.",
    icon: "📅",
    tier: "silver",
    progress: (state) => ({ current: state.daily.completions, target: 7 }),
  },
  {
    id: "speedster",
    name: "Speedster",
    description: "Score a perfect 5/5 in the Speed Round.",
    icon: "⚡",
    tier: "silver",
    progress: (state) => ({ current: state.speed.best, target: 5 }),
  },
  {
    id: "full-cycle",
    name: "Full Cycle Complete",
    description: "Reach every chapter of the accounting cycle.",
    icon: "🏁",
    tier: "gold",
    progress: (state) => {
      const reached = CHAPTERS.filter((chapter) => completedInChapter(state, chapter.id) > 0).length;
      return { current: reached, target: CHAPTERS.length };
    },
  },
  {
    id: "xp-1000",
    name: "Thousand Club",
    description: "Earn 1,000 XP.",
    icon: "💎",
    tier: "silver",
    progress: (state) => ({ current: state.xp.total, target: 1000 }),
  },
  {
    id: "xp-2500",
    name: "Ledger Legend",
    description: "Earn 2,500 XP.",
    icon: "👑",
    tier: "gold",
    progress: (state) => ({ current: state.xp.total, target: 2500 }),
  },
];

export function evaluateBadge(badge: Badge, state: ProgressState): EvaluatedBadge {
  const { current, target } = badge.progress(state);
  const capped = Math.min(current, target);
  return {
    badge,
    earned: current >= target,
    current: capped,
    target,
    ratio: ratioOf(current, target),
  };
}

export function evaluateBadges(state: ProgressState): EvaluatedBadge[] {
  return BADGES.map((badge) => evaluateBadge(badge, state));
}

export function earnedBadges(state: ProgressState): EvaluatedBadge[] {
  return evaluateBadges(state).filter((entry) => entry.earned);
}

export function earnedBadgeCount(state: ProgressState): number {
  return earnedBadges(state).length;
}
