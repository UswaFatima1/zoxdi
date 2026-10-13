import type { EntryLine } from "@/lib/accounting/types";

/** A one-tap starter entry the student can drop into the Lab composer. */
export interface LabQuickEntry {
  id: string;
  label: string;
  narration: string;
  lines: EntryLine[];
}

/**
 * Optional examples the student can drop into the composer to see how a
 * balanced entry is built. They are *not* loaded automatically: the Lab starts
 * empty, and everything on the dashboard comes from entries the student posts.
 */
export const LAB_QUICK_ENTRIES: LabQuickEntry[] = [
  {
    id: "quick-invest",
    label: "Owner invests",
    narration: "Owner put cash into the business",
    lines: [
      { accountId: "cash", side: "debit", amount: 100000 },
      { accountId: "capital", side: "credit", amount: 100000 },
    ],
  },
  {
    id: "quick-cash-sale",
    label: "Cash sale",
    narration: "Sold goods for cash",
    lines: [
      { accountId: "cash", side: "debit", amount: 25000 },
      { accountId: "sales-revenue", side: "credit", amount: 25000 },
    ],
  },
  {
    id: "quick-credit-buy",
    label: "Buy on credit",
    narration: "Bought inventory on credit",
    lines: [
      { accountId: "inventory", side: "debit", amount: 40000 },
      { accountId: "accounts-payable", side: "credit", amount: 40000 },
    ],
  },
  {
    id: "quick-pay-bill",
    label: "Pay a bill",
    narration: "Paid an expense in cash",
    lines: [
      { accountId: "rent-expense", side: "debit", amount: 5000 },
      { accountId: "cash", side: "credit", amount: 5000 },
    ],
  },
];
