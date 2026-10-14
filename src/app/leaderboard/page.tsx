"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Avatar } from "@/components/layout/Avatar";
import { ShareScore } from "@/components/share/ShareScore";
import { LEADERBOARD_COHORT } from "@/data/leaderboard";
import { rankMedal, rankPlayers } from "@/lib/learning/xp";
import { useProgressContext } from "@/lib/storage/ProgressContext";

const PODIUM_ORDER = [2, 1, 3];
const TOTAL_LEVELS = 40;
const CROWN = "\u{1F451}";
const DOT = " \u00b7 ";

/**
 * Count a score up from zero, so a number feels earned rather than printed.
 * Runs on the client only, and reduced-motion users see the final value at
 * once because the global stylesheet zeroes animation durations.
 */
function useCountUp(target: number, delay = 120, duration = 900): number {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (target <= 0) {
      setValue(0);
      return;
    }
    const from = performance.now() + delay;
    let frame = 0;
    const tick = (now: number) => {
      const elapsed = now - from;
      if (elapsed >= 0) {
        const progress = Math.min(1, elapsed / duration);
        // Ease-out cubic: fast at the start, settling gently on the target.
        setValue(Math.round(target * (1 - Math.pow(1 - progress, 3))));
        if (progress >= 1) return;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, delay, duration]);

  return value;
}

/** A score that counts itself up wherever it is shown. */
function Xp({ value, className = "" }: { value: number; className?: string }) {
  const shown = useCountUp(value);
  return <span className={className}>{shown.toLocaleString()}</span>;
}

