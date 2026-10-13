/**
 * The misconception taxonomy — the heart of Zoxdi's adaptive feedback.
 *
 * A red cross tells a student they were wrong. Naming the *reason* they were
 * wrong tells them what to fix. Each tag maps to the concept it implicates and
 * to a targeted remedy, so a repeated mistake turns into a specific practice
 * recommendation instead of the same question again.
 */

import type { Account, AccountType, EntryLine, JournalEntry } from "../accounting/types";
import { findAccount } from "../accounting/engine";
import type { ValidationResult } from "../accounting/validate";
import type { ConceptId } from "./concepts";

export interface Misconception {
  tag: string;
  label: string;
  explanation: string;
  remedy: string;
  conceptId: ConceptId;
}

const TAXONOMY: Record<string, Omit<Misconception, "tag">> = {
  "unbalanced-entry": {
    label: "The entry does not balance",
    explanation:
      "Every transaction affects at least two accounts, and the total debits must always equal the total credits. This entry's two sides are not equal.",
    remedy:
      "Split each transaction into the account that gives and the account that receives, then check that both sides total the same amount.",
    conceptId: "double-entry",
  },
  "wrong-increase-side": {
    label: "Used the side that decreases the account",
    explanation:
      "You placed an account on the side that reduces it. Remember: assets and expenses increase on the debit side; liabilities, equity and revenue increase on the credit side.",
    remedy:
      "Rehearse the increase rules: Debit increases assets and expenses; Credit increases liabilities, equity and revenue.",
    conceptId: "debit-credit-rules",
  },
  "amount-error": {
    label: "Correct accounts, wrong amount",
    explanation:
      "You chose the right accounts and the right sides, but the figure does not match the transaction. Accounting is exact — the number matters.",
    remedy:
      "Re-read the transaction and copy the amount carefully, in the right account, on the right side.",
    conceptId: "journal-entries",
  },
  "omitted-line": {
    label: "Part of the entry is missing",
    explanation:
      "A double entry needs both halves. One side of this transaction has been left out.",
    remedy:
      "For each transaction, ask: which account receives, and which account gives? Both must appear.",
    conceptId: "double-entry",
  },
  "extra-line": {
    label: "An account was added that does not belong",
    explanation: "This entry contains an account the transaction never touched.",
    remedy:
      "Only record accounts that the transaction actually changes. Re-read the scenario before adding a line.",
    conceptId: "journal-entries",
  },
  "balanced-but-wrong": {
    label: "Balanced, but the wrong entry",
    explanation:
      "Your debits and credits matched, so the arithmetic is fine — but the accounts are wrong. This is the trap: a balanced entry can still be completely incorrect.",
    remedy:
      "Check the accounts first, then the arithmetic. Always ask what the transaction really changed before you check the totals.",
    conceptId: "journal-entries",
  },
  "account-substitution": {
    label: "Wrong account chosen",
    explanation:
      "The entry uses an account the transaction did not affect, even though the amount and side are right.",
    remedy:
      "Name the two accounts the transaction touches before you build the entry.",
    conceptId: "account-classification",
  },
};

/** Canonical tag for "student mixed up two account types", e.g. asset + liability. */
export function confusionTag(a: AccountType, b: AccountType): string {
  return [a, b].sort().join("-") + "-confusion";
}

const CONFUSION_EXPLANATIONS: Record<string, string> = {
  "asset-liability-confusion":
    "You mixed up something the business *owns* (an asset) with something it *owes* (a liability). Inventory bought on credit increases both — it is not one or the other.",
  "asset-expense-confusion":
    "You mixed up an asset with an expense. An asset still has value the business keeps; an expense is a cost that is used up.",
  "revenue-asset-confusion":
    "You mixed up revenue earned with an asset received. A sale earns revenue; cash or a receivable is what the business receives in return.",
  "expense-liability-confusion":
    "You mixed up an expense with a liability. Incurring a cost is an expense; an amount still owed is a liability.",
  "equity-liability-confusion":
    "You mixed up the owner's stake (equity) with a debt to an outsider (a liability).",
  "equity-revenue-confusion":
    "You mixed up the owner's investment (equity) with income earned from trading (revenue).",
};

const TYPE_PLURAL: Record<AccountType, string> = {
  asset: "assets",
  liability: "liabilities",
  equity: "equity",
  revenue: "revenue",
  expense: "expenses",
};

function confusionLabel(a: AccountType, b: AccountType): string {
  const sorted = [a, b].sort();
  return `Confusing ${TYPE_PLURAL[sorted[0]]} and ${TYPE_PLURAL[sorted[1]]}`;
}

