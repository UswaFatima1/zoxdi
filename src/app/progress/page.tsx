"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { LEVELS } from "@/data/accounting";
import { LEADERBOARD_COHORT } from "@/data/leaderboard";
import { rankPlayers } from "@/lib/learning/xp";
import { buildLearningPlan, weakestConcepts } from "@/lib/learning/recommendations";
import { CONCEPTS } from "@/lib/learning/concepts";
import { useProgressContext } from "@/lib/storage/ProgressContext";
import { Avatar } from "@/components/layout/Avatar";
import { MasteryMap } from "@/components/learning/MasteryMap";
import { MisconceptionMap } from "@/components/learning/MisconceptionMap";
import { BadgeShelf } from "@/components/practice/BadgeShelf";
import { earnedBadgeCount } from "@/lib/learning/badges";
import { titleProgress } from "@/lib/learning/titles";
import { AVATARS, avatarForName, defaultShopName } from "@/lib/profile/identity";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function StatCard({
  label,
  value,
  sub,
  gradient,
}: {
  label: string;
  value: string;
  sub?: string;
  gradient: string;
}) {
  return (
    <div className="overflow-hidden rounded-xl2 border border-line bg-paper-card shadow-card">
      <div className="h-1.5" style={{ backgroundImage: gradient }} />
      <div className="p-4">
        <p className="text-xs font-black uppercase tracking-wide text-ink-muted">{label}</p>
        <p className="mt-1 text-2xl font-black text-ink">{value}</p>
        {sub ? <p className="text-xs text-ink-muted">{sub}</p> : null}
      </div>
    </div>
  );
}

