/**
 * Structural validation of a submitted journal entry against the expected one.
 *
 * Two independent questions are answered, and the game treats them separately
 * on purpose:
 *   1. Does it balance?        (arithmetic)
 *   2. Is it the right entry?  (concept)
 *
 * An entry can balance perfectly and still be completely wrong — for example
 * debiting Cash and crediting Capital when the business actually bought
 * inventory on credit. Students must learn that balance alone proves nothing.
 */

import { entryTotals, findAccount, moneyEquals, round2 } from "./engine";
import type { Account, EntryLine, JournalEntry } from "./types";

export type IssueKind =
  | "missing-line"
  | "extra-line"
  | "wrong-side"
  | "wrong-amount"
  | "wrong-account";

export interface ValidationIssue {
  kind: IssueKind;
  /** The account the student used (for substitution/extra issues). */
  accountId?: string;
  /** The account the correct entry used. */
  expectedAccountId?: string;
  side?: EntryLine["side"];
  amount?: number;
  message: string;
}

export interface ValidationResult {
  /** Debits equal credits. */
  balanced: boolean;
  /** Balanced *and* identical to the expected entry. */
  correct: boolean;
  debitTotal: number;
  creditTotal: number;
  difference: number;
  issues: ValidationIssue[];
}

function lineKey(line: EntryLine): string {
  return `${line.accountId}|${line.side}|${round2(line.amount).toFixed(2)}`;
}

function clone(lines: EntryLine[]): EntryLine[] {
  return lines.map((line) => ({ ...line }));
}

interface Match {
  expected: EntryLine;
  submitted: EntryLine;
}

/**
 * Greedily pair submitted lines to expected lines, from the strictest match to
 * the loosest, so feedback describes the smallest sensible correction.
 */
function matchLines(submitted: EntryLine[], expected: EntryLine[]): {
  exact: Match[];
  extra: EntryLine[];
  missing: EntryLine[];
} {
  const subPool = clone(submitted);
  const expPool = clone(expected);
  const exact: Match[] = [];

  const takeMatch = (
    predicate: (submitted: EntryLine, expected: EntryLine) => boolean,
  ): void => {
    for (let i = expPool.length - 1; i >= 0; i -= 1) {
      const expectedLine = expPool[i];
      const j = subPool.findIndex((submittedLine) => predicate(submittedLine, expectedLine));
      if (j >= 0) {
        exact.push({ expected: expectedLine, submitted: subPool[j] });
        expPool.splice(i, 1);
        subPool.splice(j, 1);
      }
    }
  };

  // 1. Identical lines.
  takeMatch((s, e) => lineKey(s) === lineKey(e));
  // 2. Right account and side, wrong amount.
  takeMatch((s, e) => s.accountId === e.accountId && s.side === e.side);
  // 3. Right account, wrong side.
  takeMatch((s, e) => s.accountId === e.accountId);

  return { exact, extra: subPool, missing: expPool };
}

/**
 * Validate a submitted entry. `accounts` is needed to resolve account ids into
 * their types when describing which accounts were mixed up.
 */
export function validateEntry(
  submitted: JournalEntry | EntryLine[],
  expected: JournalEntry | EntryLine[],
  accounts: Account[],
): ValidationResult {
  const submittedLines = Array.isArray(submitted) ? submitted : submitted.lines;
  const expectedLines = Array.isArray(expected) ? expected : expected.lines;

  const totals = entryTotals(submittedLines);
  const { exact, extra, missing } = matchLines(submittedLines, expectedLines);
  const issues: ValidationIssue[] = [];

  const nameOf = (accountId?: string): string => {
    if (!accountId) return "an account";
    try {
      return findAccount(accounts, accountId).name;
    } catch {
      return accountId;
    }
  };

  for (const match of exact) {
    if (!moneyEquals(match.submitted.amount, match.expected.amount)) {
      issues.push({
        kind: "wrong-amount",
        accountId: match.submitted.accountId,
        side: match.submitted.side,
        amount: match.submitted.amount,
        message: `${nameOf(match.submitted.accountId)} is on the right side but the amount should be ${round2(
          match.expected.amount,
        )}, not ${round2(match.submitted.amount)}.`,
      });
    } else if (match.submitted.side !== match.expected.side) {
      issues.push({
        kind: "wrong-side",
        accountId: match.submitted.accountId,
        side: match.submitted.side,
        message: `${nameOf(match.submitted.accountId)} is on the wrong side of the entry.`,
      });
    }
  }

  // Pair a missing line with an extra line of the same side and amount: the
  // student almost certainly chose the wrong account.
  const extraPool = clone(extra);
  for (const expectedLine of missing) {
    const j = extraPool.findIndex(
      (candidate) =>
        candidate.side === expectedLine.side &&
        moneyEquals(candidate.amount, expectedLine.amount),
    );
    if (j >= 0) {
      const usedLine = extraPool.splice(j, 1)[0];
      issues.push({
        kind: "wrong-account",
        accountId: usedLine.accountId,
        expectedAccountId: expectedLine.accountId,
        side: usedLine.side,
        amount: usedLine.amount,
        message: `${nameOf(usedLine.accountId)} should not be in this entry; ${nameOf(
          expectedLine.accountId,
        )} belongs here instead.`,
      });
    } else {
      issues.push({
        kind: "missing-line",
        expectedAccountId: expectedLine.accountId,
        side: expectedLine.side,
        amount: expectedLine.amount,
        message: `The entry is missing ${nameOf(expectedLine.accountId)} on the ${expectedLine.side} side.`,
      });
    }
  }

  for (const extraLine of extraPool) {
    issues.push({
      kind: "extra-line",
      accountId: extraLine.accountId,
      side: extraLine.side,
      amount: extraLine.amount,
      message: `${nameOf(extraLine.accountId)} does not belong in this entry.`,
    });
  }

  if (!totals.balanced) {
    issues.unshift({
      kind: "extra-line",
      message: `Debits and credits must be equal. You are out by ${round2(
        Math.abs(totals.difference),
      )}.`,
    });
  }

  return {
    balanced: totals.balanced,
    correct: totals.balanced && issues.length === 0,
    debitTotal: totals.debitTotal,
    creditTotal: totals.creditTotal,
    difference: totals.difference,
    issues,
  };
}
