/**
 * What clearing a level unlocks.
 *
 * Both badges and titles are derived from progress, so the reward for a level
 * is simply the difference between the badges and title held before the level
 * and those held after it. Keeping this as a pure function means the celebration
 * shown to the student is exactly the state they will find on the next page.
 */

import type { ProgressState } from "@/lib/storage/progress";
import { earnedBadges, type EvaluatedBadge } from "./badges";
import { titleFor, type Title } from "./titles";

export interface LevelRewards {
  badges: EvaluatedBadge[];
  title: Title;
  titleUpgraded: boolean;
}

/** The progress state the student will have once this level is cleared. */
export function projectCompletion(
  state: ProgressState,
  levelId: string,
  xpAward: number,
  hintsUsed: number,
): ProgressState {
  const alreadyComplete = state.completedLevelIds.includes(levelId);
  return {
    ...state,
    completedLevelIds: alreadyComplete
      ? state.completedLevelIds
      : [...state.completedLevelIds, levelId],
    stats: {
      totalAttempts: state.stats.totalAttempts + 1,
      totalCorrect: state.stats.totalCorrect + 1,
      hintsUsed: state.stats.hintsUsed + hintsUsed,
    },
    xp:
      xpAward > 0 && !alreadyComplete
        ? {
            total: state.xp.total + xpAward,
            awarded: { ...state.xp.awarded, [levelId]: xpAward },
          }
        : state.xp,
  };
}

export function levelRewards(
  state: ProgressState,
  levelId: string,
  xpAward: number,
  hintsUsed: number,
): LevelRewards {
  const projected = projectCompletion(state, levelId, xpAward, hintsUsed);
  const before = new Set(earnedBadges(state).map((entry) => entry.badge.id));
  const badges = earnedBadges(projected).filter((entry) => !before.has(entry.badge.id));
  const title = titleFor(projected.completedLevelIds.length);
  const previousTitle = titleFor(state.completedLevelIds.length);
  return { badges, title, titleUpgraded: title.id !== previousTitle.id };
}
