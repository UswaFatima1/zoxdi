/**
 * The deterministic accounting engine.
 *
 * Pure functions only: given the same inputs they always produce the same
 * outputs, which is what makes the game scoreable, testable and reproducible.
 * Amounts are treated as USD and compared with a small tolerance so that
 * floating-point noise never makes two equal totals look different.
 */

import {
  ACCOUNT_TYPES,
  decreaseSide,
  increaseSide,
  normalBalance,
  opposite,
} from "./rules";
import type {
  Account,
  AccountBalance,
  AccountingEquation,
  EntryLine,
  JournalEntry,
  Ledger,
  Side,
} from "./types";

/** Tolerance for money comparisons, in USD (half a cent). */
export const MONEY_EPSILON = 0.005;

export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function moneyEquals(a: number, b: number): boolean {
  return Math.abs(a - b) < MONEY_EPSILON;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Format a USD amount for display, e.g. 12000 -> "12,000". */
export function formatMoney(amount: number, options?: { sign?: boolean }): string {
  const formatted = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(Math.abs(round2(amount)));
  const prefix = options?.sign && amount > 0 ? "+" : amount < 0 ? "-" : "";
  return `${prefix}${formatted}`;
}

export interface EntryTotals {
  debitTotal: number;
  creditTotal: number;
  difference: number;
  balanced: boolean;
}

/** Total the debit and credit sides of an entry and say whether they match. */
export function entryTotals(entry: JournalEntry | EntryLine[]): EntryTotals {
  const lines = Array.isArray(entry) ? entry : entry.lines;
  let debitTotal = 0;
  let creditTotal = 0;
  for (const line of lines) {
    const amount = round2(line.amount);
    if (line.side === "debit") debitTotal += amount;
    else creditTotal += amount;
  }
  debitTotal = round2(debitTotal);
  creditTotal = round2(creditTotal);
  return {
    debitTotal,
    creditTotal,
    difference: round2(debitTotal - creditTotal),
    balanced: moneyEquals(debitTotal, creditTotal),
  };
}

export function isBalanced(entry: JournalEntry | EntryLine[]): boolean {
  return entryTotals(entry).balanced;
}

/**
 * Everything the Account Lab needs to explain an entry a student typed: not
 * just whether it balances, but *how* it is wrong — an unknown account, a
 * missing side, or a dollar amount that does not cancel out.
 */
export interface EntryCheck extends EntryTotals {
  /** No lines at all. */
  empty: boolean;
  /** Lines that reference an account which is not in the chart. */
  unknownAccountIds: string[];
  /** Number of lines with an amount of zero or less. */
  zeroAmountLines: number;
  /** True when at least one line adds to the debit side. */
  hasDebit: boolean;
  /** True when at least one line adds to the credit side. */
  hasCredit: boolean;
  /** True when the entry is safe to post and would keep the books whole. */
  readyToPost: boolean;
}

export function checkEntry(
  accounts: Account[],
  entry: JournalEntry | EntryLine[],
): EntryCheck {
  const lines = Array.isArray(entry) ? entry : entry.lines;
  const totals = entryTotals(lines);
  const known = new Set(accounts.map((account) => account.id));
  const unknownAccountIds = Array.from(
    new Set(lines.filter((line) => !known.has(line.accountId)).map((line) => line.accountId)),
  );
  const zeroAmountLines = lines.filter((line) => !(line.amount > 0)).length;
  const hasDebit = lines.some((line) => line.side === "debit" && line.amount > 0);
  const hasCredit = lines.some((line) => line.side === "credit" && line.amount > 0);
  const empty = lines.length === 0;

  return {
    ...totals,
    empty,
    unknownAccountIds,
    zeroAmountLines,
    hasDebit,
    hasCredit,
    readyToPost:
      !empty &&
      unknownAccountIds.length === 0 &&
      zeroAmountLines === 0 &&
      hasDebit &&
      hasCredit,
  };
}

function emptyBalance(accountId: string): AccountBalance {
  return { accountId, debits: 0, credits: 0 };
}

export function emptyLedger(): Ledger {
  return {};
}

/** Apply one journal entry to a ledger, returning a new ledger (no mutation). */
export function applyEntry(ledger: Ledger, entry: JournalEntry | EntryLine[]): Ledger {
  const lines = Array.isArray(entry) ? entry : entry.lines;
  const next: Ledger = { ...ledger };
  for (const line of lines) {
    const current = next[line.accountId] ?? emptyBalance(line.accountId);
    const updated: AccountBalance = { ...current };
    if (line.side === "debit") updated.debits = round2(updated.debits + line.amount);
    else updated.credits = round2(updated.credits + line.amount);
    next[line.accountId] = updated;
  }
  return next;
}

/** Fold a list of entries into a final ledger, as the accounting cycle would. */
export function buildLedger(entries: Array<JournalEntry | EntryLine[]>): Ledger {
  return entries.reduce<Ledger>((ledger, entry) => applyEntry(ledger, entry), {});
}

export function balanceOf(ledger: Ledger, accountId: string): AccountBalance {
  return ledger[accountId] ?? emptyBalance(accountId);
}

/**
 * Signed balance where a positive number always means "increased on this
 * account's normal side". Cash of 12,000 debit gives +12,000; Accounts Payable
 * of 12,000 credit gives +12,000 as well, because both grew.
 */
export function signedBalance(account: Account, ledger: Ledger): number {
  const balance = balanceOf(ledger, account.id);
  const net = round2(balance.debits - balance.credits);
  return normalBalance(account) === "debit" ? net : round2(-net);
}

/** The raw net debit balance (debits - credits), useful for ledger displays. */
export function netDebit(ledger: Ledger, accountId: string): number {
  const balance = balanceOf(ledger, accountId);
  return round2(balance.debits - balance.credits);
}

export interface TAccount {
  accountId: string;
  debit: number;
  credit: number;
  /** Positive means the account sits on its normal side. */
  balance: number;
  balanceSide: Side;
}

/** Render an account as a T-account for the ledger view. */
export function tAccount(account: Account, ledger: Ledger): TAccount {
  const balance = balanceOf(ledger, account.id);
  const signed = signedBalance(account, ledger);
  return {
    accountId: account.id,
    debit: balance.debits,
    credit: balance.credits,
    balance: signed,
    balanceSide: signed >= 0 ? normalBalance(account) : opposite(normalBalance(account)),
  };
}

export function findAccount(accounts: Account[], accountId: string): Account {
  const account = accounts.find((candidate) => candidate.id === accountId);
  if (!account) throw new Error(`Unknown account: ${accountId}`);
  return account;
}

/** How a single entry changes each element of the accounting equation. */
export interface EquationDelta {
  assets: number;
  liabilities: number;
  equity: number;
  revenue: number;
  expenses: number;
  drawings: number;
}

export function equationDelta(accounts: Account[], entry: JournalEntry | EntryLine[]): EquationDelta {
  const lines = Array.isArray(entry) ? entry : entry.lines;
  const delta: EquationDelta = {
    assets: 0,
    liabilities: 0,
    equity: 0,
    revenue: 0,
    expenses: 0,
    drawings: 0,
  };

  for (const line of lines) {
    const account = findAccount(accounts, line.accountId);
    const increases = increaseSide(account) === line.side;
    const magnitude = increases ? line.amount : -line.amount;

    switch (account.type) {
      case "asset":
        delta.assets += magnitude;
        break;
      case "liability":
        delta.liabilities += magnitude;
        break;
      case "revenue":
        delta.revenue += magnitude;
        delta.equity += magnitude;
        break;
      case "expense":
        delta.expenses += magnitude;
        delta.equity -= magnitude;
        break;
      case "equity":
        if (normalBalance(account) === "credit") {
          delta.equity += magnitude;
        } else {
          delta.drawings += magnitude;
          delta.equity -= magnitude;
        }
        break;
    }
  }

  return delta;
}

/** Read the whole accounting equation out of a ledger. */
export function accountingEquation(accounts: Account[], ledger: Ledger): AccountingEquation {
  let assets = 0;
  let liabilities = 0;
  let capital = 0;
  let revenue = 0;
  let expenses = 0;
  let drawings = 0;

  for (const account of accounts) {
    const signed = signedBalance(account, ledger);
    switch (account.type) {
      case "asset":
        assets += signed;
        break;
      case "liability":
        liabilities += signed;
        break;
      case "revenue":
        revenue += signed;
        break;
      case "expense":
        expenses += signed;
        break;
      case "equity":
        if (normalBalance(account) === "credit") capital += signed;
        else drawings += signed;
        break;
    }
  }

  let totalDebits = 0;
  let totalCredits = 0;
  for (const balance of Object.values(ledger)) {
    totalDebits += balance.debits;
    totalCredits += balance.credits;
  }
  totalDebits = round2(totalDebits);
  totalCredits = round2(totalCredits);

  const equity = round2(capital + revenue - expenses - drawings);
  const balanced = moneyEquals(totalDebits, totalCredits);

  return {
    assets: round2(assets),
    liabilities: round2(liabilities),
    equity,
    capital: round2(capital),
    revenue: round2(revenue),
    expenses: round2(expenses),
    drawings: round2(drawings),
    totalDebits,
    totalCredits,
    balanced,
    identityHolds: moneyEquals(round2(assets), round2(liabilities + equity)),
  };
}

/** Group accounts by their element, preserving declaration order. */
export function groupByType(accounts: Account[]): Record<string, Account[]> {
  const grouped: Record<string, Account[]> = {};
  for (const type of ACCOUNT_TYPES) grouped[type] = [];
  for (const account of accounts) grouped[account.type].push(account);
  return grouped;
}

/** Convenience: the decreasing side of an account, re-exported for the UI. */
export { decreaseSide, increaseSide, normalBalance, opposite };