export default function LeaderboardPage() {
  const { profile, progress } = useProgressContext();
  // Bars and meters grow from zero just after the first paint.
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const ranked = useMemo(() => {
    const you = profile
      ? {
          id: "you",
          name: profile.name,
          initials: profile.initials,
          xp: progress.xp.total,
          masteredLevels: progress.completedLevelIds.length,
        }
      : null;
    return rankPlayers(LEADERBOARD_COHORT, you);
  }, [profile, progress.xp.total, progress.completedLevelIds.length]);

  const you = ranked.find((player) => player.isYou) ?? null;
  const podium = ranked.slice(0, 3);
  const rest = ranked.slice(3);
  // The player one place above you is the next thing to beat.
  const ahead = you && you.rank > 1 ? ranked[you.rank - 2] : null;
  const gap = ahead && you ? Math.max(0, ahead.xp - you.xp) : 0;
  const chase =
    ahead && you && ahead.xp > 0
      ? Math.min(100, Math.max(4, Math.round((you.xp / ahead.xp) * 100)))
      : 100;

  return (
    <div className="space-y-8 py-6">
      <div className="animate-slide-up text-center">
        <span className="inline-flex items-center gap-2 rounded-full grad-ig-soft px-4 py-1.5 text-xs font-black uppercase tracking-wide text-ink-soft">
          <span className="relative flex h-2 w-2" aria-hidden="true">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-credit opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-credit" />
          </span>
          Weekly standings
        </span>
        <h1 className="mt-3 text-3xl font-black text-ink sm:text-4xl">
          The <span className="text-ig">Leaderboard</span>
        </h1>
        <p className="mt-2 text-ink-muted">
          XP is earned by understanding: first-try answers, fewer hints, harder
          levels.
        </p>
      </div>

      {/* Podium */}
      <div className="grid grid-cols-3 items-end gap-2 sm:gap-4">
        {PODIUM_ORDER.map((rank, slot) => {
          const player = podium[rank - 1];
          if (!player) return <div key={rank} />;
          const heights = ["h-20", "h-28", "h-16"];
          const size = rank === 1 ? 60 : 48;
          return (
            <div
              key={player.id}
              className="animate-bounce-in"
              style={{ animationDelay: `${slot * 150}ms` }}
            >
              <div className="flex flex-col items-center">
                <div className="mb-2 text-center">
                  {rank === 1 ? (
                    <div className="animate-float text-2xl" aria-hidden="true">
                      {CROWN}
                    </div>
                  ) : null}
                  <div className={rank === 1 ? "mx-auto animate-ring-pulse rounded-full" : "mx-auto"}>
                    <Avatar profile={player} size={size} />
                  </div>
                  <p className="mt-1.5 max-w-[8rem] truncate text-sm font-extrabold text-ink">
                    {player.name}
                    {player.isYou ? " (you)" : ""}
                  </p>
                  <p className="font-mono text-xs font-bold text-credit">
                    <Xp value={player.xp} /> XP
                  </p>
                </div>
                <div
                  className={`flex w-full items-start justify-center rounded-t-xl2 grad-ig-anim animate-gradient-pan pt-2 text-2xl ${heights[rank - 1]}`}
                >
                  {rankMedal(rank)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Your standing, and how far the next place is */}
      {you ? (
        <div
          className="animate-slide-up space-y-3 rounded-xl2 border border-credit/40 bg-credit-soft/40 p-4"
          style={{ animationDelay: "160ms" }}
        >
          <div className="flex items-center gap-3">
            <span className="shrink-0 rounded-full bg-credit px-3 py-1 text-sm font-black text-white">
              #{you.rank}
            </span>
            <Avatar profile={you} size={40} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-extrabold text-ink">{you.name}</p>
              <p className="text-xs text-ink-muted">
                {you.masteredLevels} levels{DOT}
                <Xp value={you.xp} /> XP
              </p>
            </div>
            <Link
              href="/learn"
              className="shrink-0 rounded-full bg-ink px-4 py-2 text-sm font-bold text-paper transition hover:bg-ink-soft"
            >
              Earn more
            </Link>
          </div>

          {ahead ? (
            <div>
              <div className="flex items-center justify-between gap-2 text-xs font-bold text-ink-soft">
                <span className="truncate">Chasing {ahead.name}</span>
                <span className="shrink-0 font-mono text-credit-deep">
                  {gap.toLocaleString()} XP to go
                </span>
              </div>
              <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-paper-sunken">
                <div
                  className="h-full rounded-full grad-ig-anim animate-gradient-pan transition-[width] duration-1000 ease-out"
                  style={{ width: entered ? `${chase}%` : "0%" }}
                />
              </div>
            </div>
          ) : (
            <p className="text-xs font-bold text-good">
              You are top of the board. Defend it one level at a time.
            </p>
          )}

          <ShareScore
            variant="compact"
            name={you.name}
            avatar={profile?.avatar}
            xp={you.xp}
            levels={you.masteredLevels}
            streak={progress.streak.current}
            headline={`#${you.rank} on the leaderboard`}
            subline="Accounting, taught as a game"
          />
        </div>
      ) : (
        <div
          className="animate-slide-up rounded-xl2 border border-line bg-paper-card p-4 text-center text-sm text-ink-muted"
          style={{ animationDelay: "160ms" }}
        >
          Finish a level and your name takes a place on this board.
        </div>
      )}

      {/* The field */}
      <div className="overflow-hidden rounded-xl2 border border-line bg-paper-card shadow-card">
        {rest.map((player, index) => {
          const mastered = Math.min(
            100,
            Math.round((player.masteredLevels / TOTAL_LEVELS) * 100),
          );
          const delay = Math.min(index * 45, 520);
          return (
            <div
              key={player.id}
              className={`relative flex animate-slide-in-right items-center gap-3 border-b border-line/60 px-4 py-3 transition hover:bg-paper-sunken/40 last:border-0 ${
                player.isYou ? "bg-credit-soft/30" : ""
              }`}
              style={{ animationDelay: `${delay}ms` }}
            >
              {player.isYou ? (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 animate-sweep bg-gradient-to-r from-transparent via-credit/20 to-transparent"
                />
              ) : null}
              <span className="w-7 shrink-0 text-center font-mono font-extrabold text-ink-muted">
                {player.rank}
              </span>
              <Avatar profile={player} size={34} />
              <div className="min-w-0 flex-1">
                <p
                  className={`truncate font-bold ${player.isYou ? "text-credit-deep" : "text-ink"}`}
                >
                  {player.name}
                  {player.isYou ? " (you)" : ""}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="h-1.5 w-16 shrink-0 overflow-hidden rounded-full bg-paper-sunken sm:w-28">
                    <span
                      className="block h-full rounded-full bg-ig-135 transition-[width] duration-700 ease-out"
                      style={{ width: entered ? `${mastered}%` : "0%", transitionDelay: `${delay}ms` }}
                    />
                  </span>
                  <span className="truncate text-xs text-ink-muted">
                    {player.masteredLevels} levels
                  </span>
                </div>
              </div>
              <Xp value={player.xp} className="shrink-0 font-mono text-sm font-extrabold text-ink" />
            </div>
          );
        })}
        {rest.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-ink-muted">
            Every place is taken by you. Try a harder drill next.
          </div>
        ) : null}
      </div>

      <p className="text-center text-xs text-ink-muted">
        Master a level and the board moves. Every question you answer is worth XP,
        and a streak keeps it coming.
      </p>
    </div>
  );
}
