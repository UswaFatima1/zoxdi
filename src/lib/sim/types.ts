/**
 * The live day, modelled as data.
 *
 * Nothing here knows about React or about the chart of accounts. A day is a
 * script of events; a posted day is a list of journal entries. Keeping the two
 * separate is what lets the same day be *rendered* at 60fps and *graded* by a
 * pure function.
 */

import type {
  BalanceSheet,
  IncomeStatement,
  TrialBalance,
} from "@/lib/accounting/statements";
import type { AccountingEquation, JournalEntry, Ledger } from "@/lib/accounting/types";

/** Who walks up to the cart. Kept coarse: it drives copy, colour and later pricing. */
export type CustomerType = "kid" | "worker" | "family" | "regular";

/** Where a day's costs belong in the books. */
export type CostCategory = "ingredients" | "utilities" | "standing";

/**
 * A customer buys juice.
 *
 * Only cash sales are generated in Stage One; `paid` and `credit` exist now so
 * the schema does not have to change when receivables arrive on Day 9.
 */
export interface SaleEvent {
  kind: "sale";
  /** Seconds into the day. */
  at: number;
  customer: CustomerType;
  units: number;
  unitPrice: number;
  paid: "cash" | "credit";
}

/** Money leaves the business to keep it running. */
export interface CostEvent {
  kind: "cost";
  at: number;
  /** Kid-facing label, e.g. "Ice and fruit". */
  label: string;
  category: CostCategory;
  amount: number;
}

export type DayEvent = SaleEvent | CostEvent;

/** A fixed, seeded plan for one day. Same seed, same day, every time. */
export interface DayScript {
  seed: number;
  day: number;
  tierId: string;
  tierLabel: string;
  lengthSeconds: number;
  unitPrice: number;
  /** How many cups the street will buy today, before customers are split out. */
  plannedCups: number;
  events: DayEvent[];
}

/** An event after it has been turned into a journal entry. */
export interface PostedEvent {
  at: number;
  note: string;
  entry: JournalEntry;
}

/** The day's headline numbers, all derived from the ledger. */
export interface DaySummary {
  cupsSold: number;
  customersServed: number;
  revenue: number;
  ingredientCost: number;
  otherCosts: number;
  totalCosts: number;
  netProfit: number;
  cashIn: number;
  cashOut: number;
  closingCash: number;
}

/** Everything the reconcile and close screens need about one finished day. */
export interface DayReport {
  script: DayScript;
  /** Today's entries, in the order they should be replayed. */
  entries: PostedEvent[];
  /** Today only. */
  dayLedger: Ledger;
  /** Everything up to and including today. */
  cumulativeLedger: Ledger;
  dayIncome: IncomeStatement;
  trialBalance: TrialBalance;
  balanceSheet: BalanceSheet;
  equation: AccountingEquation;
  summary: DaySummary;
}
