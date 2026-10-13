/**
 * From a day of events to the handful of entries a student should build.
 *
 * The live day wants to feel busy; the reconcile wants to be finishable. Those
 * pull in opposite directions, and the answer is the one real bookkeepers use:
 * **a day's takings are one entry, not forty.** Customers are the texture of the
 * day; the ledger records the day's totals.
 */

import type { EntryLine } from "@/lib/accounting/types";
import { COST_ACCOUNT } from "./post";
import type { CostCategory, CostEvent, DayScript, SaleEvent } from "./types";

const COST_ORDER: CostCategory[] = ["ingredients", "utilities", "standing"];

export interface ReconcileTask {
  id: string;
  /** Where it belongs in the day's timeline. */
  at: number;
  /** Kid-facing: what happened. */
  label: string;
  /** Supporting detail, e.g. the cup count. */
  detail: string;
  /** The money involved, unformatted so the UI owns the currency. */
  amount: number;
  /** The entry the student must build. */
  expected: EntryLine[];
}

/** Collapse a day's event stream into the entries the books actually need. */
export function buildReconcile(script: DayScript): ReconcileTask[] {
  const tasks: ReconcileTask[] = [];

  const sales = script.events.filter((event): event is SaleEvent => event.kind === "sale");
  if (sales.length > 0) {
    const cups = sales.reduce((total, event) => total + event.units, 0);
    const revenue = sales.reduce((total, event) => total + event.units * event.unitPrice, 0);
    tasks.push({
      id: "sales",
      at: sales[0].at,
      label: "Today's juice sales",
      detail: `${cups} cups at ${sales[0].unitPrice} popo each`,
      amount: revenue,
      expected: [
        { accountId: "cash", side: "debit", amount: revenue },
        { accountId: "sales-revenue", side: "credit", amount: revenue },
      ],
    });
  }

  for (const category of COST_ORDER) {
    const matched = script.events.filter(
      (event): event is CostEvent => event.kind === "cost" && event.category === category,
    );
    if (matched.length === 0) continue;
    const amount = matched.reduce((total, event) => total + event.amount, 0);
    tasks.push({
      id: `cost-${category}`,
      at: matched[0].at,
      label: matched[0].label,
      detail: "paid from the till",
      amount,
      expected: [
        { accountId: COST_ACCOUNT[category], side: "debit", amount },
        { accountId: "cash", side: "credit", amount },
      ],
    });
  }

  return tasks.sort((a, b) => a.at - b.at);
}
