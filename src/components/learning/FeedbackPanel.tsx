"use client";

import { formatMoney, moneyEquals, type EquationDelta } from "@/lib/accounting/engine";
import type { EntryLine } from "@/lib/accounting/types";
import type { ConceptId } from "@/lib/learning/concepts";
import type { Lang } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { TAccountView } from "@/components/game/TAccountView";

/** A simple before/after table a task can hand back to show the correct answer. */
export interface Correction {
  heading: string;
  rows: { label: string; value: string; ok: boolean }[];
}

export interface FeedbackPanelProps {
  correct: boolean;
  headline: string;
  detail: string;
  remedy?: string;
  tags?: string[];
  conceptIds?: ConceptId[];
  /** Shown on success: the entry landing in the ledger. */
  tAccounts?: EntryLine[];
  /** Shown on success: how the entry moved the accounting equation. */
  delta?: EquationDelta | null;
  /** A per-row correction table for the trial-balance and sort tasks. */
  correction?: Correction;
  /** XP granted for this completion, if any. */
  xpAward?: number;
  onTryAgain?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  lang: Lang;
}

function DeltaChip({ label, value }: { label: string; value: number }) {
  const unchanged = moneyEquals(value, 0);
  return (
    <div className="rounded-lg border border-line bg-paper px-2.5 py-2 text-center">
      <p className="text-[11px] font-extrabold uppercase tracking-wide text-ink-muted">
        {label}
      </p>
      <p
        className={`font-mono text-sm font-bold ${
          unchanged ? "text-ink-muted" : value > 0 ? "text-good" : "text-bad"
        }`}
      >
        {unchanged ? "no change" : formatMoney(value, { sign: true })}
      </p>
    </div>
  );
}

export function FeedbackPanel({
  correct,
  headline,
  detail,
  remedy,
  tags = [],
  tAccounts,
  delta,
  correction,
  xpAward = 0,
  onTryAgain,
  onNext,
  nextLabel,
  lang,
}: FeedbackPanelProps) {
  return (
    <div
      className={`${correct ? "animate-rise" : "animate-shake"} rounded-xl2 border-2 p-5 sm:p-6 ${
        correct ? "border-good bg-good-soft/40" : "border-credit bg-credit-soft/30"
      }`}
      role={correct ? "status" : "alert"}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p
            className={`text-sm font-extrabold uppercase tracking-wide ${
              correct ? "text-good" : "text-credit-deep"
            }`}
          >
            {correct ? t("feedback.correct", lang) : "Not yet — and here's why"}
          </p>
          <h3 className="mt-1 text-xl font-extrabold text-ink sm:text-2xl">{headline}</h3>
        </div>
        {correct && xpAward > 0 ? (
          <span className="shrink-0 animate-bounce-in rounded-full bg-ig-135 px-3.5 py-1.5 text-sm font-black text-white shadow-glow">
            +{xpAward} XP
          </span>
        ) : null}
      </div>

      <p className="mt-2 text-ink-soft">{detail}</p>

      {remedy ? (
        <div className="mt-4 rounded-xl border border-gold/40 bg-paper-card p-4">
          <p className="text-xs font-extrabold uppercase tracking-wide text-gold-deep">
            How to fix it
          </p>
          <p className="mt-1 text-sm text-ink">{remedy}</p>
        </div>
      ) : null}

      {tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-paper-sunken px-2.5 py-1 text-[11px] font-bold text-ink-muted"
            >
              {tag.replaceAll("-", " ")}
            </span>
          ))}
        </div>
      )}

      {correction ? (
        <div className="mt-5">
          <p className="mb-2 text-xs font-extrabold uppercase tracking-wide text-ink-muted">
            {correction.heading}
          </p>
          <div className="overflow-hidden rounded-xl border border-line bg-paper-card">
            {correction.rows.map((row) => (
              <div
                key={row.label}
                className={`flex items-center justify-between gap-3 border-b border-line/50 px-3.5 py-2 text-sm last:border-0 ${
                  row.ok ? "" : "bg-bad-soft/40"
                }`}
              >
                <span className="truncate font-semibold text-ink">{row.label}</span>
                <span className="flex shrink-0 items-center gap-1.5">
                  <span className="font-mono font-bold text-ink">{row.value}</span>
                  <span className={row.ok ? "text-good" : "text-bad"}>{row.ok ? "✓" : "✕"}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {correct && tAccounts ? (
        <div className="mt-5">
          <p className="mb-2 text-xs font-extrabold uppercase tracking-wide text-ink-muted">
            Where it lands — the T-accounts
          </p>
          <TAccountView lines={tAccounts} lang={lang} />
        </div>
      ) : null}

      {correct && delta ? (
        <div className="mt-5">
          <p className="mb-2 text-xs font-extrabold uppercase tracking-wide text-ink-muted">
            What changed in the equation
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <DeltaChip label={t("equation.assets", lang)} value={delta.assets} />
            <DeltaChip label={t("equation.liabilities", lang)} value={delta.liabilities} />
            <DeltaChip label={t("equation.equity", lang)} value={delta.equity} />
            {!moneyEquals(delta.revenue, 0) && (
              <DeltaChip label={t("equation.revenue", lang)} value={delta.revenue} />
            )}
            {!moneyEquals(delta.expenses, 0) && (
              <DeltaChip label={t("equation.expenses", lang)} value={delta.expenses} />
            )}
            {!moneyEquals(delta.drawings, 0) && (
              <DeltaChip label="Drawings" value={delta.drawings} />
            )}
          </div>
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-3">
        {!correct && onTryAgain ? (
          <button
            type="button"
            onClick={onTryAgain}
            className="rounded-full bg-ink px-6 py-2.5 font-bold text-paper transition hover:bg-ink-soft"
          >
            {t("action.retry", lang)}
          </button>
        ) : null}
        {correct && onNext ? (
          <button
            type="button"
            onClick={onNext}
            className="rounded-full bg-good px-6 py-2.5 font-bold text-white transition hover:bg-good/90"
          >
            {nextLabel ?? t("action.next", lang)}
          </button>
        ) : null}
      </div>
    </div>
  );
}
