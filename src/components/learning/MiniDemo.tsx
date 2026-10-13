"use client";

import { useState } from "react";
import { ACCOUNTS } from "@/data/accounting/accounts";
import { ACCOUNT_TYPES, ACCOUNT_TYPE_LABEL, ACCOUNT_TYPE_BLURB } from "@/lib/accounting/rules";
import type { AccountType } from "@/lib/accounting/types";
import { playSfx } from "@/lib/fx/sound";
import { Confetti } from "@/components/fx/Confetti";

/** A curated loop that walks through all five account types, one at a time. */
const DEMO_IDS = [
  "cash",
  "accounts-payable",
  "sales-revenue",
  "rent-expense",
  "capital",
  "inventory",
  "bank-loan",
  "utilities-expense",
];

/**
 * A single playable question, shown before anyone signs up. The point is to let
 * a visitor feel the game — answer, get told *why*, watch it celebrate — rather
 * than read a description of it. It is derived from the real chart of accounts,
 * so nothing here can teach something the curriculum does not.
 */
export function MiniDemo() {
  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState<AccountType | null>(null);
  const [burst, setBurst] = useState(0);

  const account = ACCOUNTS.find((candidate) => candidate.id === DEMO_IDS[step % DEMO_IDS.length])!;
  const correct = picked === account.type;
  const revealed = picked !== null;

  const choose = (type: AccountType) => {
    if (revealed) return;
    setPicked(type);
    if (type === account.type) {
      playSfx("correct");
      setBurst((count) => count + 1);
    } else {
      playSfx("wrong");
    }
  };

  const next = () => {
    setStep((current) => current + 1);
    setPicked(null);
  };

  return (
    <div className="relative overflow-hidden rounded-xl2 border border-line bg-paper-card p-5 shadow-card">
      <Confetti burstKey={burst} count={30} />
      <div className="flex items-center justify-between gap-3">
        <span className="rounded-full bg-ig-soft px-3 py-1 text-[11px] font-black uppercase tracking-wide text-credit-deep">
          Try one question
        </span>
        <span className="font-mono text-[11px] font-bold text-ink-muted">
          {(step % DEMO_IDS.length) + 1}/{DEMO_IDS.length}
        </span>
      </div>

      <p className="mt-4 text-sm font-semibold text-ink-muted">What kind of account is</p>
      <p className="text-2xl font-black text-ink">“{account.name}” ?</p>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {ACCOUNT_TYPES.map((type) => {
          const isCorrect = type === account.type;
          const isPicked = picked === type;
          const state =
            revealed && isCorrect
              ? "border-good bg-good-soft/50 text-good"
              : revealed && isPicked
                ? "border-bad bg-bad-soft/50 text-bad"
                : "border-line bg-paper hover:border-credit/50";
          return (
            <button
              key={type}
              type="button"
              onClick={() => choose(type)}
              disabled={revealed}
              className={`rounded-xl border-2 px-3 py-2 text-sm font-black transition ${state}`}
            >
              {ACCOUNT_TYPE_LABEL[type]}
            </button>
          );
        })}
      </div>

      {revealed ? (
        <div
          className={`mt-3 animate-rise rounded-xl border px-3.5 py-3 text-sm ${
            correct ? "border-good/40 bg-good-soft/40" : "border-credit/40 bg-credit-soft/30"
          }`}
        >
          <p className={`font-black ${correct ? "text-good" : "text-credit-deep"}`}>
            {correct ? "Correct! 🎉" : `Not quite — it's ${ACCOUNT_TYPE_LABEL[account.type]}.`}
          </p>
          <p className="mt-1 font-semibold text-ink-soft">
            {ACCOUNT_TYPE_BLURB[account.type]} {account.description}
          </p>
          <button
            type="button"
            onClick={next}
            className="mt-3 rounded-full bg-ink px-5 py-2 text-sm font-black text-paper transition hover:bg-ink-soft"
          >
            Next question →
          </button>
        </div>
      ) : (
        <p className="mt-3 text-xs font-semibold text-ink-muted">
          Tip: ask whether the business owns it, owes it, earns it, spends it, or the owner put it in.
        </p>
      )}
    </div>
  );
}
