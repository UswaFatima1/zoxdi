/**
 * The learning path: which levels are unlocked and what comes next.
 * Kept separate from the content itself so the same rules work for any
 * syllabus data set.
 */

export interface PathLevel {
  id: string;
  order: number;
}

/**
 * Every level is open in this build, so a student can jump to whatever they
 * want to practise. Flip `ALL_LEVELS_UNLOCKED` back to `false` to restore the
 * sequential gate (first incomplete level and everything before it).
 */
export const ALL_LEVELS_UNLOCKED = true;

export function unlockedLevelIds(levels: PathLevel[], completedLevelIds: string[]): string[] {
  const sorted = [...levels].sort((a, b) => a.order - b.order);

  if (ALL_LEVELS_UNLOCKED) return sorted.map((level) => level.id);

  const done = new Set(completedLevelIds);
  const unlocked: string[] = [];
  for (const level of sorted) {
    unlocked.push(level.id);
    if (!done.has(level.id)) break;
  }
  return unlocked;
}

export function isLevelUnlocked(
  levelId: string,
  levels: PathLevel[],
  completedLevelIds: string[],
): boolean {
  return unlockedLevelIds(levels, completedLevelIds).includes(levelId);
}

export function nextIncompleteLevelId(
  levels: PathLevel[],
  completedLevelIds: string[],
): string | null {
  const done = new Set(completedLevelIds);
  const sorted = [...levels].sort((a, b) => a.order - b.order);
  return sorted.find((level) => !done.has(level.id))?.id ?? null;
}
