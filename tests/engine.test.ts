import { describe, expect, it } from "vitest";
import { ACCOUNTS } from "@/data/accounting/accounts";
import {
  accountingEquation,
  applyEntry,
  buildLedger,
  emptyLedger,
  equationDelta,
  formatMoney,
  moneyEquals,
  netDebit,
  round2,
  tAccount,
} from "@/lib/accounting/engine";
import { entryTotals, findAccount } from "@/lib/accounting/engine";
import { checkEntry } from "@/lib/accounting/engine";
import {
  DECREASE_SIDE,
  NORMAL_BALANCE,
  normalBalance,
  opposite,
} from "@/lib/accounting/rules";
import type { AccountType, Side } from "@/lib/accounting/types";

describe("accounting rules", () => {
  it("assets and expenses increase on the debit side", () => {
    expect(NORMAL_BALANCE.asset).toBe("debit");
    expect(NORMAL_BALANCE.expense).toBe("debit");
  });

  it("liabilities, equity and revenue increase on the credit side", () => {
    expect(NORMAL_BALANCE.liability).toBe("credit");
    expect(NORMAL_BALANCE.equity).toBe("credit");
    expect(NORMAL_BALANCE.revenue).toBe("credit");
  });

  it("the decrease side is always the opposite of the normal side", () => {
    for (const type of Object.keys(DECREASE_SIDE) as AccountType[]) {
      expect(DECREASE_SIDE[type]).toBe(opposite(NORMAL_BALANCE[type]));
    }
  });

  it("drawings overrides its normal balance to debit (contra-equity)", () => {
    const drawings = findAccount(ACCOUNTS, "drawings");
    expect(normalBalance(drawings)).toBe("debit");
    const capital = findAccount(ACCOUNTS, "capital");
    expect(normalBalance(capital)).toBe("credit");
  });
});

describe("entry totals", () => {
  const balanced = [
    { accountId: "cash", side: "debit" as Side, amount: 60000 },
    { accountId: "accounts-payable", side: "credit" as Side, amount: 60000 },
  ];

  it("reports equal totals as balanced", () => {
    const totals = entryTotals(balanced);
    expect(totals.balanced).toBe(true);
    expect(totals.debitTotal).toBe(60000);
    expect(totals.creditTotal).toBe(60000);
  });

  it("reports unequal totals as unbalanced", () => {
    const totals = entryTotals([
      { accountId: "cash", side: "debit", amount: 50000 },
      { accountId: "accounts-payable", side: "credit", amount: 60000 },
    ]);
    expect(totals.balanced).toBe(false);
    expect(totals.difference).toBe(-10000);
  });

  it("tolerates floating point noise", () => {
    const totals = entryTotals([
      { accountId: "cash", side: "debit", amount: 0.1 + 0.2 },
      { accountId: "sales-revenue", side: "credit", amount: 0.3 },
    ]);
    expect(totals.balanced).toBe(true);
  });
});

describe("account lab entry check", () => {
  it("marks a two-sided balanced entry as ready to post", () => {
    const check = checkEntry(ACCOUNTS, [
      { accountId: "cash", side: "debit", amount: 5000 },
      { accountId: "sales-revenue", side: "credit", amount: 5000 },
    ]);
    expect(check.balanced).toBe(true);
    expect(check.readyToPost).toBe(true);
    expect(check.hasDebit).toBe(true);
    expect(check.hasCredit).toBe(true);
  });

  it("explains an unbalanced entry with the dollar difference", () => {
    const check = checkEntry(ACCOUNTS, [
      { accountId: "cash", side: "debit", amount: 5000 },
      { accountId: "sales-revenue", side: "credit", amount: 3000 },
    ]);
    expect(check.balanced).toBe(false);
    expect(check.difference).toBe(2000);
    // Still allowed to post so the student can see the trial balance break.
    expect(check.readyToPost).toBe(true);
  });

  it("flags accounts that are not in the chart", () => {
    const check = checkEntry(ACCOUNTS, [
      { accountId: "cash", side: "debit", amount: 1000 },
      { accountId: "made-up-account", side: "credit", amount: 1000 },
    ]);
    expect(check.unknownAccountIds).toEqual(["made-up-account"]);
    expect(check.readyToPost).toBe(false);
  });

  it("flags a one-sided entry that has no credit", () => {
    const check = checkEntry(ACCOUNTS, [
      { accountId: "cash", side: "debit", amount: 1000 },
    ]);
    expect(check.hasCredit).toBe(false);
    expect(check.readyToPost).toBe(false);
  });

  it("treats an empty entry as not ready", () => {
    const check = checkEntry(ACCOUNTS, []);
    expect(check.empty).toBe(true);
    expect(check.readyToPost).toBe(false);
  });
});

