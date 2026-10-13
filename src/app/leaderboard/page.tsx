"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Avatar } from "@/components/layout/Avatar";
import { LEADERBOARD_COHORT } from "@/data/leaderboard";
import { rankMedal, rankPlayers } from "@/lib/learning/xp";
import { useProgressContext } from "@/lib/storage/ProgressContext";

const PODIUM_ORDER = [2, 1, 3];

export default function LeaderboardPage() {
  const { profile, progress } = useProgressContext();

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

  return (
    <div className="space-y-8 py-6">
      <div className="text-center">
        <p className="text-xs font-black uppercase tracking-wide text-credit">
          Weekly standings
        </p>
        <h1 className="mt-1 text-3xl font-black text-ink sm:text-4xl">
          Leaderboard
        </h1>
        <p className="mt-2 text-ink-muted">
          XP is earned by understanding — first-try answers, fewer hints, harder
          levels.
        </p>
      </div>

      {/* Podium */}
      <div className="grid grid-cols-3 items-end gap-2 sm:gap-4">
        {PODIUM_ORDER.map((rank) => {
          const player = podium[rank - 1];
          if (!player) return <div key={rank} />;
          const heights = ["h-20", "h-28", "h-16"];
          const size = rank === 1 ? 60 : 48;
          return (
            <div
              key={player.id}
              className={`flex flex-col items-center ${rank === 1 ? "order-none" : ""}`}
            >
              <div className="mb-2 text-center">
                <div className="mx-auto animate-bounce-in">
                  <Avatar profile={player} size={size} />
                </div>
                <p className="mt-1.5 max-w-[8rem] truncate text-sm font-extrabold text-ink">
                  {player.name}
                  {player.isYou ? " (you)" : ""}
                </p>
                <p className="font-mono text-xs font-bold text-credit">
                  {player.xp.toLocaleString()} XP
                </p>
              </div>
              <div
                className={`flex w-full items-start justify-center rounded-t-xl2 grad-ig pt-2 text-2xl ${heights[rank - 1]}`}
              >
                {rankMedal(rank)}
              </div>
            </div>
          );
        })}
      </div>

      {/* You banner */}
      {you && (
        <div className="flex items-center gap-3 rounded-xl2 border border-credit/40 bg-credit-soft/40 p-4">
          <span className="rounded-full bg-credit px-3 py-1 text-sm font-black text-white">
            #{you.rank}
          </span>
          <Avatar profile={you} size={40} />
          <div className="min-w-0 flex-1">
            <p className="truncate font-extrabold text-ink">{you.name}</p>
            <p className="text-xs text-ink-muted">
              {you.masteredLevels} levels · {you.xp.toLocaleString()} XP
            </p>
          </div>
          <Link
            href="/learn"
            className="shrink-0 rounded-full bg-ink px-4 py-2 text-sm font-bold text-paper transition hover:bg-ink-soft"
          >
            Earn more
          </Link>
        </div>
      )}

      {/* Rest of the table */}
      <div className="overflow-hidden rounded-xl2 border border-line bg-paper-card shadow-card">
        {rest.map((player) => (
          <div
            key={player.id}
            className={`flex items-center gap-3 border-b border-line/60 px-4 py-3 last:border-0 ${
              player.isYou ? "bg-credit-soft/30" : ""
            }`}
          >
            <span className="w-7 text-center font-mono font-extrabold text-ink-muted">
              {player.rank}
            </span>
            <Avatar profile={player} size={34} />
            <div className="min-w-0 flex-1">
              <p className={`truncate font-bold ${player.isYou ? "text-credit-deep" : "text-ink"}`}>
                {player.name}
                {player.isYou ? " (you)" : ""}
              </p>
              <p className="text-xs text-ink-muted">{player.masteredLevels} levels mastered</p>
            </div>
            <span className="font-mono text-sm font-extrabold text-ink">
              {player.xp.toLocaleString()}
            </span>
          </div>
        ))}
        {!you && (
          <div className="px-4 py-6 text-center text-sm text-ink-muted">
            Finish a level to appear on the board.
          </div>
        )}
      </div>

      <p className="text-center text-xs text-ink-muted">
        The classmates above are sample players — a friendly crowd to climb past.
        A live, cross-device leaderboard is on the way.
      </p>
    </div>
  );
}
