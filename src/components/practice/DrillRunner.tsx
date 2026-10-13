"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BANK_SIZE,
  BANK_TOPICS,
  DIFFICULTY_BLURB,
  DIFFICULTY_LABEL,
  DIFFICULTY_ORDER,
  DIFFICULTY_TONE,
  countByDifficulty,
  drawQuestions,
  type BankQuestion,
  type Difficulty,
} from "@/lib/questions/bank";
import { playSfx } from "@/lib/fx/sound";
import { Confetti } from "@/components/fx/Confetti";

type Filter = Difficulty | "all";

const RUN_LENGTH = 10;
const STORE_KEY = "zoxdi.drills.v1";

interface DrillStore {
  /** Question ids answered correctly at least once. */
  solved: string[];
  /** Best score per difficulty filter. */
  best: Partial<Record<Filter, number>>;
  /** Current run of correct answers across sessions. */
  streak: number;
}

const EMPTY_STORE: DrillStore = { solved: [], best: {}, streak: 0 };

function loadStore(): DrillStore {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return EMPTY_STORE;
    const parsed = JSON.parse(raw) as Partial<DrillStore>;
    return {
      solved: Array.isArray(parsed.solved) ? parsed.solved : [],
      best: parsed.best ?? {},
      streak: typeof parsed.streak === "number" ? parsed.streak : 0,
    };
  } catch {
    return EMPTY_STORE;
  }
}

function saveStore(store: DrillStore) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(store));
  } catch {
    // Progress is a nicety; a full quota must not break the drill.
  }
}

