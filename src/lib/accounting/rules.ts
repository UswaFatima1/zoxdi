/**
 * Accounting rules, isolated from any animation or UI.
 *
 * Every mechanic — the balance scale, the journal builder, the multiple-choice
 * challenge — asks these functions the same questions, so there is exactly one
 * definition of "which side increases this account".
 */

import type { Account, AccountType, Side } from "./types";

/** The side that *increases* each account type. */
export const NORMAL_BALANCE: Record<AccountType, Side> = {
  asset: "debit",
  expense: "debit",
  liability: "credit",
  equity: "credit",
  revenue: "credit",
};

/** The side that *decreases* each account type. */
export const DECREASE_SIDE: Record<AccountType, Side> = {
  asset: "credit",
  expense: "credit",
  liability: "debit",
  equity: "debit",
  revenue: "debit",
};

export const ACCOUNT_TYPES: AccountType[] = [
  "asset",
  "liability",
  "equity",
  "revenue",
  "expense",
];

export const ACCOUNT_TYPE_LABEL: Record<AccountType, string> = {
  asset: "Asset",
  liability: "Liability",
  equity: "Equity",
  revenue: "Revenue",
  expense: "Expense",
};

/** Plain-language meaning, shown to students before they use the term. */
export const ACCOUNT_TYPE_BLURB: Record<AccountType, string> = {
  asset: "Something the business owns or is owed.",
  liability: "Something the business owes to someone else.",
  equity: "The owner's stake in the business.",
  revenue: "Income earned from selling goods or services.",
  expense: "A cost of running the business.",
};

export function opposite(side: Side): Side {
  return side === "debit" ? "credit" : "debit";
}

/** The normal (increasing) side of a specific account. */
export function normalBalance(account: Account): Side {
  return account.normalBalance ?? NORMAL_BALANCE[account.type];
}

/** The side that increases this account. */
export function increaseSide(account: Account): Side {
  return normalBalance(account);
}

/** The side that decreases this account. */
export function decreaseSide(account: Account): Side {
  return opposite(normalBalance(account));
}

/**
 * Does posting this side to this account increase it?
 * This is the single source of truth behind every "which side?" question.
 */
export function increasesAccount(account: Account, side: Side): boolean {
  return normalBalance(account) === side;
}
