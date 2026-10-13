/**
 * Core accounting domain types.
 *
 * These types are deliberately free of any UI or content concerns so the same
 * engine can validate a drag-and-drop journal builder, a multiple-choice
 * question, or a timed exam challenge.
 */

/** The five elements of the accounting equation. */
export type AccountType =
  | "asset"
  | "liability"
  | "equity"
  | "revenue"
  | "expense";

/** The two sides of every account. */
export type Side = "debit" | "credit";

export interface Account {
  id: string;
  /** English display name. */
  name: string;
  /** Optional translated display name, so the UI can localise later. */
  nameUr?: string;
  type: AccountType;
  /** Short, plain-language explanation shown before the term is used. */
  description: string;
  /**
   * Overrides the normal balance implied by `type`. Used only for contra
   * accounts such as Drawings, which reduces equity and therefore has a
   * debit normal balance.
   */
  normalBalance?: Side;
}

/** A single line of a journal entry: an account, a side and an amount. */
export interface EntryLine {
  accountId: string;
  side: Side;
  amount: number;
}

/** A complete journal entry. */
export interface JournalEntry {
  lines: EntryLine[];
  narration?: string;
}

/** Running totals for a single account in a ledger. */
export interface AccountBalance {
  accountId: string;
  debits: number;
  credits: number;
}

/** A ledger keyed by account id. */
export type Ledger = Record<string, AccountBalance>;

/** Snapshot of the accounting equation, used to teach cause and effect. */
export interface AccountingEquation {
  assets: number;
  liabilities: number;
  /** Net equity: capital + revenue - expenses - drawings. */
  equity: number;
  capital: number;
  revenue: number;
  expenses: number;
  drawings: number;
  totalDebits: number;
  totalCredits: number;
  /** True when total debits equal total credits. */
  balanced: boolean;
  /** True when Assets === Liabilities + Equity. */
  identityHolds: boolean;
}
