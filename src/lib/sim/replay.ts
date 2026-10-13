/**
 * Play a day's script through the accounting engine.
 *
 * Every figure below — profit, closing cash, the balance sheet — is *derived*
 * from the ledger rather than tracked alongside it. There is no second source of
 * truth to drift out of sync.
 */

import { ACCOUNTS } from "@/data/accounting/accounts";
import type { Account } from "@/lib/accounting/types";
import type { JournalEntry, Ledger } from "@/lib/accounting/types";
import {
  accountingEquation,
  applyEntry,
  emptyLedger,
  round2,
  signedBalance,
} from "@/lib/accounting/engine";
import { balanceSheet, incomeStatement, trialBalance } from "@/lib/accounting/statements";
import { postEvent } from "./post";
import { generateDay } from "./script";
import type { DayReport, DayScript, DaySummary, PostedEvent } from "./types";
import { tierForDay, STARTING_CAPITAL } from "@/data/campaign/tiers";

/** Day zero: the kid puts their savings into the cart. */
export function openingEntries(capital: number = STARTING_CAPITAL): PostedEvent[] {
  return [
    {
      at: 0,
      note: "You started the cart with your own savings.",
      entry: {
        narration: "Owner's capital",
        lines: [
          { accountId: "cash", side: "debit", amount: capital },
          { accountId: "capital", side: "credit", amount: capital },
        ],
      },
    },
  ];
}

export function openingLedger(capital: number = STARTING_CAPITAL): Ledger {
  return openingEntries(capital).reduce<Ledger>(
    (ledger, posted) => applyEntry(ledger, posted.entry),
    emptyLedger(),
  );
}

function entriesOf(posted: PostedEvent[]): JournalEntry[] {
  return posted.map((item) => item.entry);
}

/** Post one day's events and report what the books now say. */
export function runDay(
  script: DayScript,
  opening: Ledger = openingLedger(),
  accounts: Account[] = ACCOUNTS,
): DayReport {
  const entries = script.events.map(postEvent);

  const dayLedger = entriesOf(entries).reduce<Ledger>(
    (ledger, entry) => applyEntry(ledger, entry),
    emptyLedger(),
  );

  const cumulativeLedger = entriesOf(entries).reduce<Ledger>(
    (ledger, entry) => applyEntry(ledger, entry),
    opening,
  );

  const dayIncome = incomeStatement(accounts, dayLedger);

  let cupsSold = 0;
  let customersServed = 0;
  let ingredientCost = 0;
  let otherCosts = 0;
  let cashIn = 0;
  let cashOut = 0;

  for (const event of script.events) {
    if (event.kind === "sale") {
      cupsSold += event.units;
      customersServed += 1;
      cashIn += event.units * event.unitPrice;
    } else if (event.category === "ingredients") {
      ingredientCost += event.amount;
      cashOut += event.amount;
    } else {
      otherCosts += event.amount;
      cashOut += event.amount;
    }
  }

  const cashAccount = accounts.find((account) => account.id === "cash");
  const closingCash = cashAccount
    ? signedBalance(cashAccount, cumulativeLedger)
    : 0;

  const summary: DaySummary = {
    cupsSold,
    customersServed,
    revenue: round2(dayIncome.totalRevenue),
    ingredientCost: round2(ingredientCost),
    otherCosts: round2(otherCosts),
    totalCosts: round2(dayIncome.totalExpenses),
    netProfit: round2(dayIncome.netProfit),
    cashIn: round2(cashIn),
    cashOut: round2(cashOut),
    closingCash: round2(closingCash),
  };

  return {
    script,
    entries,
    dayLedger,
    cumulativeLedger,
    dayIncome,
    trialBalance: trialBalance(accounts, cumulativeLedger),
    balanceSheet: balanceSheet(accounts, cumulativeLedger),
    equation: accountingEquation(accounts, cumulativeLedger),
    summary,
  };
}

/**
 * Play a run of days back to back, carrying the ledger forward.
 * Used by the tests as the campaign's spine.
 */
export function runCampaign(
  campaignSeed: number,
  days: number[],
  accounts: Account[] = ACCOUNTS,
): { reports: DayReport[]; ledger: Ledger } {
  let ledger = openingLedger();
  const reports: DayReport[] = [];

  for (const day of days) {
    const tier = tierForDay(day);
    if (!tier) continue;
    const script = generateDay(campaignSeed, day, tier);
    const report = runDay(script, ledger, accounts);
    ledger = report.cumulativeLedger;
    reports.push(report);
  }

  return { reports, ledger };
}