export function DrillRunner() {
  const [difficulty, setDifficulty] = useState<Filter>("all");
  const [topic, setTopic] = useState<string>("all");
  const [seed, setSeed] = useState("first-run");
  const [index, setIndex] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [burst, setBurst] = useState(0);
  const [store, setStore] = useState<DrillStore>(EMPTY_STORE);

  useEffect(() => {
    setStore(loadStore());
  }, []);

  const counts = useMemo(() => countByDifficulty(), []);
  const run: BankQuestion[] = useMemo(
    () => drawQuestions({ difficulty, topic: topic === "all" ? undefined : topic, count: RUN_LENGTH, seed }),
    [difficulty, topic, seed],
  );

  const question = run[index] ?? null;

  const restart = () => {
    setSeed(`run-${Date.now()}`);
    setIndex(0);
    setChosen(null);
    setScore(0);
    setDone(false);
  };

  const answer = (optionId: string) => {
    if (chosen || !question) return;
    setChosen(optionId);
    const wasCorrect = optionId === question.correctOptionId;
    playSfx(wasCorrect ? "correct" : "wrong");

    setStore((current) => {
      const nextSolved = wasCorrect
        ? current.solved.includes(question.id)
          ? current.solved
          : [...current.solved, question.id]
        : current.solved;
      const nextStreak = wasCorrect ? current.streak + 1 : 0;
      const nextBest = { ...current.best };
      const projected = score + (wasCorrect ? 1 : 0);
      if ((nextBest[difficulty] ?? 0) < projected) nextBest[difficulty] = projected;
      const next: DrillStore = { solved: nextSolved, best: nextBest, streak: nextStreak };
      saveStore(next);
      return next;
    });

    if (wasCorrect) {
      setScore((current) => current + 1);
      setBurst((count) => count + 1);
    }
  };

  const next = () => {
    if (index + 1 >= run.length) {
      setDone(true);
      playSfx(score === run.length ? "levelup" : "click");
      return;
    }
    setIndex((current) => current + 1);
    setChosen(null);
    playSfx("click");
  };

  const pct = Math.round((index / Math.max(1, run.length)) * 100);

  return (
    <div className="space-y-5 py-6">
      <Confetti burstKey={burst} />

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-credit">Drills</p>
          <h1 className="mt-1 text-2xl font-black text-ink sm:text-3xl">
            {BANK_SIZE} questions, one habit
          </h1>
          <p className="mt-1 max-w-xl text-sm text-ink-muted">
            Short runs across classification, balancing, entries and the advanced material. Every
            question is derived from the real chart of accounts, so nothing here can teach you
            something wrong.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-center">
          <div className="rounded-xl2 border border-line bg-paper-card px-4 py-2 shadow-card">
            <p className="text-[11px] font-black uppercase tracking-wide text-ink-muted">Solved</p>
            <p className="font-mono text-lg font-black text-ink">
              {store.solved.length}
              <span className="text-sm text-ink-muted">/{BANK_SIZE}</span>
            </p>
          </div>
          <div className="rounded-xl2 border border-line bg-paper-card px-4 py-2 shadow-card">
            <p className="text-[11px] font-black uppercase tracking-wide text-ink-muted">Streak</p>
            <p className="font-mono text-lg font-black text-ink">🔥 {store.streak}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => {
            setDifficulty("all");
            restart();
          }}
          className={`rounded-full px-3.5 py-1.5 text-xs font-black transition ${
            difficulty === "all" ? "grad-ig text-white" : "border border-line bg-paper-card text-ink-muted hover:text-ink"
          }`}
        >
          All · {BANK_SIZE}
        </button>
        {DIFFICULTY_ORDER.map((level) => (
          <button
            key={level}
            type="button"
            title={DIFFICULTY_BLURB[level]}
            onClick={() => {
              setDifficulty(level);
              restart();
            }}
            className={`rounded-full px-3.5 py-1.5 text-xs font-black transition ${
              difficulty === level ? "grad-ig text-white" : "border border-line bg-paper-card text-ink-muted hover:text-ink"
            }`}
          >
            {DIFFICULTY_LABEL[level]} · {counts[level]}
          </button>
        ))}

        <label className="ml-auto flex items-center gap-2 text-xs font-bold text-ink-muted">
          Topic
          <select
            value={topic}
            onChange={(event) => {
              setTopic(event.target.value);
              restart();
            }}
            className="rounded-lg border border-line bg-paper-card px-2.5 py-1.5 text-xs font-bold text-ink outline-none focus:border-credit"
          >
            <option value="all">All topics</option>
            {BANK_TOPICS.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Progress */}
      <div className="h-2 w-full overflow-hidden rounded-full bg-paper-sunken">
        <div
          className="h-full rounded-full grad-ig transition-all"
          style={{ width: `${done ? 100 : pct}%` }}
        />
      </div>

      {/* Card */}
      {!done && question ? (
        <div className="rounded-xl2 border border-line bg-paper-card p-5 shadow-card sm:p-6">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-wide ${DIFFICULTY_TONE[question.difficulty]}`}>
              {DIFFICULTY_LABEL[question.difficulty]}
            </span>
            <span className="rounded-full bg-paper-sunken px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-ink-muted">
              {question.topic}
            </span>
            <span className="ml-auto text-xs font-bold text-ink-muted">
              {index + 1} / {run.length} · score {score}
            </span>
          </div>

          <p className="text-lg font-bold leading-relaxed text-ink">{question.prompt}</p>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {question.options.map((option) => {
              const isCorrect = option.id === question.correctOptionId;
              const isChosen = option.id === chosen;
              const reveal = chosen !== null;
              const tone = !reveal
                ? "border-line bg-paper hover:border-credit/60"
                : isCorrect
                  ? "border-good bg-good-soft/60"
                  : isChosen
                    ? "border-bad bg-bad-soft/60"
                    : "border-line bg-paper opacity-70";
              return (
                <button
                  key={option.id}
                  type="button"
                  disabled={reveal}
                  onClick={() => answer(option.id)}
                  className={`rounded-xl border-2 px-4 py-3 text-left text-sm font-bold text-ink transition ${tone}`}
                >
                  {reveal && isCorrect ? "✓ " : reveal && isChosen ? "✕ " : ""}
                  {option.label}
                </button>
              );
            })}
          </div>

          {chosen && (
            <div
              className={`mt-4 rounded-xl border px-4 py-3 text-sm font-semibold ${
                chosen === question.correctOptionId
                  ? "border-good/40 bg-good-soft/50 text-good"
                  : "border-bad/40 bg-bad-soft/50 text-bad"
              }`}
            >
              <span className="font-black">
                {chosen === question.correctOptionId ? "Correct." : "Not quite."}
              </span>{" "}
              {question.explanation}
            </div>
          )}

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={next}
              disabled={!chosen}
              className="rounded-full bg-ig-135 px-7 py-3 font-black text-white shadow-glow transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {index + 1 >= run.length ? "Finish run" : "Next question"}
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-xl2 border border-line bg-paper-card p-8 text-center shadow-card">
          <p className="text-5xl">{score === run.length ? "🏆" : score >= 6 ? "🎯" : "💪"}</p>
          <h2 className="mt-3 text-2xl font-black text-ink">
            {score} / {run.length} correct
          </h2>
          <p className="mt-1 text-sm text-ink-muted">
            {score === run.length
              ? "A flawless run. Try a harder tier."
              : score >= 6
                ? "Strong. Read the explanations you missed, then go again."
                : "Every wrong answer is a fact you now get to learn."}
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={restart}
              className="rounded-full bg-ig-135 px-6 py-2.5 font-black text-white shadow-glow transition hover:opacity-95"
            >
              New run
            </button>
            <Link
              href="/learn"
              className="rounded-full border border-line bg-paper-card px-6 py-2.5 font-black text-ink-soft transition hover:border-credit/50"
            >
              Back to the path
            </Link>
          </div>
          <p className="mt-4 text-xs text-ink-muted">
            Best score on this filter: {store.best[difficulty] ?? 0} / {run.length}
          </p>
        </div>
      )}
    </div>
  );
}
