"use client";

import { ACCOUNTS } from "@/data/accounting/accounts";
import { formatMoney } from "@/lib/accounting/engine";
import { findAccount } from "@/lib/accounting/engine";
import type { Side } from "@/lib/accounting/types";
import type { Lang } from "@/lib/i18n";

export interface TrialRowInput {
  accountId: string;
  amount: number;
}

/**
 * A real trial balance: Account | Debit | Credit. The student taps the column
 * where each balance belongs, and the amount lands in that column exactly as it
 * would on paper.
 */
export function TrialBalanceTask({
  rows,
  assignments,
  onChange,
  disabled,
  lang,
}: {
  rows: TrialRowInput[];
  assignments: Record<string, Side | null>;
  onChange: (accountId: string, side: Side) => void;
  disabled?: boolean;
  lang: Lang;
}) {
  const total = (side: Side) =>
    rows
      .filter((row) => assignments[row.accountId] === side)
      .reduce((sum, row) => sum + row.amount, 0);
  const debitTotal = total("debit");
  const creditTotal = total("credit");
  const allPlaced = rows.every((row) => assignments[row.accountId]);

  return (
    <div className="overflow-hidden rounded-xl2 border-2 border-line bg-paper-card shadow-card">
      <div className="grid grid-cols-[1fr_5.5rem_5.5rem] bg-paper-sunken/60 text-[11px] font-black uppercase tracking-wide text-ink-muted sm:grid-cols-[1fr_8rem_8rem]">
        <span className="px-3 py-2">Account</span>
        <span className="border-l border-line px-3 py-2 text-right text-debit-deep">Debit</span>
        <span className="border-l border-line px-3 py-2 text-right text-credit-deep">Credit</span>
      </div>

      {rows.map((row) => {
        const account = findAccount(ACCOUNTS, row.accountId);
        const chosen = assignments[row.accountId] ?? null;
        return (
          <div
            key={row.accountId}
            className="grid grid-cols-[1fr_5.5rem_5.5rem] border-t border-line/60 sm:grid-cols-[1fr_8rem_8rem]"
          >
            <div className="flex min-w-0 items-center gap-2 px-3 py-2.5">
              <p className="min-w-0 flex-1 truncate text-sm font-bold text-ink">
                {lang === "ur" && account.nameUr ? account.nameUr : account.name}
              </p>
              {!chosen && (
                <span className="shrink-0 font-mono text-xs font-bold text-ink-muted">
                  ${formatMoney(row.amount)}
                </span>
              )}
            </div>
            {(["debit", "credit"] as Side[]).map((side) => {
              const active = chosen === side;
              const tone =
                side === "debit"
                  ? active
                    ? "bg-debit-soft text-debit-deep font-black"
                    : "text-debit-deep/50 hover:bg-debit-soft/40"
                  : active
                    ? "bg-credit-soft text-credit-deep font-black"
                    : "text-credit-deep/50 hover:bg-credit-soft/40";
              return (
                <button
                  key={side}
                  type="button"
                  disabled={disabled}
                  onClick={() => onChange(row.accountId, side)}
                  aria-pressed={active}
                  aria-label={`Place ${account.name} in the ${side} column`}
                  className={`border-l border-line/60 px-2 py-2.5 text-right font-mono text-sm transition ${tone} ${
                    disabled ? "opacity-80" : "cursor-pointer"
                  }`}
                >
                  {active ? formatMoney(row.amount) : "·"}
                </button>
              );
            })}
          </div>
        );
      })}

      <div
        className={`grid grid-cols-[1fr_5.5rem_5.5rem] border-t-2 border-line text-sm font-black sm:grid-cols-[1fr_8rem_8rem] ${
          allPlaced && debitTotal === creditTotal
            ? "bg-good-soft text-good"
            : "bg-paper-sunken/50 text-ink-soft"
        }`}
      >
        <span className="px-3 py-2.5">
          {allPlaced && debitTotal === creditTotal ? "✓ Totals agree" : "Totals"}
        </span>
        <span className="border-l border-line/60 px-3 py-2.5 text-right font-mono">
          {debitTotal ? formatMoney(debitTotal) : "0"}
        </span>
        <span className="border-l border-line/60 px-3 py-2.5 text-right font-mono">
          {creditTotal ? formatMoney(creditTotal) : "0"}
        </span>
      </div>
    </div>
  );
}
