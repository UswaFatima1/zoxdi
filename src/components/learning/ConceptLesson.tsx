"use client";

import { useState } from "react";
import Link from "next/link";
import type { Side } from "@/lib/accounting/types";
import type { Lesson, LessonAccent, LessonVisual as VisualId } from "@/lib/learning/lessons";
import { playSfx } from "@/lib/fx/sound";
import { Confetti } from "@/components/fx/Confetti";

const STEPS = ["Why", "How", "See it", "Your turn", "Ready"];

const ACCENT_GRADIENT: Record<LessonAccent, string> = {
  gold: "linear-gradient(135deg,#FFD93D,#F58529)",
  debit: "linear-gradient(135deg,#405DE6,#9B30BF)",
  credit: "linear-gradient(135deg,#E1306C,#9B30BF)",
  good: "linear-gradient(135deg,#06C167,#405DE6)",
  ink: "linear-gradient(135deg,#F58529,#E1306C)",
};

/** Renders `**bold**` inside a plain sentence. */
function Rich({ text }: { text: string }) {
  const parts = text.split("**");
  return (
    <>
      {parts.map((part, index) =>
        index % 2 === 1 ? (
          <b key={index} className="font-black text-ink">
            {part}
          </b>
        ) : (
          <span key={index}>{part}</span>
        ),
      )}
    </>
  );
}

