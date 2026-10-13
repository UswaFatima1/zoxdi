"use client";

import { useState } from "react";
import { checkEntry, formatMoney } from "@/lib/accounting/engine";
import { ACCOUNT_TYPE_LABEL, normalBalance } from "@/lib/accounting/rules";
import type { Account, AccountType, EntryLine, Side } from "@/lib/accounting/types";
import { ACCOUNT_TYPE_TONE } from "./tones";
import { LAB_QUICK_ENTRIES } from "@/data/accounting/lab";

export interface EntryComposerProps {
  accounts: Account[];
  lines: EntryLine[];
  narration: string;
  onLinesChange: (lines: EntryLine[]) => void;
  onNarrationChange: (value: string) => void;
  /** Post the current entry into the live ledger. */
  onPost: () => void;
  /** Wipe the composer. */
  onClear: () => void;
}

const SIDE_STYLE: Record<Side, { chip: string; text: string }> = {
  debit: {
    chip: "bg-debit text-white",
    text: "text-debit-deep",
  },
  credit: {
    chip: "bg-credit text-white",
    text: "text-credit-deep",
  },
};

const TYPE_ORDER: AccountType[] = ["asset", "liability", "equity", "revenue", "expense"];

export function EntryComposer({
  accounts,
  lines,
  narration,
  onLinesChange,
  onNarrationChange,
  onPost,
  onClear,
}: EntryComposerProps) {
  const check = checkEntry(accounts, lines);
  const [hintOpen, setHintOpen] = useState(false);

  const updateLine = (index: number, patch: Partial<EntryLine>) => {
    onLinesChange(lines.map((line, i) => (i === index ? { ...line, ...patch } : line)));
  };

  const addLine = (side: Side = "debit") => {
    const fallback = side === "debit" ? "cash" : "sales-revenue";
    onLinesChange([...lines, { accountId: fallback, side, amount: 0 }]);
  };

  const removeLine = (index: number) => {
    onLinesChange(lines.filter((_, i) => i !== index));
  };

  const applyTemplate = (templateId: string) => {
    const template = LAB_QUICK_ENTRIES.find((entry) => entry.id === templateId);
    if (!template) return;
    onLinesChange(template.lines.map((line) => ({ ...line })));
    onNarrationChange(template.narration);
  };

  // The explanation shown under the totals — the "here's what is wrong" part.
  let status: { tone: "good" | "bad" | "neutral"; headline: string; detail: string };
  if (check.empty || (!check.hasDebit && !check.hasCredit)) {
    status = {
      tone: "neutral",
      headline: "Start an entry",
      detail:
        "Give at least one account a debit and another a credit. No entry can live on one side alone.",
    };
  } else if (!check.hasDebit || !check.hasCredit) {
    status = {
      tone: "bad",
      headline: "Only one side so far",
      detail: `You have ${
        check.hasDebit ? "a debit" : "a credit"
      }, but every entry needs both. The side that gives must equal the side that receives.`,
    };
  } else if (check.zeroAmountLines > 0) {
    status = {
      tone: "bad",
      headline: "Some lines have no amount",
      detail: "Type a dollar amount on every line — nothing moves without a number.",
    };
  } else if (check.balanced) {
    status = {
      tone: "good",
      headline: `Balanced — debits equal credits at ${formatMoney(check.debitTotal)}`,
      detail:
        "Post it and watch the same number travel through the ledger, the trial balance and the statements.",
    };
  } else {
    status = {
      tone: "bad",
      headline: `Out of balance by ${formatMoney(Math.abs(check.difference))}`,
      detail: `Debits are ${formatMoney(check.debitTotal)} and credits are ${formatMoney(
        check.creditTotal,
      )}. Double-entry demands they match, so a posted entry like this would leave the trial balance off by ${formatMoney(
        Math.abs(check.difference),
      )}. Fix the figures, or post it anyway to see exactly how it breaks.`,
    };
  }

  const statusTone =
    status.tone === "good"
      ? "border-good/40 bg-good-soft/50 text-good"
      : status.tone === "bad"
        ? "border-bad/40 bg-bad-soft/50 text-bad"
        : "border-line bg-paper-sunken/50 text-ink-muted";

  return (
    <section className="rounded-xl2 border border-line bg-paper-card p-4 shadow-card sm:p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-credit">
            Write your own entry
          </p>
          <p className="text-sm text-ink-muted">
            Type your own numbers — every panel below updates the instant you post.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setHintOpen((value) => !value)}
            aria-expanded={hintOpen}
            className="rounded-full border border-gold/50 bg-gold-soft/50 px-3 py-1.5 text-xs font-black text-gold-deep transition hover:bg-gold-soft"
          >
            💡 Hint
          </button>
          {lines.length > 0 && (
            <button
              type="button"
              onClick={onClear}
              className="rounded-full border border-line px-3 py-1.5 text-xs font-bold text-ink-muted transition hover:border-bad/40 hover:text-bad"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* One-tap starters */}
      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        <span className="text-[11px] font-bold uppercase tracking-wide text-ink-muted">
          Examples:
        </span>
        {LAB_QUICK_ENTRIES.map((template) => (
          <button
            key={template.id}
            type="button"
            onClick={() => applyTemplate(template.id)}
            className="rounded-full border border-line bg-paper-sunken/60 px-3 py-1 text-xs font-bold text-ink-soft transition hover:-translate-y-0.5 hover:border-credit/50 hover:text-ink"
          >
            {template.label}
          </button>
        ))}
      </div>

      <label className="mb-3 block">
        <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-ink-muted">
          What happened? (optional)
        </span>
        <input
          type="text"
          value={narration}
          onChange={(event) => onNarrationChange(event.target.value)}
          placeholder="e.g. Sold goods for cash"
          className="w-full rounded-xl border-2 border-line bg-paper px-3.5 py-2.5 text-sm font-semibold text-ink outline-none transition focus:border-credit"
        />
      </label>

      {/* Lines */}
      <div className="space-y-2">
        {lines.map((line, index) => {
          const account = accounts.find((candidate) => candidate.id === line.accountId);
          const grows = account ? normalBalance(account) === line.side : false;
          return (
            <div
              key={index}
              className={`rounded-xl border border-line border-l-4 bg-paper p-2 ${
                line.side === "debit" ? "border-l-debit" : "border-l-credit"
              }`}
            >
              {/* Row 1 — which account, and remove */}
              <div className="flex items-center gap-2">
                <select
                  value={line.accountId}
                  onChange={(event) => updateLine(index, { accountId: event.target.value })}
                  className="min-w-0 flex-1 rounded-lg border border-line bg-paper-card px-2.5 py-2 text-sm font-bold text-ink outline-none transition focus:border-credit"
                  aria-label={`Account for line ${index + 1}`}
                >
                  {TYPE_ORDER.map((type) => {
                    const group = accounts.filter((candidate) => candidate.type === type);
                    if (group.length === 0) return null;
                    return (
                      <optgroup key={type} label={ACCOUNT_TYPE_LABEL[type]}>
                        {group.map((candidate) => (
                          <option key={candidate.id} value={candidate.id}>
                            {candidate.name}
                          </option>
                        ))}
                      </optgroup>
                    );
                  })}
                </select>

                <button
                  type="button"
                  onClick={() => removeLine(index)}
                  className="shrink-0 rounded-lg px-2 py-2 text-ink-muted transition hover:bg-bad-soft hover:text-bad"
                  aria-label={`Remove line ${index + 1}`}
                >
                  ✕
                </button>
              </div>

              {/* Row 2 — side and amount */}
              <div className="mt-2 flex items-center gap-2">
                <div className="flex shrink-0 overflow-hidden rounded-lg border border-line">
                  {(["debit", "credit"] as Side[]).map((side) => (
                    <button
                      key={side}
                      type="button"
                      aria-pressed={line.side === side}
                      onClick={() => updateLine(index, { side })}
                      className={`px-3 py-2 text-xs font-black uppercase transition ${
                        line.side === side
                          ? SIDE_STYLE[side].chip
                          : "bg-paper-card text-ink-muted hover:text-ink"
                      }`}
                    >
                      {side === "debit" ? "Dr" : "Cr"}
                    </button>
                  ))}
                </div>

                <div className="ml-auto flex min-w-0 items-center gap-1.5">
                  <span className="text-xs font-bold text-ink-muted">$</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={line.amount === 0 ? "" : line.amount}
                    placeholder="0"
                    onChange={(event) =>
                      updateLine(index, { amount: Math.max(0, Number(event.target.value) || 0) })
                    }
                    className="w-full min-w-24 max-w-40 flex-1 rounded-lg border border-line bg-paper-card px-2.5 py-2 text-right font-mono text-sm font-bold text-ink outline-none transition focus:border-credit"
                    aria-label={`Amount for line ${index + 1}`}
                  />
                </div>
              </div>

              {account ? (
                <p className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] font-semibold">
                  <span className={`rounded px-1.5 py-0.5 text-[11px] font-black uppercase ${ACCOUNT_TYPE_TONE[account.type]}`}>
                    {ACCOUNT_TYPE_LABEL[account.type]}
                  </span>{" "}
                  <span className={grows ? "text-good" : "text-ink-muted"}>
                    {grows ? "↑ increases here" : "↓ decreases here"}
                  </span>
                </p>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={() => addLine("debit")}
          className="rounded-lg border border-debit/40 bg-debit-soft/40 px-3 py-1.5 text-xs font-black uppercase text-debit-deep transition hover:bg-debit-soft"
        >
          + Debit line
        </button>
        <button
          type="button"
          onClick={() => addLine("credit")}
          className="rounded-lg border border-credit/40 bg-credit-soft/40 px-3 py-1.5 text-xs font-black uppercase text-credit-deep transition hover:bg-credit-soft"
        >
          + Credit line
        </button>
      </div>

      {/* Live totals */}
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <div className="rounded-xl border border-debit/30 bg-debit-soft/40 px-4 py-2.5">
          <p className="text-[11px] font-black uppercase tracking-wide text-debit-deep">
            Debits
          </p>
          <p className="font-mono text-lg font-black text-ink">{formatMoney(check.debitTotal)}</p>
        </div>
        <div className="rounded-xl border border-credit/30 bg-credit-soft/40 px-4 py-2.5">
          <p className="text-[11px] font-black uppercase tracking-wide text-credit-deep">
            Credits
          </p>
          <p className="font-mono text-lg font-black text-ink">{formatMoney(check.creditTotal)}</p>
        </div>
        <button
          type="button"
          onClick={onPost}
          disabled={!check.readyToPost}
          className="flex items-center justify-center rounded-xl bg-ig-135 px-4 py-2.5 font-black text-white shadow-glow transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Post entry
        </button>
      </div>

      {hintOpen && (
        <div className="mt-3 rounded-xl border border-gold/40 bg-gold-soft/40 px-4 py-3 text-sm">
          <p className="font-black text-gold-deep">💡 Quick rules</p>
          <ul className="mt-1.5 space-y-1 text-ink-soft">
            <li>
              <b>Every entry</b> has at least one debit and one credit, and the two sides must be
              equal.
            </li>
            <li>
              <b className="text-debit-deep">Debit</b> increases <b>D</b>rawings, <b>E</b>xpenses
              and <b>A</b>ssets.
            </li>
            <li>
              <b className="text-credit-deep">Credit</b> increases <b>C</b>apital, <b>L</b>
              iabilities and <b>I</b>ncome.
            </li>
            <li className="text-ink-muted">
              Remember it as <b>DEAD CLIC</b> — the same two lists.
            </li>
          </ul>
        </div>
      )}

      <p className={`mt-3 rounded-xl border px-4 py-2.5 text-sm font-semibold ${statusTone}`}>
        <span className="font-black">{status.headline}.</span> {status.detail}
      </p>
    </section>
  );
}
