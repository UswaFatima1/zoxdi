"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChoiceList } from "@/components/game/ChoiceList";
import {
  DAILY_LENGTH,
  DAILY_XP_COMPLETION,
  DAILY_XP_PER_CORRECT,
  buildDrillPool,
  dailyQuestions,
  dailyXp,
  todayKey,
} from "@/lib/learning/drill";
import { advanceStreak } from "@/lib/storage/progress";
import { useProgressContext } from "@/lib/storage/ProgressContext";
import { playSfx } from "@/lib/fx/sound";
import { Confetti } from "@/components/fx/Confetti";
import { BadgeShelf } from "./BadgeShelf";

export function DailyChallenge() {
  const { progress, awardXp, update } = useProgressContext();
  const today = useMemo(() => todayKey(), []);
  const pool = useMemo(() => buildDrillPool(), []);
  const questions = useMemo(
    () => dailyQuestions(pool, today, DAILY_LENGTH),
    [pool, today],
  );

  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [results, setResults] = useState<boolean[]>([]);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [burst, setBurst] = useState(0);
  const awarded = useRef(false);

  const finished = step >= questions.length;
  // Show the "come back tomorrow" card only when arriving fresh; the results
  // screen takes over the moment a challenge has just been finished.
  const doneToday = !finished && progress.daily.lastCompletedDay === today;
  const question = finished ? null : questions[step];
  const correctCount = useMemo(() => results.filter(Boolean).length, [results]);

  // Award the once-per-day XP and update streak + daily record exactly once,
  // when the student reaches the results screen.
  useEffect(() => {
    if (!finished || awarded.current) return;
    awarded.current = true;
    const score = results.filter(Boolean).length;
    awardXp(`daily:${today}`, dailyXp(score));
    if (score >= questions.length) {
      playSfx("levelup");
      setBurst((count) => count + 1);
    } else if (score > 0) {
      playSfx("coin");
    }
    update((current) => {
      if (current.daily.lastCompletedDay === today) return current;
      return {
        ...current,
        daily: {
          lastCompletedDay: today,
          completions: current.daily.completions + 1,
          best: Math.max(current.daily.best, score),
        },
        streak: advanceStreak(current.streak, today),
      };
    });
  }, [finished, results, today, awardXp, update]);

  const check = () => {
    if (!question || !selected || checked) return;
    setChecked(true);
    const isRight = selected === question.correctOptionId;
    setResults((current) => [...current, isRight]);
    if (isRight) {
      playSfx("correct");
      const nextCombo = combo + 1;
      setCombo(nextCombo);
      setBestCombo((best) => Math.max(best, nextCombo));
    } else {
      playSfx("wrong");
      setCombo(0);
    }
  };

  const next = () => {
    if (!question) return;
    if (!checked) return;
    setSelected(null);
    setChecked(false);
    setStep((current) => current + 1);
  };

  const won = correctCount >= questions.length;

  return (
    <div className="space-y-5">
      <Confetti burstKey={burst} />
      {/* Streak header */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl2 border border-line bg-paper-card px-4 py-3 shadow-card">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-soft text-xl" aria-hidden="true">
            🔥
          </span>
          <div>
            <p className="font-mono text-xl font-black text-ink">
              {progress.streak.current}
              <span className="ml-1 text-xs font-bold text-ink-muted">day streak</span>
            </p>
            <p className="text-xs text-ink-muted">
              Best: {progress.streak.best} · {progress.daily.completions} challenges finished
            </p>
          </div>
        </div>
        <span className="rounded-full bg-paper-sunken px-3 py-1.5 text-sm font-black text-ink">
          {today}
        </span>
      </div>

      {doneToday ? (
        <div className="rounded-xl3 border border-good/40 bg-good-soft/30 p-6 text-center animate-slide-up">
          <p className="text-4xl" aria-hidden="true">✅</p>
          <h2 className="mt-2 text-2xl font-black text-ink">Today&apos;s challenge is done</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-ink-muted">
            You already balanced today&apos;s {DAILY_LENGTH}. Streaks grow one day at a
            time — come back tomorrow for a fresh set.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Link
              href="/speed"
              className="rounded-full bg-ig-135 px-5 py-2.5 text-sm font-black text-white shadow-glow transition hover:opacity-95"
            >
              ⚡ Try the Speed Round
            </Link>
            <Link
              href="/cards"
              className="rounded-full border border-line bg-paper-card px-5 py-2.5 text-sm font-bold text-ink-soft transition hover:border-credit/50 hover:text-ink"
            >
              🃏 Review flashcards
            </Link>
          </div>
        </div>
      ) : !started ? (
        <div className="rounded-xl3 border border-line bg-paper-card p-6 shadow-card animate-slide-up">
          <p className="text-xs font-black uppercase tracking-wide text-credit">Daily Challenge</p>
          <h2 className="mt-1 text-2xl font-black text-ink">
            Five quick questions, every day.
          </h2>
          <p className="mt-2 max-w-lg text-sm text-ink-muted">
            Two minutes to warm up the bookkeeping brain. Answer fast, learn the
            explanation, and the streak grows. Same set for everyone, changed daily.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setStarted(true)}
              className="rounded-full bg-ig-135 px-6 py-3 font-black text-white shadow-glow transition hover:opacity-95"
            >
              Start today&apos;s challenge ▶
            </button>
            <Link
              href="/speed"
              className="rounded-full border border-line px-6 py-3 text-sm font-bold text-ink-soft transition hover:border-credit/50 hover:text-ink"
            >
              ⚡ Speed Round instead
            </Link>
          </div>
          <p className="mt-3 text-xs text-ink-muted">
            Earn up to {dailyXp(questions.length).toLocaleString()} XP once per day —{" "}
            {DAILY_XP_PER_CORRECT} XP per correct answer, plus a {DAILY_XP_COMPLETION} XP
            finish bonus.
          </p>
        </div>
      ) : !finished ? (
        question && (
          <div className="rounded-xl3 border border-line bg-paper-card p-5 shadow-card animate-slide-up">
            {/* Progress dots */}
            <div className="mb-4 flex items-center gap-1.5">
              {questions.map((item, index) => (
                <span
                  key={item.id}
                  className={`h-2 flex-1 rounded-full transition ${
                    index < step ? "bg-good" : index === step ? "bg-credit" : "bg-paper-sunken"
                  }`}
                />
              ))}
              {combo >= 2 ? (
                <span
                  key={combo}
                  className="ml-2 shrink-0 animate-bounce-in rounded-full bg-credit-soft px-2.5 py-1 text-xs font-black text-credit-deep"
                >
                  🔥 {combo} in a row
                </span>
              ) : (
                <span className="ml-2 shrink-0 font-mono text-xs font-black text-ink-muted">
                  {correctCount}✓
                </span>
              )}
            </div>

            <p className="text-xs font-black uppercase tracking-wide text-ink-muted">
              Question {step + 1} of {questions.length}
            </p>
            <h3 className="mt-1 text-lg font-black leading-snug text-ink sm:text-xl">
              {question.prompt}
            </h3>

            <div className="mt-4">
              <ChoiceList
                options={question.options}
                value={selected}
                onChange={setSelected}
                disabled={checked}
              />
            </div>

            {checked && (
              <div
                className={`mt-4 rounded-xl border px-4 py-3 text-sm animate-rise ${
                  selected === question.correctOptionId
                    ? "border-good/40 bg-good-soft/40 text-good"
                    : "border-bad/40 bg-bad-soft/40 text-bad"
                }`}
              >
                <p className="font-black">
                  {selected === question.correctOptionId
                    ? "Correct!"
                    : "Not quite — here is why:"}
                </p>
                <p className="mt-1 font-semibold text-ink-soft">{question.explanation}</p>
              </div>
            )}

            <div className="mt-4 flex gap-2">
              {!checked ? (
                <button
                  type="button"
                  onClick={check}
                  disabled={!selected}
                  className="rounded-full bg-ig-135 px-6 py-2.5 font-black text-white shadow-glow transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Check answer
                </button>
              ) : (
                <button
                  type="button"
                  onClick={next}
                  className="rounded-full bg-ink px-6 py-2.5 font-black text-paper transition hover:bg-ink-soft"
                >
                  {step === questions.length - 1 ? "See results →" : "Next →"}
                </button>
              )}
              <span className="self-center text-sm font-bold text-ink-muted">
                {checked && selected !== question.correctOptionId ? "Book it & retry next time" : ""}
              </span>
            </div>
          </div>
        )
      ) : (
        <div className="space-y-5 animate-slide-up">
          <div
            className={`rounded-xl3 border p-6 text-center shadow-card ${
              won ? "border-good/40 bg-good-soft/30" : "border-line bg-paper-card"
            }`}
          >
            <p className="text-5xl animate-bounce-in" aria-hidden="true">
              {won ? "🎉" : correctCount >= 3 ? "💪" : "🌱"}
            </p>
            <p className="mt-2 font-mono text-3xl font-black text-ink">
              {correctCount} / {questions.length}
            </p>
            <p className="mt-1 text-sm font-semibold text-ink-muted">
              {won
                ? "Everything balanced! A perfect daily round."
                : correctCount >= 3
                  ? "Strong round — the columns agree."
                  : "Every day balances better. Come back tomorrow."}
            </p>
            <p className="mt-3 inline-block rounded-full bg-ig-135 px-4 py-1.5 font-mono font-black text-white">
              +{dailyXp(correctCount).toLocaleString()} XP
            </p>
            <p className="mt-4 text-xs text-ink-muted">
              Streak: 🔥 {progress.streak.current} · Best daily: {Math.max(progress.daily.best, correctCount)}/{questions.length}
              {bestCombo >= 2 ? ` · Best run: ${bestCombo} in a row` : ""}
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Link
                href="/speed"
                className="rounded-full bg-ig-135 px-5 py-2.5 text-sm font-black text-white shadow-glow transition hover:opacity-95"
              >
                ⚡ Go faster — Speed Round
              </Link>
              <Link
                href="/learn"
                className="rounded-full border border-line bg-paper-card px-5 py-2.5 text-sm font-bold text-ink-soft transition hover:border-credit/50 hover:text-ink"
              >
                Continue the campaign
              </Link>
            </div>
          </div>

          <section>
            <p className="mb-3 text-xs font-black uppercase tracking-wide text-ink-muted">
              Your badges
            </p>
            <BadgeShelf state={progress} limit={8} />
          </section>
        </div>
      )}
    </div>
  );
}