function resolveTag(tag: string): Misconception {
  if (TAXONOMY[tag]) return { tag, ...TAXONOMY[tag] };

  if (tag.endsWith("-confusion")) {
    const [a, b] = tag.replace("-confusion", "").split("-") as AccountType[];
    return {
      tag,
      label: confusionLabel(a, b),
      explanation:
        CONFUSION_EXPLANATIONS[tag] ??
        `You used a ${a} where a ${b} was needed, or the other way around.`,
      remedy: `Sort the accounts first: what does the business own, what does it owe, what is the owner's stake, what did it earn, and what did it use up?`,
      conceptId: "account-classification",
    };
  }

  return {
    tag,
    label: "Needs another look",
    explanation: "This entry does not match the transaction.",
    remedy: "Re-read the scenario and identify both accounts and both sides.",
    conceptId: "journal-entries",
  };
}

export function misconceptionFor(tag: string): Misconception {
  return resolveTag(tag);
}

const ACCOUNT_TYPE_SET = new Set<AccountType>([
  "asset",
  "liability",
  "equity",
  "revenue",
  "expense",
]);

/** True when a tag resolves to a real, labelled misconception (not the fallback). */
export function isKnownMisconception(tag: string): boolean {
  if (Object.prototype.hasOwnProperty.call(TAXONOMY, tag)) return true;
  if (tag.endsWith("-confusion")) {
    const parts = tag.replace("-confusion", "").split("-") as AccountType[];
    return parts.length === 2 && parts.every((part) => ACCOUNT_TYPE_SET.has(part));
  }
  return false;
}

function typesOf(lines: EntryLine[], accounts: Account[]): Set<AccountType> {
  const types = new Set<AccountType>();
  for (const line of lines) {
    try {
      types.add(findAccount(accounts, line.accountId).type);
    } catch {
      // Unknown account: ignore it for type-confusion analysis.
    }
  }
  return types;
}

/**
 * Turn a validation result plus the submitted/expected entries into a ranked
 * list of misconception tags. The first tag is treated as the primary lesson.
 */
export function detectMisconceptions(
  submitted: JournalEntry | EntryLine[],
  expected: JournalEntry | EntryLine[],
  accounts: Account[],
  validation: ValidationResult,
): string[] {
  const submittedLines = Array.isArray(submitted) ? submitted : submitted.lines;
  const expectedLines = Array.isArray(expected) ? expected : expected.lines;

  if (validation.correct) return [];

  const tags = new Set<string>();

  if (!validation.balanced) tags.add("unbalanced-entry");

  for (const issue of validation.issues) {
    switch (issue.kind) {
      case "wrong-side":
        tags.add("wrong-increase-side");
        break;
      case "wrong-amount":
        tags.add("amount-error");
        break;
      case "missing-line":
        tags.add("omitted-line");
        break;
      case "extra-line":
        // The generic "out by X" issue shares this kind; skip it here.
        if (issue.accountId) tags.add("extra-line");
        break;
      case "wrong-account":
        tags.add("account-substitution");
        break;
    }
  }

  // Type-level confusion, compared *per side*. This is what lets the game say
  // "you are confusing assets and liabilities" instead of "wrong answer":
  // the credit side needed a liability, but an asset was placed there.
  // Comparing whole-entry type sets would miss this, because the asset type
  // legitimately appears on the other side of the entry.
  for (const side of ["debit", "credit"] as const) {
    const expectedOnSide = typesOf(
      expectedLines.filter((line) => line.side === side),
      accounts,
    );
    if (expectedOnSide.size === 0) continue;

    const submittedOnSide = typesOf(
      submittedLines.filter((line) => line.side === side),
      accounts,
    );
    const missingOnSide = [...expectedOnSide].filter((type) => !submittedOnSide.has(type));
    const extraOnSide = [...submittedOnSide].filter((type) => !expectedOnSide.has(type));

    for (const extra of extraOnSide) {
      for (const missingType of missingOnSide) {
        if (extra !== missingType) tags.add(confusionTag(extra, missingType));
      }
    }
  }

  // A balanced entry can still be completely wrong. Always surface this lesson
  // when the arithmetic worked but the entry did not, alongside whichever
  // specific confusion caused it.
  if (validation.balanced && !validation.correct) tags.add("balanced-but-wrong");

  // De-duplicate while keeping a stable, meaningful order: confusion and
  // side-rules lessons are more instructive than generic "balance" notes.
  const priority = [
    "asset-liability-confusion",
    "equity-liability-confusion",
    "asset-expense-confusion",
    "expense-liability-confusion",
    "revenue-asset-confusion",
    "equity-revenue-confusion",
    "wrong-increase-side",
    "account-substitution",
    "omitted-line",
    "extra-line",
    "amount-error",
    "unbalanced-entry",
    "balanced-but-wrong",
  ];

  return [...tags].sort((a, b) => {
    const ai = priority.indexOf(a);
    const bi = priority.indexOf(b);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });
}