function SideChip({ side, children }: { side: Side; children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-black ${
        side === "debit" ? "bg-debit text-white" : "bg-credit text-white"
      }`}
    >
      {side === "debit" ? "Dr" : "Cr"} {children}
    </span>
  );
}

/**
 * Small, static illustrations. Each one is the "shape" of the idea, so a
 * student can picture it before they ever build one.
 */
function LessonVisual({ id }: { id: VisualId }) {
  if (id === "equation") {
    return (
      <div className="flex flex-wrap items-center justify-center gap-2 rounded-xl2 border-2 border-line bg-paper p-4 text-center">
        <span className="rounded-lg bg-debit-soft px-3 py-2 text-sm font-black text-debit-deep">
          Assets
        </span>
        <span className="text-lg font-black text-ink-muted">=</span>
        <span className="rounded-lg bg-credit-soft px-3 py-2 text-sm font-black text-credit-deep">
          Liabilities
        </span>
        <span className="text-lg font-black text-ink-muted">+</span>
        <span className="rounded-lg bg-gold-soft px-3 py-2 text-sm font-black text-gold-deep">
          Equity
        </span>
      </div>
    );
  }

  if (id === "journal") {
    return (
      <div className="overflow-hidden rounded-xl2 border-2 border-line bg-paper text-sm">
        <div className="grid grid-cols-[1fr_auto_auto] gap-2 border-b border-line bg-paper-sunken/60 px-3 py-2 text-[11px] font-black uppercase tracking-wide text-ink-muted">
          <span>Account</span>
          <span className="w-20 text-right">Debit</span>
          <span className="w-20 text-right">Credit</span>
        </div>
        <div className="grid grid-cols-[1fr_auto_auto] gap-2 px-3 py-2 font-semibold text-ink">
          <span>Cash</span>
          <span className="w-20 text-right font-mono">8,000</span>
          <span className="w-20 text-right font-mono text-ink-muted">—</span>
        </div>
        <div className="grid grid-cols-[1fr_auto_auto] gap-2 border-t border-line px-3 py-2 font-semibold text-ink">
          <span className="pl-4">Sales Revenue</span>
          <span className="w-20 text-right font-mono text-ink-muted">—</span>
          <span className="w-20 text-right font-mono">8,000</span>
        </div>
      </div>
    );
  }

  if (id === "ledger") {
    return (
      <div className="overflow-hidden rounded-xl2 border-2 border-line bg-paper">
        <div className="border-b border-line bg-paper-sunken/60 px-4 py-2 text-center text-sm font-black text-ink">
          Cash (T-account)
        </div>
        <div className="grid grid-cols-2 divide-x divide-line text-center text-sm">
          <div className="px-3 py-3">
            <p className="text-[11px] font-black uppercase tracking-wide text-debit-deep">Debit</p>
            <p className="mt-1 font-mono font-bold text-ink">100,000</p>
          </div>
          <div className="px-3 py-3">
            <p className="text-[11px] font-black uppercase tracking-wide text-credit-deep">Credit</p>
            <p className="mt-1 font-mono font-bold text-ink">25,000</p>
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-line bg-paper-sunken/40 px-4 py-1.5 text-xs">
          <span className="font-bold text-ink-muted">Balance</span>
          <span className="font-mono font-black text-ink">75,000 Dr</span>
        </div>
      </div>
    );
  }

  if (id === "trial") {
    return (
      <div className="overflow-hidden rounded-xl2 border-2 border-line bg-paper text-sm">
        <div className="grid grid-cols-[1fr_auto_auto] gap-2 border-b border-line bg-paper-sunken/60 px-3 py-2 text-[11px] font-black uppercase tracking-wide text-ink-muted">
          <span>Account</span>
          <span className="w-20 text-right">Debit</span>
          <span className="w-20 text-right">Credit</span>
        </div>
        {[
          ["Cash", "75,000", "—"],
          ["Rent Expense", "25,000", "—"],
          ["Capital", "—", "100,000"],
        ].map(([name, dr, cr]) => (
          <div
            key={name}
            className="grid grid-cols-[1fr_auto_auto] gap-2 border-b border-line/60 px-3 py-2 font-semibold text-ink"
          >
            <span>{name}</span>
            <span className="w-20 text-right font-mono">{dr}</span>
            <span className="w-20 text-right font-mono">{cr}</span>
          </div>
        ))}
        <div className="grid grid-cols-[1fr_auto_auto] gap-2 bg-good-soft/40 px-3 py-2 font-black text-good">
          <span>Totals</span>
          <span className="w-20 text-right font-mono">100,000</span>
          <span className="w-20 text-right font-mono">100,000</span>
        </div>
      </div>
    );
  }

  // statements
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="overflow-hidden rounded-xl2 border-2 border-line bg-paper text-sm">
        <div className="border-b border-line bg-paper-sunken/60 px-3 py-2 text-[11px] font-black uppercase tracking-wide text-ink-muted">
          Income statement
        </div>
        <div className="space-y-1 px-3 py-2 font-semibold text-ink">
          <p className="flex justify-between">
            <span>Revenue</span>
            <span className="font-mono">8,000</span>
          </p>
          <p className="flex justify-between text-ink-muted">
            <span>Expenses</span>
            <span className="font-mono">(6,000)</span>
          </p>
          <p className="flex justify-between border-t border-line pt-1 font-black text-good">
            <span>Profit</span>
            <span className="font-mono">2,000</span>
          </p>
        </div>
      </div>
      <div className="overflow-hidden rounded-xl2 border-2 border-line bg-paper text-sm">
        <div className="border-b border-line bg-paper-sunken/60 px-3 py-2 text-[11px] font-black uppercase tracking-wide text-ink-muted">
          Balance sheet
        </div>
        <div className="space-y-1 px-3 py-2 font-semibold text-ink">
          <p className="flex justify-between">
            <span>Assets</span>
            <span className="font-mono">75,000</span>
          </p>
          <p className="flex justify-between text-ink-muted">
            <span>Liabilities</span>
            <span className="font-mono">40,000</span>
          </p>
          <p className="flex justify-between text-ink-muted">
            <span>Equity</span>
            <span className="font-mono">35,000</span>
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * The shared "why and how" lesson a student sees before meeting a new concept.
 * Content comes from `src/lib/learning/lessons.ts`, so new concepts only need
 * data, not a new page.
 */
export function ConceptLesson({ lesson }: { lesson: Lesson }) {
  const [step, setStep] = useState(0);
  const [qIndex, setQIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [burst, setBurst] = useState(0);

  const total = lesson.questions.length;
  const current = lesson.questions[qIndex];
  const answeredCorrectly = picked !== null && current?.options[picked]?.correct === true;

  const answer = (index: number) => {
    if (picked !== null) return;
    setPicked(index);
    if (lesson.questions[qIndex].options[index].correct) {
      setScore((value) => value + 1);
      playSfx("correct");
    } else {
      playSfx("wrong");
    }
  };

  const nextQuestion = () => {
    if (qIndex + 1 < total) {
      setQIndex((value) => value + 1);
      setPicked(null);
    } else {
      setStep(4);
      setBurst((value) => value + 1);
      playSfx("levelup");
    }
  };

  const restart = () => {
    setStep(0);
    setQIndex(0);
    setPicked(null);
    setScore(0);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5 py-6">
      <Confetti burstKey={burst} count={70} />

      {/* Progress dots */}
      <div className="flex items-center justify-center gap-1.5">
        {STEPS.map((label, i) => (
          <span
            key={label}
            className={`h-1.5 rounded-full transition-all ${
              i === step ? "w-8 bg-ig-135" : i < step ? "w-4 bg-good" : "w-4 bg-line"
            }`}
          />
        ))}
      </div>

      <section className="overflow-hidden rounded-xl3 border border-line bg-paper-card shadow-lift">
        <div className="h-1.5 w-full" style={{ backgroundImage: ACCENT_GRADIENT[lesson.accent] }} />
        <div className="p-6 sm:p-8">
          <p className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-credit">
            <span aria-hidden="true">{lesson.icon}</span>
            {lesson.eyebrow} · {STEPS[step]}
          </p>

          {step === 0 && (
            <div className="mt-3 space-y-4">
              <h1 className="text-2xl font-black text-ink sm:text-3xl">{lesson.title}</h1>
              <h2 className="text-sm font-black uppercase tracking-wide text-ink-muted">
                {lesson.why.heading}
              </h2>
              <p className="text-ink-muted">{lesson.why.body}</p>
              <ul className="space-y-2">
                {lesson.why.points.map((point) => (
                  <li key={point} className="flex gap-2 text-sm text-ink-soft">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-credit" aria-hidden="true" />
                    <span>
                      <Rich text={point} />
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {step === 1 && (
            <div className="mt-3 space-y-4">
              <h1 className="text-2xl font-black text-ink sm:text-3xl">{lesson.how.heading}</h1>
              <p className="text-ink-muted">{lesson.how.body}</p>
              <LessonVisual id={lesson.visual} />
              <ul className="space-y-2">
                {lesson.how.points.map((point) => (
                  <li key={point} className="flex gap-2 text-sm text-ink-soft">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-credit" aria-hidden="true" />
                    <span>
                      <Rich text={point} />
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {step === 2 && (
            <div className="mt-3 space-y-4">
              <h1 className="text-2xl font-black text-ink sm:text-3xl">See it work</h1>
              <div className="rounded-xl2 border border-line bg-paper p-4">
                <p className="text-sm font-bold text-ink">{lesson.example.scenario}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {lesson.example.lines.map((line) => (
                    <SideChip key={line.text} side={line.side}>
                      {line.text}
                    </SideChip>
                  ))}
                </div>
              </div>
              <p className="text-sm text-ink-muted">{lesson.example.note}</p>
            </div>
          )}

          {step === 3 && current && (
            <div className="mt-3 space-y-5">
              <p className="text-xs font-black uppercase tracking-wide text-ink-muted">
                Question {qIndex + 1} of {total} · Score {score}
              </p>
              <h1 className="text-xl font-black text-ink sm:text-2xl">{current.prompt}</h1>

              <div className="space-y-2.5">
                {current.options.map((option, index) => {
                  const isPicked = picked === index;
                  const tone = isPicked
                    ? option.correct
                      ? "border-good bg-good-soft/60 text-good"
                      : "border-bad bg-bad-soft/60 text-bad"
                    : picked !== null && option.correct
                      ? "border-good/60 text-good"
                      : "border-line text-ink hover:border-credit/60";
                  return (
                    <button
                      key={option.label}
                      type="button"
                      onClick={() => answer(index)}
                      disabled={picked !== null}
                      className={`flex w-full items-center justify-between gap-3 rounded-xl2 border-2 px-4 py-3 text-left text-sm font-bold transition ${tone}`}
                    >
                      <span>{option.label}</span>
                      {isPicked && <span aria-hidden="true">{option.correct ? "✓" : "✗"}</span>}
                    </button>
                  );
                })}
              </div>

              {picked !== null && (
                <div
                  className={`animate-rise rounded-xl border px-4 py-3 text-sm font-semibold ${
                    answeredCorrectly
                      ? "border-good/40 bg-good-soft/60 text-good"
                      : "border-bad/40 bg-bad-soft/60 text-bad"
                  }`}
                >
                  <p className="font-black">{answeredCorrectly ? "Correct!" : "Not quite."}</p>
                  <p className="mt-0.5">{current.explain}</p>
                </div>
              )}
            </div>
          )}

          {step === 4 && (
            <div className="mt-3 space-y-4 text-center">
              <p className="text-5xl" aria-hidden="true">
                🎉
              </p>
              <h1 className="text-2xl font-black text-ink sm:text-3xl">That's the idea.</h1>
              <p className="text-ink-muted">
                You scored <b>{score}/{total}</b>. You know why this exists and how it works — time
                to put it to use.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Link
                  href={lesson.next.href}
                  className="rounded-full bg-ig-135 px-7 py-3.5 font-black text-white shadow-glow transition hover:opacity-95"
                >
                  {lesson.next.label}
                </Link>
                <button
                  type="button"
                  onClick={restart}
                  className="rounded-full border border-line px-6 py-3.5 font-bold text-ink-soft transition hover:text-ink"
                >
                  Replay lesson
                </button>
              </div>
            </div>
          )}

          {/* Footer controls */}
          {step < 3 && (
            <div className="mt-6 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep((value) => Math.max(0, value - 1))}
                disabled={step === 0}
                className="rounded-full border border-line px-4 py-2 text-sm font-bold text-ink-muted transition hover:text-ink disabled:opacity-40"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => {
                  playSfx("select");
                  setStep((value) => value + 1);
                }}
                className="rounded-full bg-ig-135 px-6 py-2.5 text-sm font-black text-white shadow-glow transition hover:opacity-95"
              >
                Next →
              </button>
            </div>
          )}

          {step === 3 && picked !== null && (
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={nextQuestion}
                className="rounded-full bg-ig-135 px-7 py-2.5 text-sm font-black text-white shadow-glow transition hover:opacity-95"
              >
                {qIndex + 1 < total ? "Next question →" : "Finish ✓"}
              </button>
            </div>
          )}
        </div>
      </section>

      {step < 4 && (
        <div className="text-center">
          <Link
            href="/learn"
            className="text-xs font-bold text-ink-muted underline-offset-2 transition hover:text-ink hover:underline"
          >
            Skip the lesson →
          </Link>
        </div>
      )}
    </div>
  );
}
