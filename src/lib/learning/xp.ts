/**
 * XP is the game layer's reward currency, and it is deliberately earned the
 * same way mastery is: by demonstrating understanding, not by spending time.
 *
 * A level pays a base amount, more if it is hard, and a bonus for getting it
 * right early and without hints. XP is awarded once per level, so replaying a
 * level for fun cannot be farmed for points.
 */

export interface XpAward {
  base: number;
  difficultyBonus: number;
  firstTryBonus: number;
  noHintBonus: number;
  total: number;
}

export const XP_BASE = 60;
export const XP_PER_DIFFICULTY = 20;
export const XP_FIRST_TRY = 40;
export const XP_NO_HINT = 20;

/** XP a level pays for a given performance. Pure. */
export function xpForLevel(params: {
  difficulty: number;
  attempts: number;
  hintsUsed: number;
}): XpAward {
  const difficulty = Math.max(1, Math.min(3, Math.round(params.difficulty)));
  const base = XP_BASE;
  const difficultyBonus = (difficulty - 1) * XP_PER_DIFFICULTY;
  const firstTryBonus = params.attempts <= 1 ? XP_FIRST_TRY : 0;
  const noHintBonus = params.hintsUsed <= 0 ? XP_NO_HINT : 0;
  return {
    base,
    difficultyBonus,
    firstTryBonus,
    noHintBonus,
    total: base + difficultyBonus + firstTryBonus + noHintBonus,
  };
}

/** The level order returned by the leaderboard, highest XP first. */
export interface RankedPlayer {
  id: string;
  name: string;
  initials: string;
  xp: number;
  masteredLevels: number;
  /** 1-based position. */
  rank: number;
  isYou: boolean;
}

export interface LeaderboardPlayer {
  id: string;
  name: string;
  initials: string;
  xp: number;
  masteredLevels: number;
}

/**
 * Merge the seeded cohort with the current player and rank everyone. Ties are
 * broken by levels mastered, then alphabetically, so the order is stable.
 */
export function rankPlayers(
  cohort: LeaderboardPlayer[],
  you: LeaderboardPlayer | null,
): RankedPlayer[] {
  const all: LeaderboardPlayer[] = [...cohort];
  if (you) all.push(you);

  const sorted = [...all].sort((a, b) => {
    if (b.xp !== a.xp) return b.xp - a.xp;
    if (b.masteredLevels !== a.masteredLevels) return b.masteredLevels - a.masteredLevels;
    return a.name.localeCompare(b.name);
  });

  return sorted.map((player, index) => ({
    ...player,
    rank: index + 1,
    isYou: you !== null && player.id === you.id,
  }));
}

/** The medal shown next to the top three ranks. */
export function rankMedal(rank: number): string {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return "";
}
