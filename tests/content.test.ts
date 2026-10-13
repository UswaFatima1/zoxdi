import { describe, expect, it } from "vitest";
import { ACCOUNTS } from "@/data/accounting/accounts";
import { CHAPTERS, LEVELS, TRANSACTION_BY_ID } from "@/data/accounting";
import { entryTotals } from "@/lib/accounting/engine";

const ACCOUNT_IDS = new Set(ACCOUNTS.map((account) => account.id));
const CHAPTER_IDS = new Set(CHAPTERS.map((chapter) => chapter.id));

describe("curriculum integrity", () => {
  it("uses unique level ids and orders", () => {
    const ids = LEVELS.map((level) => level.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(LEVELS.map((level) => level.order)).size).toBe(LEVELS.length);
  });

  it("points every level at a real chapter", () => {
    for (const level of LEVELS) {
      expect(CHAPTER_IDS.has(level.chapterId), level.id).toBe(true);
    }
  });

  it("keeps every forge transaction balanced and fully accounted for", () => {
    for (const level of LEVELS) {
      if (level.mode !== "forge") continue;
      const transaction = TRANSACTION_BY_ID[level.transactionId];
      expect(transaction, `${level.id} missing transaction`).toBeTruthy();
      expect(entryTotals(transaction.expected).balanced, transaction.id).toBe(true);
      // Every account the entry touches must appear in the tray the student picks from.
      const tray = new Set(transaction.accountIds);
      for (const line of transaction.expected) {
        expect(tray.has(line.accountId), `${transaction.id}: ${line.accountId} not in tray`).toBe(
          true,
        );
        expect(ACCOUNT_IDS.has(line.accountId), line.accountId).toBe(true);
      }
    }
  });

  it("offers the correct option in every choice level, with unique options", () => {
    for (const level of LEVELS) {
      if (level.mode !== "effect" && level.mode !== "balance" && level.mode !== "quiz") continue;
      const optionIds = level.options.map((option) => option.id);
      expect(new Set(optionIds).size, `${level.id} duplicate options`).toBe(optionIds.length);
      expect(optionIds.includes(level.correctOptionId), `${level.id} correct option`).toBe(true);
    }
  });

  it("references only known accounts from balance and trial levels", () => {
    for (const level of LEVELS) {
      if (level.mode === "balance") {
        expect(ACCOUNT_IDS.has(level.accountId), `${level.id} account`).toBe(true);
      }
      if (level.mode === "trial") {
        for (const row of level.rows) {
          expect(ACCOUNT_IDS.has(row.accountId), `${level.id} row ${row.accountId}`).toBe(true);
        }
      }
    }
  });

  it("builds trial levels whose columns agree", () => {
    for (const level of LEVELS) {
      if (level.mode !== "trial") continue;
      const debit = level.rows
        .filter((row) => row.correctSide === "debit")
        .reduce((sum, row) => sum + row.amount, 0);
      const credit = level.rows
        .filter((row) => row.correctSide === "credit")
        .reduce((sum, row) => sum + row.amount, 0);
      expect(debit, `${level.id} debits vs credits`).toBe(credit);
    }
  });

  it("sorts only into real buckets", () => {
    for (const level of LEVELS) {
      if (level.mode !== "sort") continue;
      const bucketIds = new Set(level.buckets.map((bucket) => bucket.id));
      for (const item of level.items) {
        expect(bucketIds.has(item.bucketId), `${level.id}: ${item.id}`).toBe(true);
      }
    }
  });
});
