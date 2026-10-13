import { describe, expect, it } from "vitest";
import { ACCOUNTS } from "@/data/accounting/accounts";
import { buildLedger, findAccount } from "@/lib/accounting/engine";
import { balanceSheet, incomeStatement, trialBalance } from "@/lib/accounting/statements";
import type { EntryLine } from "@/lib/accounting/types";

/**
 * A complete, internally consistent month for Zoxdi Traders, kept here as a
 * test fixture. Unlike the teaching levels (which isolate one idea), every sale
 * carries its cost of goods sold, so the trial balance and statements must add
 * up exactly. The Lab itself ships empty — this month is never loaded into it.
 */
const LAB_MONTH: EntryLine[][] = [
  [
    { accountId: "cash", side: "debit", amount: 500000 },
    { accountId: "capital", side: "credit", amount: 500000 },
  ],
  [
    { accountId: "equipment", side: "debit", amount: 150000 },
    { accountId: "cash", side: "credit", amount: 150000 },
  ],
  [
    { accountId: "inventory", side: "debit", amount: 200000 },
    { accountId: "accounts-payable", side: "credit", amount: 200000 },
  ],
  [
    { accountId: "inventory", side: "debit", amount: 80000 },
    { accountId: "cash", side: "credit", amount: 80000 },
  ],
  [
    { accountId: "cash", side: "debit", amount: 150000 },
    { accountId: "sales-revenue", side: "credit", amount: 150000 },
    { accountId: "cost-of-goods-sold", side: "debit", amount: 90000 },
    { accountId: "inventory", side: "credit", amount: 90000 },
  ],
  [
    { accountId: "accounts-receivable", side: "debit", amount: 100000 },
    { accountId: "sales-revenue", side: "credit", amount: 100000 },
    { accountId: "cost-of-goods-sold", side: "debit", amount: 60000 },
    { accountId: "inventory", side: "credit", amount: 60000 },
  ],
  [
    { accountId: "accounts-payable", side: "debit", amount: 120000 },
    { accountId: "cash", side: "credit", amount: 120000 },
  ],
  [
    { accountId: "cash", side: "debit", amount: 60000 },
    { accountId: "accounts-receivable", side: "credit", amount: 60000 },
  ],
  [
    { accountId: "rent-expense", side: "debit", amount: 25000 },
    { accountId: "cash", side: "credit", amount: 25000 },
  ],
  [
    { accountId: "salaries-expense", side: "debit", amount: 40000 },
    { accountId: "cash", side: "credit", amount: 40000 },
  ],
  [
    { accountId: "bank", side: "debit", amount: 200000 },
    { accountId: "bank-loan", side: "credit", amount: 200000 },
  ],
  [
    { accountId: "bank-charges", side: "debit", amount: 1500 },
    { accountId: "bank", side: "credit", amount: 1500 },
  ],
];

const ledger = buildLedger(LAB_MONTH);

describe("trial balance", () => {
  const trial = trialBalance(ACCOUNTS, ledger);

  it("balances debit and credit totals for a coherent ledger", () => {
    expect(trial.balanced).toBe(true);
    expect(trial.totalDebit).toBe(trial.totalCredit);
  });

  it("places asset balances in the debit column and liabilities in credit", () => {
    const cash = trial.rows.find((row) => row.account.id === "cash");
    expect(cash?.debit).toBeGreaterThan(0);
    expect(cash?.credit).toBe(0);

    const payable = trial.rows.find((row) => row.account.id === "accounts-payable");
    expect(payable?.credit).toBeGreaterThan(0);
    expect(payable?.debit).toBe(0);
  });
});

describe("income statement", () => {
  const income = incomeStatement(ACCOUNTS, ledger);

  it("nets revenue against expenses", () => {
    // Sales 250,000; COGS 150,000 + rent 25,000 + salaries 40,000 + bank charges 1,500.
    expect(income.totalRevenue).toBe(250000);
    expect(income.totalExpenses).toBe(216500);
    expect(income.netProfit).toBe(33500);
  });
});

describe("balance sheet", () => {
  const sheet = balanceSheet(ACCOUNTS, ledger);

  it("holds the accounting identity", () => {
    expect(sheet.balanced).toBe(true);
    expect(sheet.totalAssets).toBe(
      sheet.totalLiabilities + sheet.totalEquity,
    );
  });

  it("folds the period profit into equity", () => {
    expect(sheet.netProfit).toBe(33500);
    // Capital 500,000 less drawings 0, plus profit.
    expect(sheet.contributedEquity).toBe(500000);
    expect(sheet.totalEquity).toBe(533500);
  });

  it("tracks the remaining inventory after sales", () => {
    // Bought 200,000 + 80,000; sold 90,000 + 60,000.
    expect(balanceSheet(ACCOUNTS, ledger).assetLines.find((line) => line.account.id === "inventory")?.amount).toBe(130000);
  });
});

describe("lab data integrity", () => {
  it("every lab entry balances", () => {
    LAB_MONTH.forEach((entry, index) => {
      const ledgerForOne = buildLedger([entry]);
      const trial = trialBalance(ACCOUNTS, ledgerForOne);
      expect(trial.balanced, `entry ${index}`).toBe(true);
    });
  });

  it("only references known accounts", () => {
    for (const entry of LAB_MONTH) {
      for (const line of entry) {
        expect(() => findAccount(ACCOUNTS, line.accountId)).not.toThrow();
      }
    }
  });
});
