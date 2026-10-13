/**
 * The end of the accounting cycle, as pure functions.
 *
 * The same ledger that the game builds is folded into a trial balance, an
 * income statement and a balance sheet. Nothing here knows about React, so the
 * Account Lab and the tests share exactly one definition of "the statements".
 */

import { moneyEquals, netDebit, round2, signedBalance } from "./engine";
import { normalBalance } from "./rules";
import type { Account, Ledger } from "./types";
import { accountingEquation } from "./engine";

export interface BalanceLine {
  account: Account;
  /** Signed on the account's normal side: positive means it grew. */
  amount: number;
}

export interface TrialBalanceRow {
  account: Account;
  debit: number;
  credit: number;
}

export interface TrialBalance {
  rows: TrialBalanceRow[];
  totalDebit: number;
  totalCredit: number;
  balanced: boolean;
}

/**
 * A trial balance lists each account's balance in the debit or credit column,
 * depending on which side its balance actually sits.
 */
export function trialBalance(accounts: Account[], ledger: Ledger): TrialBalance {
  const rows: TrialBalanceRow[] = [];

  for (const account of accounts) {
    const net = netDebit(ledger, account.id);
    if (moneyEquals(net, 0)) continue;
    const debitSitsHere = netDebit(ledger, account.id) > 0;
    // The account's balance sits on the debit side when its net debit is
    // positive, regardless of its normal balance.
    rows.push({
      account,
      debit: debitSitsHere ? round2(net) : 0,
      credit: debitSitsHere ? 0 : round2(-net),
    });
  }

  const totalDebit = round2(rows.reduce((sum, row) => sum + row.debit, 0));
  const totalCredit = round2(rows.reduce((sum, row) => sum + row.credit, 0));

  return {
    rows,
    totalDebit,
    totalCredit,
    balanced: moneyEquals(totalDebit, totalCredit),
  };
}

export interface IncomeStatement {
  revenueLines: BalanceLine[];
  expenseLines: BalanceLine[];
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
}

export function incomeStatement(accounts: Account[], ledger: Ledger): IncomeStatement {
  const revenueLines: BalanceLine[] = [];
  const expenseLines: BalanceLine[] = [];

  for (const account of accounts) {
    const amount = signedBalance(account, ledger);
    if (moneyEquals(amount, 0)) continue;
    if (account.type === "revenue") revenueLines.push({ account, amount });
    else if (account.type === "expense") expenseLines.push({ account, amount });
  }

  const totalRevenue = round2(revenueLines.reduce((sum, line) => sum + line.amount, 0));
  const totalExpenses = round2(expenseLines.reduce((sum, line) => sum + line.amount, 0));

  return {
    revenueLines,
    expenseLines,
    totalRevenue,
    totalExpenses,
    netProfit: round2(totalRevenue - totalExpenses),
  };
}

export interface BalanceSheet {
  assetLines: BalanceLine[];
  liabilityLines: BalanceLine[];
  equityLines: BalanceLine[];
  totalAssets: number;
  totalLiabilities: number;
  /** Capital minus drawings, before profit. */
  contributedEquity: number;
  netProfit: number;
  totalEquity: number;
  totalEquityAndLiabilities: number;
  balanced: boolean;
}

export function balanceSheet(accounts: Account[], ledger: Ledger): BalanceSheet {
  const assetLines: BalanceLine[] = [];
  const liabilityLines: BalanceLine[] = [];
  const equityLines: BalanceLine[] = [];

  for (const account of accounts) {
    const amount = signedBalance(account, ledger);
    if (moneyEquals(amount, 0)) continue;
    if (account.type === "asset") assetLines.push({ account, amount });
    else if (account.type === "liability") liabilityLines.push({ account, amount });
    else if (account.type === "equity") equityLines.push({ account, amount });
  }

  const equation = accountingEquation(accounts, ledger);
  const totalAssets = equation.assets;
  const totalLiabilities = equation.liabilities;
  const contributedEquity = round2(equation.capital - equation.drawings);
  const netProfit = round2(equation.revenue - equation.expenses);
  const totalEquity = round2(contributedEquity + netProfit);

  return {
    assetLines,
    liabilityLines,
    equityLines,
    totalAssets,
    totalLiabilities,
    contributedEquity,
    netProfit,
    totalEquity,
    totalEquityAndLiabilities: round2(totalLiabilities + totalEquity),
    balanced: moneyEquals(totalAssets, round2(totalLiabilities + totalEquity)),
  };
}

/** The column an account's balance would fall in, useful for colour hints. */
export function balanceSideOf(account: Account, ledger: Ledger): "debit" | "credit" {
  const net = netDebit(ledger, account.id);
  if (moneyEquals(net, 0)) return normalBalance(account);
  return net > 0 ? "debit" : "credit";
}
