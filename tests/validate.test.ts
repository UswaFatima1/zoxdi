import { describe, expect, it } from "vitest";
import { ACCOUNTS } from "@/data/accounting/accounts";
import { validateEntry } from "@/lib/accounting/validate";
import type { Side } from "@/lib/accounting/types";

function line(accountId: string, side: Side, amount: number) {
  return { accountId, side, amount };
}

const creditPurchaseExpected = [
  line("inventory", "debit", 60000),
  line("accounts-payable", "credit", 60000),
];

describe("validateEntry", () => {
  it("accepts a correct, balanced entry", () => {
    const result = validateEntry(creditPurchaseExpected, creditPurchaseExpected, ACCOUNTS);
    expect(result.correct).toBe(true);
    expect(result.balanced).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it("rejects an unbalanced entry", () => {
    const result = validateEntry(
      [line("inventory", "debit", 50000), line("accounts-payable", "credit", 60000)],
      creditPurchaseExpected,
      ACCOUNTS,
    );
    expect(result.balanced).toBe(false);
    expect(result.correct).toBe(false);
  });

  it("rejects a balanced entry that uses the wrong accounts", () => {
    const wrong = [line("cash", "debit", 60000), line("capital", "credit", 60000)];
    const result = validateEntry(wrong, creditPurchaseExpected, ACCOUNTS);
    expect(result.balanced).toBe(true);
    expect(result.correct).toBe(false);
    expect(result.issues.some((issue) => issue.kind === "wrong-account")).toBe(true);
  });

  it("detects a wrong side on the right account", () => {
    const result = validateEntry(
      [line("inventory", "credit", 60000), line("accounts-payable", "debit", 60000)],
      creditPurchaseExpected,
      ACCOUNTS,
    );
    expect(result.balanced).toBe(true);
    expect(result.correct).toBe(false);
    expect(result.issues.some((issue) => issue.kind === "wrong-side")).toBe(true);
  });

  it("detects wrong amounts on the right accounts and sides", () => {
    const result = validateEntry(
      [
        line("inventory", "debit", 60000),
        line("accounts-payable", "credit", 70000),
      ],
      creditPurchaseExpected,
      ACCOUNTS,
    );
    expect(result.balanced).toBe(false);
    expect(result.correct).toBe(false);
  });

  it("detects a missing half of the double entry", () => {
    const result = validateEntry(
      [line("inventory", "debit", 60000)],
      creditPurchaseExpected,
      ACCOUNTS,
    );
    expect(result.correct).toBe(false);
    expect(result.issues.some((issue) => issue.kind === "missing-line")).toBe(true);
  });

  it("flags an extra account the transaction never touched", () => {
    const result = validateEntry(
      [
        line("inventory", "debit", 60000),
        line("accounts-payable", "credit", 60000),
        line("cash", "credit", 10000),
      ],
      creditPurchaseExpected,
      ACCOUNTS,
    );
    expect(result.balanced).toBe(false);
    expect(result.issues.some((issue) => issue.kind === "extra-line")).toBe(true);
  });

  it("accepts multi-line split entries", () => {
    const expected = [
      line("cash", "debit", 40000),
      line("accounts-receivable", "debit", 50000),
      line("sales-revenue", "credit", 90000),
    ];
    const result = validateEntry(expected, expected, ACCOUNTS);
    expect(result.correct).toBe(true);
  });
});