export default function ProgressPage() {
  const { progress, profile, reset, signOut, saveProfile } = useProgressContext();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(profile?.name ?? "");
  const [email, setEmail] = useState(profile?.email ?? "");
  const [avatar, setAvatar] = useState(profile?.avatar ?? "");
  const [shopName, setShopName] = useState(profile?.shopName ?? "");
  const [touched, setTouched] = useState(false);

  const nameError = name.trim().length < 2 ? "Please enter your name." : "";
  const emailError = !EMAIL_RE.test(email.trim())
    ? "Enter a valid email, e.g. alex@gmail.com"
    : "";
  const formValid = !nameError && !emailError;

  const startEditing = () => {
    setName(profile?.name ?? "");
    setEmail(profile?.email ?? "");
    setAvatar(profile?.avatar ?? "");
    setShopName(profile?.shopName ?? "");
    setTouched(false);
    setEditing(true);
  };

  const submitProfile = (event: React.FormEvent) => {
    event.preventDefault();
    setTouched(true);
    if (!formValid) return;
    saveProfile({ name, email, avatar, shopName });
    setEditing(false);
  };

  const plan = buildLearningPlan(progress.mastery, LEVELS, progress.completedLevelIds);
  const badgesEarned = useMemo(() => earnedBadgeCount(progress), [progress]);
  const rankTitle = useMemo(
    () => titleProgress(progress.completedLevelIds.length),
    [progress.completedLevelIds.length],
  );
  const weak = weakestConcepts(progress.mastery, { limit: 5, minAttempts: 1 });

  const accuracy =
    progress.stats.totalAttempts > 0
      ? Math.round((progress.stats.totalCorrect / progress.stats.totalAttempts) * 100)
      : 0;

  const rank = useMemo(() => {
    if (!profile) return null;
    const ranked = rankPlayers(LEADERBOARD_COHORT, {
      id: "you",
      name: profile.name,
      initials: profile.initials,
      xp: progress.xp.total,
      masteredLevels: progress.completedLevelIds.length,
    });
    return ranked.find((player) => player.isYou)?.rank ?? null;
  }, [profile, progress.xp.total, progress.completedLevelIds.length]);

  const confirmReset = () => {
    if (
      window.confirm(
        "Reset all progress? This clears mastery, XP, completions and streak from your account.",
      )
    ) {
      reset();
    }
  };

  return (
    <div className="space-y-8 py-6">
      {/* Profile header */}
      <section className="rounded-xl3 border border-line bg-paper-card p-5 shadow-card">
        <div className="flex flex-wrap items-center gap-4">
          {profile ? <Avatar profile={profile} size={64} /> : null}
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-black text-ink">
              {profile ? profile.shopName : "Your profile"}
            </h1>
            <p className="text-sm text-ink-muted">
              {profile
                ? `${profile.name} · ${profile.email}`
                : "Sign in to load your saved progress."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={editing ? () => setEditing(false) : startEditing}
              className="rounded-full border border-line px-4 py-2 text-sm font-bold text-ink-soft transition hover:border-credit/50 hover:text-ink"
            >
              {editing ? "Cancel" : "✏️ Edit profile"}
            </button>
            <Link
              href="/leaderboard"
              className="rounded-full border border-line px-4 py-2 text-sm font-bold text-ink-soft transition hover:border-credit/50 hover:text-ink"
            >
              🏆 Leaderboard
            </Link>
            <button
              type="button"
              onClick={() => {
                signOut();
                router.push("/login/");
              }}
              className="rounded-full border border-line px-4 py-2 text-sm font-bold text-ink-soft transition hover:border-bad/50 hover:text-bad"
            >
              Log out
            </button>
          </div>
        </div>

        {/* Title ladder */}
        <div className="mt-5 rounded-xl2 border border-line bg-paper-sunken/40 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-3xl" aria-hidden="true">
              {rankTitle.title.icon}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-black uppercase tracking-wide text-ink-muted">
                Your title
              </p>
              <p className="text-lg font-black text-ink">{rankTitle.title.name}</p>
              <p className="text-xs text-ink-muted">{rankTitle.title.blurb}</p>
            </div>
            {rankTitle.next ? (
              <div className="min-w-[9rem] text-right">
                <p className="text-[11px] font-black uppercase tracking-wide text-ink-muted">
                  Next: {rankTitle.next.name}
                </p>
                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-paper">
                  <div
                    className="h-full rounded-full grad-ig"
                    style={{ width: `${Math.round(rankTitle.ratio * 100)}%` }}
                  />
                </div>
                <p className="mt-1 text-[11px] font-bold text-ink-muted">
                  {progress.completedLevelIds.length}/{rankTitle.bandEnd} levels
                </p>
              </div>
            ) : (
              <span className="rounded-full bg-gold px-3 py-1 text-xs font-black uppercase text-[#3a2700]">
                Top title
              </span>
            )}
          </div>
        </div>

        {editing && (
          <form onSubmit={submitProfile} className="mt-5 space-y-4 animate-rise" noValidate>
            <p className="text-sm text-ink-muted">
              Set your profile however you like — the name and email are yours to
              change at any time. They are saved to your Zoxdi account.
            </p>
            <div>
              <span className="mb-2 block text-sm font-bold text-ink-soft">Avatar</span>
              <div className="grid grid-cols-8 gap-1.5">
                {AVATARS.map((option) => {
                  const selected = (avatar || avatarForName(name)) === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setAvatar(option)}
                      aria-label={`Choose avatar ${option}`}
                      className={`flex aspect-square items-center justify-center rounded-xl border-2 text-xl transition ${
                        selected
                          ? "scale-105 border-credit bg-credit-soft/40"
                          : "border-line bg-paper hover:border-credit/40"
                      }`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </div>
            <label className="block">
              <span className="mb-1 block text-sm font-bold text-ink-soft">Name</span>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Alex Morgan"
                className="w-full rounded-xl border-2 border-line bg-paper px-4 py-3 font-semibold text-ink outline-none transition focus:border-credit"
              />
              {touched && nameError ? (
                <span className="mt-1 block text-xs font-semibold text-bad">{nameError}</span>
              ) : null}
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-bold text-ink-soft">Shop name</span>
              <input
                type="text"
                value={shopName}
                maxLength={40}
                onChange={(event) => setShopName(event.target.value)}
                placeholder={defaultShopName(name)}
                className="w-full rounded-xl border-2 border-line bg-paper px-4 py-3 font-semibold text-ink outline-none transition focus:border-credit"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-bold text-ink-soft">Email</span>
              <input
                type="email"
                value={email}
                inputMode="email"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="alex@gmail.com"
                className="w-full rounded-xl border-2 border-line bg-paper px-4 py-3 font-semibold text-ink outline-none transition focus:border-credit"
              />
              {touched && emailError ? (
                <span className="mt-1 block text-xs font-semibold text-bad">{emailError}</span>
              ) : null}
            </label>
            <button
              type="submit"
              className="rounded-full bg-ig-135 px-7 py-3 font-black text-white shadow-glow transition hover:opacity-95"
            >
              Save profile
            </button>
          </form>
        )}
      </section>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="XP"
          value={progress.xp.total.toLocaleString()}
          sub={rank ? `Rank #${rank}` : undefined}
          gradient="linear-gradient(135deg,#FFD93D,#F58529)"
        />
        <StatCard
          label="Levels"
          value={`${progress.completedLevelIds.length}/${LEVELS.length}`}
          gradient="linear-gradient(135deg,#405DE6,#9B30BF)"
        />
        <StatCard
          label="Accuracy"
          value={`${accuracy}%`}
          sub={`${progress.stats.totalCorrect}/${progress.stats.totalAttempts} attempts`}
          gradient="linear-gradient(135deg,#06C167,#405DE6)"
        />
        <StatCard
          label="Streak"
          value={`${progress.streak.current}🔥`}
          sub={`Best ${progress.streak.best}`}
          gradient="linear-gradient(135deg,#E1306C,#9B30BF)"
        />
      </div>

      {/* Milestones */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-ink">Milestones</h2>
            <p className="text-sm text-ink-muted">
              Won by the work itself — {badgesEarned} badge{badgesEarned === 1 ? "" : "s"} earned
              so far.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/daily"
              className="rounded-full bg-ig-135 px-4 py-2 text-sm font-bold text-white shadow-glow transition hover:opacity-95"
            >
              ☀️ Daily
            </Link>
            <Link
              href="/speed"
              className="rounded-full border border-line bg-paper-card px-4 py-2 text-sm font-bold text-ink-soft transition hover:border-credit/50 hover:text-ink"
            >
              ⚡ Speed
            </Link>
            <Link
              href="/cards"
              className="rounded-full border border-line bg-paper-card px-4 py-2 text-sm font-bold text-ink-soft transition hover:border-credit/50 hover:text-ink"
            >
              🃏 Cards
            </Link>
          </div>
        </div>
        <BadgeShelf state={progress} />
      </section>

      {/* Recommendation */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl2 border border-gold/40 bg-gold-soft/30 p-5">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-gold-deep">
            Next best move
          </p>
          <p className="mt-1 font-bold text-ink">{plan.headline}</p>
          <p className="text-sm text-ink-muted">{plan.reason}</p>
        </div>
        {plan.nextLevelId && (
          <Link
            href={`/play/${plan.nextLevelId}/`}
            className="rounded-full bg-ink px-6 py-3 font-bold text-paper transition hover:bg-ink-soft"
          >
            Go ▶
          </Link>
        )}
      </div>

      {/* Weakest concepts */}
      {weak.length > 0 && (
        <section>
          <h2 className="mb-3 text-xl font-black text-ink">Weakest concepts</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {weak.map((item) => (
              <div
                key={item.conceptId}
                className="flex items-center justify-between gap-3 rounded-xl border border-line bg-paper-card px-4 py-3 shadow-card"
              >
                <div className="min-w-0">
                  <p className="truncate font-bold text-ink">
                    {CONCEPTS[item.conceptId].name}
                  </p>
                  <div className="mt-1.5 h-2 w-40 overflow-hidden rounded-full bg-paper-sunken">
                    <div
                      className={`h-full rounded-full ${item.percent < 50 ? "bg-bad" : "bg-credit"}`}
                      style={{ width: `${item.percent}%` }}
                    />
                  </div>
                </div>
                <span
                  className={`font-mono text-sm font-black ${
                    item.percent < 50 ? "text-bad" : "text-credit"
                  }`}
                >
                  {item.percent}%
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-xl font-black text-ink">Concept mastery</h2>
        <MasteryMap mastery={progress.mastery} focusWeakest />
      </section>

      <section>
        <h2 className="mb-3 text-xl font-black text-ink">Misconception map</h2>
        <p className="mb-3 text-sm text-ink-muted">
          Repeating the same kind of error is information. Zoxdi counts it, names
          it, and recommends the exercise that removes it.
        </p>
        <MisconceptionMap counts={progress.misconceptionCounts} />
      </section>

      <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl2 border border-line bg-paper-card p-5 text-sm text-ink-muted shadow-card">
        <p>
          Progress is saved to your Zoxdi account and follows you to any device.{" "}
          Mastery estimates use evidence — first-try success, hint usage and retention.
        </p>
        <button
          type="button"
          onClick={confirmReset}
          className="rounded-full border border-bad/40 px-4 py-2 font-bold text-bad transition hover:bg-bad-soft"
        >
          Reset all progress
        </button>
      </section>
    </div>
  );
}
