/**
 * The bridge: every event in the world becomes a real journal entry.
 *
 * This is the file that keeps the game honest. The economy does not "show" a
 * number and separately "ask" for an entry — the event is posted straight into
 * the same engine the study levels use, so the books can never disagree with
 * what the kid just watched happen.
 */

import type { CostCategory, DayEvent, PostedEvent } from "./types";
import { round2 } from "@/lib/accounting/engine";

/** Which account each kind of daily cost belongs in. */
export const COST_ACCOUNT: Record<CostCategory, string> = {
  ingredients: "cost-of-goods-sold",
  utilities: "utilities-expense",
  standing: "rent-expense",
};

const CUSTOMER_LABEL: Record<string, string> = {
  kid: "A kid",
  worker: "A worker on a break",
  family: "A family",
  regular: "A regular",
};

/** Turn one thing that happened into one journal entry, plus the words for it. */
export function postEvent(event: DayEvent): PostedEvent {
  if (event.kind === "sale") {
    const amount = round2(event.units * event.unitPrice);
    const who = CUSTOMER_LABEL[event.customer] ?? "A customer";
    const cups = event.units === 1 ? "1 cup" : `${event.units} cups`;
    return {
      at: event.at,
      note: `${who} bought ${cups} for ${amount}.`,
      entry: {
        narration: `Juice sale, ${cups}`,
        lines: [
          { accountId: "cash", side: "debit", amount },
          { accountId: "sales-revenue", side: "credit", amount },
        ],
      },
    };
  }

  const amount = round2(event.amount);
  return {
    at: event.at,
    note: `${event.label} cost ${amount}.`,
    entry: {
      narration: event.label,
      lines: [
        { accountId: COST_ACCOUNT[event.category], side: "debit", amount },
        { accountId: "cash", side: "credit", amount },
      ],
    },
  };
}
