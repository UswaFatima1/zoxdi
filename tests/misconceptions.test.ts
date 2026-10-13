import { describe, expect, it } from "vitest";
import { ACCOUNTS } from "@/data/accounting/accounts";
import { diagnoseEntry } from "@/lib/learning/diagnose";
import {
  detectMisconceptions,
  isKnownMisconception,
  misconceptionFor,
} from "@/lib/learning/misconceptions";
import { validateEntry } from "@/lib/accounting/validate";
import type { Side } from "@/lib/accounting/types";

function line(accountId: string, side: Side, amount: number) {
  return { accountId, side, amount };
}

const expected = [
  line("inventory", "debit", 60000),
  line("accounts-payable", "credit", 60000),
];

describe("misconception detection", () => {
  it("returns no tags for a correct entry", () => {
    const diagnosis = diagnoseEntry(expected, expected, ACCOUNTS);
    expect(diagnosis.tags).toHaveLength(0);
    expect(diagnosis.headline).toContain("Correct");
  });

  it("identifies asset-vs-liability confusion on the credit purchase", () => {
    const submitted = [
      line("inventory", "debit", 60000),
      line("cash", "credit", 60000),
    ];
    const validation = validateEntry(submitted, expected, ACCOUNTS);
    const tags = detectMisconceptions(submitted, expected, ACCOUNTS, validation);
    expect(tags).toContain("asset-liability-confusion");
  });

  it("names the confusion when cash is substituted for the liability", () => {
    const submitted = [
      line("inventory", "debit", 60000),
      line("cash", "credit", 60000),
    ];
    const diagnosis = diagnoseEntry(submitted, expected, ACCOUNTS);
    expect(diagnosis.misconceptions.map((item) => item.tag)).toContain(
      "asset-liability-confusion",
    );
    expect(diagnosis.remedy.length).toBeGreaterThan(10);
  });

  it("flags balanced-but-wrong when the entry balances with wrong accounts", () => {
    const submitted = [
      line("cash", "debit", 60000),
      line("capital", "credit", 60000),
    ];
    const diagnosis = diagnoseEntry(submitted, expected, ACCOUNTS);
    expect(diagnosis.validation.balanced).toBe(true);
    expect(diagnosis.tags).toContain("balanced-but-wrong");
  });

  it("flags unbalanced entries without extra confusion noise", () => {
    const submitted = [line("inventory", "debit", 50000)];
    const diagnosis = diagnoseEntry(submitted, expected, ACCOUNTS);
    expect(diagnosis.tags).toContain("unbalanced-entry");
    expect(diagnosis.misconceptions[0].conceptId).toBe("double-entry");
  });

  it("provides a human-readable remedy for every tag", () => {
    for (const tag of ["asset-liability-confusion", "wrong-increase-side", "omitted-line"]) {
      const misconception = misconceptionFor(tag);
      expect(misconception.label.length).toBeGreaterThan(3);
      expect(misconception.remedy.length).toBeGreaterThan(10);
      expect(misconception.conceptId).toBeTruthy();
    }
  });

  it("labels confusion tags with correct pluralisation", () => {
    expect(misconceptionFor("asset-liability-confusion").label).toBe(
      "Confusing assets and liabilities",
    );
    expect(misconceptionFor("equity-liability-confusion").label).toBe(
      "Confusing equity and liabilities",
    );
  });

  it("treats concept ids as unknown so they never appear on the map", () => {
    expect(isKnownMisconception("asset-liability-confusion")).toBe(true);
    expect(isKnownMisconception("account-substitution")).toBe(true);
    expect(isKnownMisconception("account-classification")).toBe(false);
    expect(isKnownMisconception("nonsense-confusion")).toBe(false);
    expect(isKnownMisconception("omitted-line")).toBe(true);
  });
});
