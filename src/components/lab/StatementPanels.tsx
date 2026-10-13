"use client";

import { ACCOUNTS } from "@/data/accounting/accounts";
import { accountTypeTone } from "@/components/lab/tones";
import { formatMoney, tAccount } from "@/lib/accounting/engine";
import type { Ledger, Side } from "@/lib/accounting/types";
import type { IncomeStatement, BalanceSheet, TrialBalance } from "@/lib/accounting/statements";
import type { Lang } from "@/lib/i18n";

function EmptyState({ label }: { label: string }) {
  return (
    <p className="rounded-xl border border-dashed border-line bg-paper-card/60 p-6 text-center text-sm text-ink-muted">
      {label}
    </p>
  );
}

/** ── Ledger: every account as a live T-account ─────────────────────────── */
export function LedgerPanel({
  ledger,
  lang,
  onQuickAdd,
}: {
  ledger: Ledger;
  lang: Lang;
  /** When supplied (in the Lab), each account offers a jump to the composer. */
  onQuickAdd?: (accountId: string, side: Side) => void;
}) {
  const active = ACCOUNTS.filter((account) => {
    const balance = ledger[account.id];
    return balance && (balance.debits !== 0 || balance.credits !== 0);
  });

  if (active.length === 0) return <EmptyState label="Apply a transaction to see the ledger fill up." />;

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {active.map((account) => {
        const view = tAccount(account, ledger);
        const tone = accountTypeTone(account.type);
        return (
          <div
            key={account.id}
            className="animate-scale-in overflow-hidden rounded-xl border border-line bg-paper-card shadow-card"
          >
            <div className="flex items-center justify-between gap-2 border-b border-line bg-paper-sunken/50 px-3 py-2">
              <p className="truncate text-sm font-extrabold text-ink">
                {lang === "ur" && account.nameUr ? account.nameUr : account.name}
              </p>
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-black uppercase ${tone}`}>
                {account.type}
              </span>
            </div>
            <div className="grid grid-cols-2 divide-x divide-line text-center">
              <div className="px-2 py-2">
                <p className="text-[11px] font-black uppercase tracking-wide text-debit-deep">
                  Debit
                </p>
                <p className="font-mono text-sm font-bold text-ink">
                  {view.debit ? formatMoney(view.debit) : "—"}
                </p>
              </div>
              <div className="px-2 py-2">
                <p className="text-[11px] font-black uppercase tracking-wide text-credit-deep">
                  Credit
                </p>
                <p className="font-mono text-sm font-bold text-ink">
                  {view.credit ? formatMoney(view.credit) : "—"}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-line bg-paper-sunken/40 px-3 py-1.5 text-xs">
              <span className="font-bold text-ink-muted">Balance</span>
              <span className="font-mono font-extrabold text-ink">
                {formatMoney(Math.abs(view.balance))}{" "}
                <span className="text-[11px] uppercase text-ink-muted">
                  {view.balanceSide === "debit" ? "Dr" : "Cr"}
                </span>
              </span>
            </div>
            {onQuickAdd && (
              <div className="flex gap-1.5 border-t border-line px-3 py-2">
                <button
                  type="button"
                  onClick={() => onQuickAdd(account.id, "debit")}
                  className="flex-1 rounded-lg border border-debit/40 bg-debit-soft/40 px-2 py-1 text-[11px] font-black uppercase tracking-wide text-debit-deep transition hover:bg-debit-soft"
                >
                  + Debit
                </button>
                <button
                  type="button"
                  onClick={() => onQuickAdd(account.id, "credit")}
                  className="flex-1 rounded-lg border border-credit/40 bg-credit-soft/40 px-2 py-1 text-[11px] font-black uppercase tracking-wide text-credit-deep transition hover:bg-credit-soft"
                >
                  + Credit
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/** ── Trial balance ─────────────────────────────────────────────────────── */
export function TrialBalancePanel({
  trial,
  lang,
}: {
  trial: TrialBalance;
  lang: Lang;
}) {
  if (trial.rows.length === 0) return <EmptyState label="No balances yet — apply a transaction." />;

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-paper-card shadow-card">
      <div className="grid grid-cols-[1fr_auto_auto] gap-2 border-b border-line bg-paper-sunken/60 px-4 py-2 text-[11px] font-black uppercase tracking-wide text-ink-muted">
        <span>Account</span>
        <span className="w-24 text-right text-debit-deep">Debit</span>
        <span className="w-24 text-right text-credit-deep">Credit</span>
      </div>
      {trial.rows.map((row) => (
        <div
          key={row.account.id}
          className="grid grid-cols-[1fr_auto_auto] items-center gap-2 border-b border-line/50 px-4 py-2 text-sm last:border-0"
        >
          <span className="truncate font-semibold text-ink">
            {lang === "ur" && row.account.nameUr ? row.account.nameUr : row.account.name}
          </span>
          <span className="w-24 text-right font-mono font-bold text-debit-deep">
            {row.debit ? formatMoney(row.debit) : ""}
          </span>
          <span className="w-24 text-right font-mono font-bold text-credit-deep">
            {row.credit ? formatMoney(row.credit) : ""}
          </span>
        </div>
      ))}
      <div
        className={`grid grid-cols-[1fr_auto_auto] items-center gap-2 px-4 py-2.5 text-sm font-black ${
          trial.balanced ? "bg-good-soft text-good" : "bg-bad-soft text-bad"
        }`}
      >
        <span>{trial.balanced ? "✓ Totals agree" : "✗ Out of balance"}</span>
        <span className="w-24 text-right font-mono">{formatMoney(trial.totalDebit)}</span>
        <span className="w-24 text-right font-mono">{formatMoney(trial.totalCredit)}</span>
      </div>
    </div>
  );
}

function MoneyRow({
  label,
  amount,
  tone = "text-ink",
  bold = false,
}: {
  label: string;
  amount: number;
  tone?: string;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2 text-sm">
      <span className={`truncate ${bold ? "font-extrabold" : "font-semibold"} text-ink`}>{label}</span>
      <span className={`shrink-0 font-mono ${bold ? "font-black" : "font-bold"} ${tone}`}>
        {formatMoney(amount)}
      </span>
    </div>
  );
}

/** ── Income statement ──────────────────────────────────────────────────── */
export function IncomeStatementPanel({
  income,
  lang,
}: {
  income: IncomeStatement;
  lang: Lang;
}) {
  const nameOf = (id: string) => {
    const account = ACCOUNTS.find((candidate) => candidate.id === id);
    if (!account) return id;
    return lang === "ur" && account.nameUr ? account.nameUr : account.name;
  };

  if (income.revenueLines.length === 0 && income.expenseLines.length === 0) {
    return <EmptyState label="No revenue or expenses recorded yet." />;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-paper-card shadow-card">
      <p className="border-b border-line bg-paper-sunken/60 px-4 py-2 text-[11px] font-black uppercase tracking-wide text-good">
        Revenue
      </p>
      {income.revenueLines.map((line) => (
        <MoneyRow key={line.account.id} label={nameOf(line.account.id)} amount={line.amount} tone="text-good" />
      ))}
      <MoneyRow label="Total revenue" amount={income.totalRevenue} tone="text-good" bold />

      <p className="border-y border-line bg-paper-sunken/60 px-4 py-2 text-[11px] font-black uppercase tracking-wide text-bad">
        Expenses
      </p>
      {income.expenseLines.map((line) => (
        <MoneyRow key={line.account.id} label={nameOf(line.account.id)} amount={line.amount} tone="text-bad" />
      ))}
      <MoneyRow label="Total expenses" amount={income.totalExpenses} tone="text-bad" bold />

      <div
        className={`flex items-center justify-between gap-3 px-4 py-3 ${
          income.netProfit >= 0 ? "bg-good-soft/60" : "bg-bad-soft/60"
        }`}
      >
        <span className="font-black text-ink">
          {income.netProfit >= 0 ? "Net profit" : "Net loss"}
        </span>
        <span
          className={`font-mono text-base font-black ${
            income.netProfit >= 0 ? "text-good" : "text-bad"
          }`}
        >
          {formatMoney(income.netProfit)}
        </span>
      </div>
    </div>
  );
}

/** ── Balance sheet ─────────────────────────────────────────────────────── */
export function BalanceSheetPanel({
  sheet,
  lang,
}: {
  sheet: BalanceSheet;
  lang: Lang;
}) {
  const nameOf = (id: string) => {
    const account = ACCOUNTS.find((candidate) => candidate.id === id);
    if (!account) return id;
    return lang === "ur" && account.nameUr ? account.nameUr : account.name;
  };

  const nothing =
    sheet.assetLines.length === 0 &&
    sheet.liabilityLines.length === 0 &&
    sheet.equityLines.length === 0;
  if (nothing) return <EmptyState label="Nothing in the balance sheet yet." />;

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {/* Assets */}
      <div className="overflow-hidden rounded-xl border border-line bg-paper-card shadow-card">
        <p className="border-b border-line bg-debit-soft/60 px-4 py-2 text-[11px] font-black uppercase tracking-wide text-debit-deep">
          Assets
        </p>
        {sheet.assetLines.map((line) => (
          <MoneyRow key={line.account.id} label={nameOf(line.account.id)} amount={line.amount} />
        ))}
        <div className="flex items-center justify-between gap-3 bg-debit-soft/50 px-4 py-3">
          <span className="font-black text-ink">Total assets</span>
          <span className="font-mono text-base font-black text-debit-deep">
            {formatMoney(sheet.totalAssets)}
          </span>
        </div>
      </div>

      {/* Liabilities + Equity */}
      <div className="overflow-hidden rounded-xl border border-line bg-paper-card shadow-card">
        <p className="border-b border-line bg-credit-soft/60 px-4 py-2 text-[11px] font-black uppercase tracking-wide text-credit-deep">
          Liabilities
        </p>
        {sheet.liabilityLines.length === 0 ? (
          <p className="px-4 py-2 text-sm text-ink-muted">None</p>
        ) : (
          sheet.liabilityLines.map((line) => (
            <MoneyRow key={line.account.id} label={nameOf(line.account.id)} amount={line.amount} />
          ))
        )}
        <MoneyRow label="Total liabilities" amount={sheet.totalLiabilities} tone="text-credit-deep" bold />

        <p className="border-y border-line bg-gold-soft/50 px-4 py-2 text-[11px] font-black uppercase tracking-wide text-gold-deep">
          Owner&apos;s equity
        </p>
        <MoneyRow label="Capital less drawings" amount={sheet.contributedEquity} />
        <MoneyRow
          label={sheet.netProfit >= 0 ? "Add: profit for the period" : "Less: loss for the period"}
          amount={sheet.netProfit}
          tone={sheet.netProfit >= 0 ? "text-good" : "text-bad"}
        />
        <MoneyRow label="Total equity" amount={sheet.totalEquity} bold />

        <div
          className={`flex items-center justify-between gap-3 px-4 py-3 ${
            sheet.balanced ? "bg-good-soft/60" : "bg-bad-soft/60"
          }`}
        >
          <span className="font-black text-ink">Liabilities + equity</span>
          <span className={`font-mono text-base font-black ${sheet.balanced ? "text-good" : "text-bad"}`}>
            {formatMoney(sheet.totalEquityAndLiabilities)}
          </span>
        </div>
      </div>
    </div>
  );
}
