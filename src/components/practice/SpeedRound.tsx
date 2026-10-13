"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChoiceList } from "@/components/game/ChoiceList";
import {
  SPEED_LENGTH,
  SPEED_SECONDS,
  buildDrillPool,
  speedQuestions,
  speedXp,
  todayKey,
} from "@/lib/learning/drill";
import { useProgressContext } from "@/lib/storage/ProgressContext";
import { playSfx } from "@/lib/fx/sound";
import { Confetti } from "@/components/fx/Confetti";

export function SpeedRound() {
  const { progress, awardXp, update } = useProgressContext();
  const today = useMemo(() => todayKey(), []);
  const pool = useMemo(() => buildDrillPool(), []);
  const questions = useMemo(() => speedQuestions(pool, today, SPEED_LENGTH), [pool, today]);

  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(SPEED_SECONDS);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);
  const [combo, setCombo] = useState(0);
  const [burst, setBurst] = useState(0);
  const awarded = useRef(false);

  const question = finished ? null : questions[index];
  const timesUp = secondsLeft <= 0;
  const perfect = score >= questions.length;

  // Ticking clock.
  useEffect(() => {
    if (!started || finished) return;
    const timer = window.setInterval(() => {
      setSecondsLeft((seconds) => Math.max(0, seconds - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [started, finished]);

  // When the clock hits zero the round is over, exactly as it is in a race.
  useEffect(() => {
    if (started && timesUp && !finished) setFinished(true);
  }, [started, timesUp, finished]);

  const answer = (optionId: string) => {
    if (!question || picked || timesUp || finished) return;
    setPicked(optionId);
    if (optionId === question.correctOptionId) {
      setScore((current) => current + 1);
      setCombo((current) => current + 1);
      playSfx("correct");
    } else {
      setCombo(0);
      playSfx("wrong");
    }
    window.setTimeout(() => {
      setPicked(null);
      if (index + 1 >= questions.length) {
        setFinished(true);
      } else {
        setIndex((current) => current + 1);
      }
    }, 400);
  };

  // One XP award per day; replays can still beat the best-score record.
  useEffect(() => {
    if (!finished || awarded.current) return;
    awarded.current = true;
    awardXp(`speed:${today}`, speedXp(score));
    if (score >= questions.length) {
      playSfx("levelup");
      setBurst((count) => count + 1);
    } else if (score > 0) {
      playSfx("coin");
    }
    update((current) => ({
      ...current,
      speed: {
        best: Math.max(current.speed.best, score),
        plays: current.speed.plays + 1,
        lastScore: score,
      },
    }));
  }, [finished, score, today, awardXp, update]);

  const circle = 2 * Math.PI * 34;
  const fraction = secondsLeft / SPEED_SECONDS;

  return (
    <div className="space-y-5">
      <Confetti burstKey={burst} />
      {/* Best-score header */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl2 border border-line bg-paper-card px-4 py-3 shadow-card">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-credit-soft text-xl" aria-hidden="true">
            ⚡
          </span>
          <div>
            <p className="font-mono text-xl font-black text-ink">
              {progress.speed.best}
              <span className="ml-1 text-xs font-bold text-ink-muted">best score</span>
            </p>
            <p className="text-xs text-ink-muted">
              {progress.speed.plays} rounds · {SPEED_SECONDS}s · no hints
            </p>
          </div>
        </div>
        {started && !finished && (
          <div className="flex items-center gap-3">
            {combo >= 2 && (
              <span
                key={combo}
                className="animate-bounce-in rounded-full bg-credit-soft px-3 py-1 text-sm font-black text-credit-deep"
              >
                🔥 x{combo}
              </span>
            )}
            <span className="font-mono text-sm font-black text-ink-muted">
              {score} / {questions.length}
            </span>
            <svg width="80" height="80" viewBox="0 0 80 80" className="-rotate-90" aria-hidden="true">
              <circle cx="40" cy="40" r="34" fill="none" stroke="var(--line)" strokeWidth="7" />
              <circle
                cx="40"
                cy="40"
                r="34"
                fill="none"
                stroke={fraction <= 0.25 ? "var(--bad)" : "var(--credit)"}
                strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray={`${(fraction * circle).toFixed(1)} ${circle.toFixed(1)}`}
                style={{ transition: "stroke-dasharray 1s linear, stroke 0.4s" }}
              />
              <text
                x="40"
                y="46"
                textAnchor="middle"
                className="fill-ink font-mono"
                fontSize="16"
                fontWeight="900"
              >
                {secondsLeft}
              </text>
            </svg>
          </div>
        )}
      </div>

      {!started ? (
        <div className="rounded-xl3 border border-line bg-paper-card p-6 shadow-card animate-slide-up">
          <p className="text-xs font-black uppercase tracking-wide text-credit">Speed Round</p>
          <h2 className="mt-1 text-2xl font-black text-ink">Five questions. One minute. Go.</h2>
          <ul className="mt-3 space-y-1.5 text-sm text-ink-muted">
            <li>⚡ {questions.length} questions, {SPEED_SECONDS} seconds on the clock.</li>
            <li>✨ No hints, no explanations mid-round — just answer.</li>
            <li>🏆 Beat your best to top the board. XP rewards once per day.</li>
          </ul>
          <button
            type="button"
            onClick={() => {
              playSfx("start");
              setStarted(true);
            }}
            className="mt-5 rounded-full bg-ig-135 px-7 py-3 font-black text-white shadow-glow transition hover:opacity-95"
          >
            Start the clock ▶
          </button>
        </div>
      ) : !finished ? (
        question && (
          <div className="rounded-xl3 border border-line bg-paper-card p-5 shadow-card animate-slide-up">
            <div className="mb-4 flex items-center gap-1.5">
              {questions.map((item, itemIndex) => (
                <span
                  key={item.id}
                  className={`h-2 flex-1 rounded-full ${
                    itemIndex < index ? "bg-good" : itemIndex === index ? "bg-credit" : "bg-paper-sunken"
                  }`}
                />
              ))}
            </div>
            <p className="text-xs font-black uppercase tracking-wide text-ink-muted">
              Question {index + 1} of {questions.length}
            </p>
            <h3 className="mt-1 text-lg font-black leading-snug text-ink sm:text-xl">
              {question.prompt}
            </h3>
            <div className="mt-4">
              <ChoiceList
                options={question.options}
                value={picked}
                onChange={answer}
                disabled={picked !== null}
              />
            </div>
            {picked && (
              <p
                className={`mt-3 text-sm font-black ${
                  picked === question.correctOptionId ? "text-good" : "text-bad"
                }`}
              >
                {picked === question.correctOptionId ? "✓" : "✗"}
              </p>
            )}
          </div>
        )
      ) : (
        <div className="rounded-xl3 border border-line bg-paper-card p-6 text-center shadow-card animate-slide-up">
          <p className="text-5xl animate-bounce-in" aria-hidden="true">
            {perfect ? "🏆" : score >= 4 ? "⚡" : score >= 2 ? "💪" : "🕐"}
          </p>
          <p className="mt-2 font-mono text-3xl font-black text-ink">{score} / {questions.length}</p>
          <p className="mt-1 text-sm font-semibold text-ink-muted">
            {perfect
              ? "Flawless — every second counted."
              : score >= Math.max(1, progress.speed.best - 1) && score > 0
                ? "Beating the clock, one click at a time."
                : "Speed comes from practice — run it again!"}
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            <span className="rounded-full bg-ig-135 px-4 py-1.5 font-mono font-black text-white">
              +{speedXp(score).toLocaleString()} XP today
            </span>
            <span className="rounded-full bg-paper-sunken px-4 py-1.5 font-mono font-black text-ink">
              Best: {Math.max(progress.speed.best, score)}/{questions.length}
            </span>
          </div>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={() => {
                playSfx("start");
                setStarted(true);
                setFinished(false);
                setIndex(0);
                setScore(0);
                setSecondsLeft(SPEED_SECONDS);
                setPicked(null);
                setCombo(0);
                awarded.current = false;
              }}
              className="rounded-full bg-ig-135 px-5 py-2.5 text-sm font-black text-white shadow-glow transition hover:opacity-95"
            >
              ↻ Run it again
            </button>
            <Link
              href="/daily"
              className="rounded-full border border-line bg-paper-card px-5 py-2.5 text-sm font-bold text-ink-soft transition hover:border-credit/50 hover:text-ink"
            >
              ☀️ Daily challenge
            </Link>
            <Link
              href="/leaderboard"
              className="rounded-full border border-line bg-paper-card px-5 py-2.5 text-sm font-bold text-ink-soft transition hover:border-credit/50 hover:text-ink"
            >
              🏆 Leaderboard
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
