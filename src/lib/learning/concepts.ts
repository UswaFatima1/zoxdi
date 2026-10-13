/**
 * The concepts Zoxdi measures. Mastery is tracked per concept, never per
 * chapter or per session, so a student who is fluent at journal entries but
 * shaky on classification gets a profile that says exactly that.
 */

export type ConceptId =
  | "accounting-equation"
  | "account-classification"
  | "debit-credit-rules"
  | "double-entry"
  | "journal-entries"
  | "ledger-posting"
  | "trial-balance"
  | "financial-statements";

export interface Concept {
  id: ConceptId;
  name: string;
  /** One-line description of the skill, in student-facing language. */
  summary: string;
  /** The chapter that primarily develops this concept. */
  chapterId: string;
}

export const CONCEPTS: Record<ConceptId, Concept> = {
  "accounting-equation": {
    id: "accounting-equation",
    name: "Accounting equation",
    summary: "Seeing every transaction as a change in what the business owns, owes and is worth.",
    chapterId: "ch1",
  },
  "account-classification": {
    id: "account-classification",
    name: "Account classification",
    summary: "Telling assets from liabilities, equity, revenue and expenses.",
    chapterId: "ch1",
  },
  "debit-credit-rules": {
    id: "debit-credit-rules",
    name: "Debit and credit rules",
    summary: "Knowing which side increases and which side decreases each account type.",
    chapterId: "ch2",
  },
  "double-entry": {
    id: "double-entry",
    name: "Double entry",
    summary: "Every transaction changes at least two accounts and always balances.",
    chapterId: "ch2",
  },
  "journal-entries": {
    id: "journal-entries",
    name: "Journal entries",
    summary: "Recording a transaction as a dated, narratable entry in the journal.",
    chapterId: "ch2",
  },
  "ledger-posting": {
    id: "ledger-posting",
    name: "Ledger posting",
    summary: "Moving journal lines into accounts and keeping running balances.",
    chapterId: "ch3",
  },
  "trial-balance": {
    id: "trial-balance",
    name: "Trial balance",
    summary: "Summarising balances and knowing what a trial balance can and cannot catch.",
    chapterId: "ch4",
  },
  "financial-statements": {
    id: "financial-statements",
    name: "Financial statements",
    summary: "Sorting balances into the income statement and the balance sheet.",
    chapterId: "ch5",
  },
};

export const CONCEPT_ORDER: ConceptId[] = [
  "accounting-equation",
  "account-classification",
  "debit-credit-rules",
  "double-entry",
  "journal-entries",
  "ledger-posting",
  "trial-balance",
  "financial-statements",
];

export function conceptName(id: ConceptId): string {
  return CONCEPTS[id]?.name ?? id;
}
