"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { CHAPTERS, LEVELS, levelsForChapter, type Chapter } from "@/data/accounting";
import { buildLearningPlan } from "@/lib/learning/recommendations";
import { lessonForChapter } from "@/lib/learning/lessons";
import { unlockedLevelIds } from "@/lib/learning/path";
import { TIER_LABEL, TIER_TONE, tierOf } from "@/lib/learning/tiers";
import { useProgressContext } from "@/lib/storage/ProgressContext";

const ACCENT_GRADIENT: Record<Chapter["accent"], string> = {
  gold: "linear-gradient(135deg,#FFD93D,#F58529)",
  debit: "linear-gradient(135deg,#405DE6,#9B30BF)",
  credit: "linear-gradient(135deg,#E1306C,#9B30BF)",
  good: "linear-gradient(135deg,#06C167,#405DE6)",
  ink: "linear-gradient(135deg,#F58529,#E1306C)",
};

export default function LearnPage() {
  const { progress, profile } = useProgressContext();
  const router = useRouter();

  const unlocked = new Set(unlockedLevelIds(LEVELS, progress.completedLevelIds));
  const plan = buildLearningPlan(progress.mastery, LEVELS, progress.completedLevelIds);
  const completed = progress.completedLevelIds.length;
  const overall = Math.round((completed / LEVELS.length) * 100);

  return (
    <div className="space-y-8 py-6">
      {/* Continue hero */}
      <section className="overflow-hidden rounded-xl3 grad-ig p-1">
        <div className="rounded-[calc(1.75rem-4px)] bg-paper-card p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-5">
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-wide text-credit">
                {profile ? profile.shopName : "Your path"}
              </p>
              <h1 className="mt-1 text-2xl font-black text-ink sm:text-3xl">
                {plan.nextLevelId ? plan.headline : "All caught up!"}
              </h1>
              <p className="mt-1 max-w-xl text-sm text-ink-muted">{plan.reason}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-bold">
                <span className="rounded-full bg-gold-soft px-3 py-1 text-gold-deep">
                  ⚡ {progress.xp.total.toLocaleString()} XP
                </span>
                <span className="rounded-full bg-good-soft px-3 py-1 text-good">
                  ✓ {completed}/{LEVELS.length} levels
                </span>
                <span className="rounded-full bg-credit-soft px-3 py-1 text-credit-deep">
                  🔥 {progress.streak.current} day streak
                </span>
              </div>
            </div>
            {plan.nextLevelId && (
              <button
                type="button"
                onClick={() => router.push(`/play/${plan.nextLevelId}/`)}
                className="shrink-0 rounded-full bg-ig-135 px-7 py-3.5 font-black text-white shadow-glow transition hover:opacity-95"
              >
                Continue ▶
              </button>
            )}
          </div>

          {/* Overall progress bar */}
          <div className="mt-5">
            <div className="h-3 overflow-hidden rounded-full bg-paper-sunken">
              <div
                className="h-full rounded-full grad-ig transition-all duration-700"
                style={{ width: `${overall}%` }}
              />
            </div>
            <p className="mt-1.5 text-right text-xs font-bold text-ink-muted">{overall}% complete</p>
          </div>
        </div>
      </section>

      {/* The adventure path */}
      <div className="space-y-6">
        {CHAPTERS.map((chapter) => {
          const chapterLevels = levelsForChapter(chapter.id);
          const done = chapterLevels.filter((level) =>
            progress.completedLevelIds.includes(level.id),
          ).length;
          const chapterLocked = !chapterLevels.some((level) => unlocked.has(level.id));
          const chapterComplete = done === chapterLevels.length;
          const lesson = lessonForChapter(chapter.id);

          return (
            <section
              key={chapter.id}
              className={`overflow-hidden rounded-xl2 border border-line bg-paper-card shadow-card ${
                chapterLocked ? "opacity-70" : ""
              }`}
            >
              <header className="flex flex-wrap items-center gap-3 p-4 sm:p-5">
                <span
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-xl font-black text-white shadow-card"
                  style={{ backgroundImage: ACCENT_GRADIENT[chapter.accent] }}
                >
                  {chapter.order}
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-black text-ink">{chapter.title}</h2>
                  <p className="text-sm text-ink-muted">{chapter.description}</p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide ${
                    chapterComplete
                      ? "bg-good-soft text-good"
                      : done > 0
                        ? "bg-credit-soft text-credit-deep"
                        : "bg-paper-sunken text-ink-muted"
                  }`}
                >
                  {chapterComplete ? "★ " : ""}
                  {done}/{chapterLevels.length}
                </span>
              </header>

              {lesson && (
                <div className="mx-4 mb-3 flex flex-wrap items-center gap-3 rounded-xl2 border border-credit/30 bg-credit-soft/30 px-3 py-2.5 sm:mx-6">
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-lg"
                    aria-hidden="true"
                  >
                    {lesson.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-black uppercase tracking-wide text-credit-deep">
                      Learn first · before this chapter
                    </p>
                    <p className="truncate text-sm font-bold text-ink">{lesson.title}</p>
                  </div>
                  <Link
                    href={`/lessons/${lesson.slug}`}
                    className="shrink-0 rounded-full border border-credit/40 bg-paper-card px-3 py-1.5 text-xs font-black text-credit-deep transition hover:bg-credit-soft"
                  >
                    Why &amp; how ▶
                  </Link>
                </div>
              )}

              <div className="relative px-4 pb-5 sm:px-6">
                {chapterLevels.map((level, index) => {
                  const locked = !unlocked.has(level.id);
                  const isDone = progress.completedLevelIds.includes(level.id);
                  const isNext = plan.nextLevelId === level.id;
                  const isLast = index === chapterLevels.length - 1;
                  const nodeStyle = isDone
                    ? "bg-good text-white"
                    : locked
                      ? "bg-paper-sunken text-ink-muted border border-line"
                      : isNext
                        ? "bg-ig-135 text-white"
                        : "bg-paper-sunken text-ink border border-line";
                  return (
                    <div key={level.id} className="relative flex items-stretch gap-4 pb-3 last:pb-0">
                      {!isLast && (
                        <span
                          className={`absolute bottom-0 left-[19px] top-11 w-1 rounded-full ${
                            isDone ? "bg-good/50" : "border-l-2 border-dashed border-line"
                          }`}
                        />
                      )}
                      <span
                        className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-black shadow-card ${nodeStyle} ${
                          isNext ? "animate-ring-pulse" : ""
                        }`}
                      >
                        {isDone ? "✓" : locked ? "🔒" : level.order}
                      </span>
                      <button
                        type="button"
                        disabled={locked}
                        onClick={() => router.push(`/play/${level.id}/`)}
                        className={`group flex min-w-0 flex-1 items-center gap-3 rounded-xl2 border p-3 text-left transition ${
                          locked
                            ? "cursor-not-allowed border-line/60 opacity-55"
                            : isNext
                              ? "border-credit/60 bg-credit-soft/30 hover:shadow-lift"
                              : "border-line hover:-translate-y-0.5 hover:border-credit/40 hover:shadow-card"
                        }`}
                      >
                        <span className="min-w-0 flex-1">
                          <span className="flex min-w-0 items-center gap-2">
                            <span className="truncate text-sm font-extrabold text-ink">
                              {level.title}
                            </span>
                            <span
                              className={`shrink-0 rounded-full px-1.5 py-0.5 text-[11px] font-black uppercase tracking-wide ${
                                TIER_TONE[tierOf(level.order)]
                              }`}
                            >
                              {TIER_LABEL[tierOf(level.order)]}
                            </span>
                          </span>
                          <span className="block truncate text-xs text-ink-muted">
                            {level.subtitle}
                          </span>
                        </span>
                        {!locked && (
                          <span
                            className={`shrink-0 text-xs font-black uppercase tracking-wide ${
                              isNext ? "text-credit" : "text-ink-muted group-hover:text-credit"
                            }`}
                          >
                            {isDone ? "Replay" : isNext ? "Start ▶" : "Play"}
                          </span>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {/* Nudge to the Lab */}
      <section className="flex flex-wrap items-center justify-between gap-4 rounded-xl2 border border-debit/40 bg-debit-soft/40 p-5">
        <div>
          <h2 className="text-lg font-black text-ink">Want to see it all at once?</h2>
          <p className="text-sm text-ink-muted">
            The Account Lab is your own practice book — post entries and watch every statement
            update live.
          </p>
        </div>
        <Link
          href="/lab"
          className="rounded-full bg-ink px-6 py-3 font-bold text-paper transition hover:bg-ink-soft"
        >
          🧪 Open Account Lab
        </Link>
      </section>
    </div>
  );
}