describe("ledger application", () => {
  it("applies entries without mutating the input ledger", () => {
    const ledger = emptyLedger();
    const next = applyEntry(ledger, [
      { accountId: "cash", side: "debit", amount: 1000 },
      { accountId: "capital", side: "credit", amount: 1000 },
    ]);
    expect(ledger.cash).toBeUndefined();
    expect(next.cash?.debits).toBe(1000);
    expect(next.capital?.credits).toBe(1000);
  });

  it("accumulates across multiple postings onto one account", () => {
    const ledger = applyEntry(emptyLedger(), [
      { accountId: "cash", side: "debit", amount: 1000 },
      { accountId: "sales-revenue", side: "credit", amount: 1000 },
    ]);
    const after = applyEntry(ledger, [
      { accountId: "cash", side: "debit", amount: 500 },
      { accountId: "service-revenue", side: "credit", amount: 500 },
    ]);
    expect(after.cash?.debits).toBe(1500);
  });

  it("builds a ledger from many entries in sequence", () => {
    const ledger = buildLedger([
      [
        { accountId: "cash", side: "debit", amount: 500000 },
        { accountId: "capital", side: "credit", amount: 500000 },
      ],
      [
        { accountId: "inventory", side: "debit", amount: 120000 },
        { accountId: "cash", side: "credit", amount: 120000 },
      ],
      [
        { accountId: "rent-expense", side: "debit", amount: 25000 },
        { accountId: "cash", side: "credit", amount: 25000 },
      ],
    ]);
    expect(netDebit(ledger, "cash")).toBe(355000);
    expect(netDebit(ledger, "inventory")).toBe(120000);
  });

  it("produces a T-account with balance on the normal side", () => {
    const ledger = applyEntry(emptyLedger(), [
      { accountId: "cash", side: "debit", amount: 9000 },
      { accountId: "sales-revenue", side: "credit", amount: 9000 },
    ]);
    const cash = tAccount(findAccount(ACCOUNTS, "cash"), ledger);
    expect(cash).toMatchObject({ debit: 9000, credit: 0, balance: 9000, balanceSide: "debit" });

    const revenue = tAccount(findAccount(ACCOUNTS, "sales-revenue"), ledger);
    expect(revenue).toMatchObject({ debit: 0, credit: 9000, balance: 9000, balanceSide: "credit" });
  });

  it("keeps the accounting equation identity after every transaction", () => {
    const ledger = buildLedger([
      [
        { accountId: "cash", side: "debit", amount: 500000 },
        { accountId: "capital", side: "credit", amount: 500000 },
      ],
      [
        { accountId: "inventory", side: "debit", amount: 170000 },
        { accountId: "accounts-payable", side: "credit", amount: 60000 },
        { accountId: "cash", side: "credit", amount: 110000 },
      ],
      [
        { accountId: "cash", side: "debit", amount: 45000 },
        { accountId: "sales-revenue", side: "credit", amount: 45000 },
      ],
      [
        { accountId: "rent-expense", side: "debit", amount: 25000 },
        { accountId: "cash", side: "credit", amount: 25000 },
      ],
    ]);
    const equation = accountingEquation(ACCOUNTS, ledger);
    expect(equation.balanced).toBe(true);
    expect(equation.identityHolds).toBe(true);
    expect(round2(equation.assets)).toBe(round2(equation.liabilities + equation.equity));
    expect(equation.revenue).toBe(45000);
    expect(equation.expenses).toBe(25000);
  });
});

describe("equation deltas", () => {
  it("reports a credit purchase as asset up and liability up", () => {
    const delta = equationDelta(ACCOUNTS, [
      { accountId: "inventory", side: "debit", amount: 60000 },
      { accountId: "accounts-payable", side: "credit", amount: 60000 },
    ]);
    expect(delta.assets).toBe(60000);
    expect(delta.liabilities).toBe(60000);
    expect(delta.equity).toBe(0);
  });

  it("reports a cash sale as asset up and revenue/equity up", () => {
    const delta = equationDelta(ACCOUNTS, [
      { accountId: "cash", side: "debit", amount: 45000 },
      { accountId: "sales-revenue", side: "credit", amount: 45000 },
    ]);
    expect(delta.assets).toBe(45000);
    expect(delta.revenue).toBe(45000);
    expect(delta.equity).toBe(45000);
  });

  it("reports paying rent as asset down and equity down (expense)", () => {
    const delta = equationDelta(ACCOUNTS, [
      { accountId: "rent-expense", side: "debit", amount: 25000 },
      { accountId: "cash", side: "credit", amount: 25000 },
    ]);
    expect(delta.assets).toBe(-25000);
    expect(delta.expenses).toBe(25000);
    expect(delta.equity).toBe(-25000);
  });

  it("reports drawings as reducing equity", () => {
    const delta = equationDelta(ACCOUNTS, [
      { accountId: "drawings", side: "debit", amount: 10000 },
      { accountId: "cash", side: "credit", amount: 10000 },
    ]);
    expect(delta.assets).toBe(-10000);
    expect(delta.drawings).toBe(10000);
    expect(delta.equity).toBe(-10000);
  });
});

describe("money helpers", () => {
  it("rounds to two decimals", () => {
    expect(round2(1.005 + 0.002)).toBe(1.01);
    expect(round2(12.345)).toBe(12.35);
  });

  it("compares amounts with a half-cent tolerance", () => {
    expect(moneyEquals(1.1, 1.1 + 1e-9)).toBe(true);
    expect(moneyEquals(1, 2)).toBe(false);
  });

  it("formats USD with thousands separators", () => {
    expect(formatMoney(12000)).toBe("12,000");
    expect(formatMoney(-25000, { sign: true })).toBe("-25,000");
    expect(formatMoney(45000, { sign: true })).toBe("+45,000");
  });
});
