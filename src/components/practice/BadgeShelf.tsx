"use client";

import { evaluateBadges, TIER_STYLE } from "@/lib/learning/badges";
import type { ProgressState } from "@/lib/storage/progress";

/**
 * The wall of milestones. Earned badges glow; locked ones still show how close
 * they are, which is the whole point — a bar at 7/10 pulls harder than a lock.
 */
export function BadgeShelf({
  state,
  limit,
  showLocked = true,
}: {
  state: ProgressState;
  /** Show at most this many, earned ones first. */
  limit?: number;
  showLocked?: boolean;
}) {
  const evaluated = evaluateBadges(state).sort((a, b) => {
    if (a.earned !== b.earned) return a.earned ? -1 : 1;
    return b.ratio - a.ratio;
  });
  const earned = evaluated.filter((entry) => entry.earned);
  const locked = evaluated.filter((entry) => !entry.earned);
  const visible = showLocked ? [...earned, ...locked] : earned;
  const shown = typeof limit === "number" ? visible.slice(0, limit) : visible;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {shown.map(({ badge, earned: isEarned, current, target, ratio }) => {
        const style = TIER_STYLE[badge.tier];
        return (
          <div
            key={badge.id}
            className={`relative overflow-hidden rounded-xl2 border bg-paper-card p-3 shadow-card transition ${
              isEarned ? style.ring : "border-line opacity-80"
            }`}
          >
            {isEarned && (
              <div
                className="absolute inset-x-0 top-0 h-1.5"
                style={{ backgroundImage: style.gradient }}
              />
            )}
            <div className="flex items-start gap-2">
              <span
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-2xl ${
                  isEarned ? "bg-paper-sunken" : "bg-paper-sunken grayscale"
                }`}
                aria-hidden="true"
              >
                {badge.icon}
              </span>
              <div className="min-w-0">
                <p className={`text-sm font-black leading-tight ${isEarned ? "text-ink" : "text-ink-muted"}`}>
                  {badge.name}
                </p>
                <p className="mt-0.5 text-[11px] leading-snug text-ink-muted">
                  {badge.description}
                </p>
              </div>
            </div>
            {!isEarned && (
              <div className="mt-2">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-paper-sunken">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${Math.round(ratio * 100)}%`, backgroundImage: style.gradient }}
                  />
                </div>
                <p className="mt-1 text-right font-mono text-[11px] font-bold text-ink-muted">
                  {current.toLocaleString()} / {target.toLocaleString()}
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
