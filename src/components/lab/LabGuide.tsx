"use client";

import { useState } from "react";

interface Step {
  icon: string;
  title: string;
  body: string;
}

const STEPS: Step[] = [
  {
    icon: "✍️",
    title: "Add a transaction",
    body: "Pick Debit or Credit, choose an account from the list, and type the amount. Add a second line for the other side of the entry.",
  },
  {
    icon: "🩺",
    title: "It checks your entry",
    body: "The moment the two sides are unequal — or a line is empty — Zoxdi tells you exactly what is wrong and how to fix it.",
  },
  {
    icon: "📒",
    title: "T-accounts (the ledger)",
    body: "Every entry you post lands in the ledger. Each account shows its debits, its credits and its running balance.",
  },
  {
    icon: "⚖️",
    title: "Trial balance",
    body: "All the account balances line up in two columns. Total debits must equal total credits — that is what keeps the books honest.",
  },
  {
    icon: "📈",
    title: "Income statement",
    body: "Revenue minus expenses for the period. The bottom line is the profit or the loss.",
  },
  {
    icon: "🏦",
    title: "Balance sheet",
    body: "What the business owns (assets) against what it owes and what the owner put in. Assets always equal liabilities plus equity.",
  },
];

/**
 * A short, skippable tour of the Lab. It appears once on a first visit, and can
 * be reopened any time from the "How it works" button.
 */
export function LabGuide({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [step, setStep] = useState(0);
  if (!open) return null;

  const current = STEPS[step];
  const last = step === STEPS.length - 1;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-ink/40 p-3 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="Account Lab guide"
    >
      <div className="w-full max-w-md animate-bounce-in overflow-hidden rounded-xl3 border border-line bg-paper-card shadow-lift">
        <div className="grad-ig h-1.5 w-full" />
        <div className="p-6">
          <div className="flex items-center justify-between">
            <span className="rounded-full bg-ig-soft px-3 py-1 text-[11px] font-black uppercase tracking-wide text-credit-deep">
              Account Lab · How it works
            </span>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full px-2 text-sm font-black text-ink-muted transition hover:text-ink"
              aria-label="Skip the guide"
            >
              Skip ✕
            </button>
          </div>

          <p className="mt-5 text-4xl" aria-hidden="true">{current.icon}</p>
          <h2 className="mt-2 text-xl font-black text-ink">{current.title}</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{current.body}</p>

          <div className="mt-5 flex items-center justify-center gap-1.5">
            {STEPS.map((item, index) => (
              <span
                key={item.title}
                className={`h-1.5 rounded-full transition-all ${
                  index === step ? "w-6 bg-credit" : "w-1.5 bg-line"
                }`}
              />
            ))}
          </div>

          <div className="mt-5 flex items-center justify-between gap-2">
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
              onClick={() => (last ? onClose() : setStep((value) => value + 1))}
              className="rounded-full bg-ig-135 px-6 py-2.5 text-sm font-black text-white shadow-glow transition hover:opacity-95"
            >
              {last ? "Start practising 🚀" : "Next →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
