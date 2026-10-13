import { describe, expect, it } from "vitest";

import { ACCOUNTS } from "@/data/accounting/accounts";
import {
  STAGE_ONE_DAYS,
  STARTING_CAPITAL,
  TIER_0,
  TIER_1,
  tierForDay,
} from "@/data/campaign/tiers";
import { applyEntry, emptyLedger, entryTotals } from "@/lib/accounting/engine";
import {
  buildReconcile,
  cupsSoldAt,
  daySeed,
  generateDay,
  runCampaign,
  runDay,
} from "@/lib/sim";

const SEED = 20261012;

describe("the live day is deterministic", () => {
  it("plays exactly the same day from the same seed", () => {
    expect(generateDay(SEED, 3, TIER_0)).toEqual(generateDay(SEED, 3, TIER_0));
    expect(daySeed(SEED, 3)).toBe(daySeed(SEED, 3));
  });

  it("plays a different day for a different seed or day number", () => {
    const base = generateDay(SEED, 3, TIER_0);
    expect(generateDay(SEED + 1, 3, TIER_0)).not.toEqual(base);
    expect(generateDay(SEED, 4, TIER_0)).not.toEqual(base);
  });

  it("keeps every event inside the day", () => {
    const script = generateDay(SEED, 4, TIER_1);
    for (const event of script.events) {
      expect(event.at).toBeGreaterThanOrEqual(0);
      expect(event.at).toBeLessThanOrEqual(script.lengthSeconds);
    }
  });

  it("orders the day chronologically", () => {
    const times = generateDay(SEED, 4, TIER_1).events.map((event) => event.at);
    expect(times).toEqual([...times].sort((a, b) => a - b));
  });

  it("gives every day of a tier its own character", () => {
    // Word of mouth means the street is not the same every day, even at one price.
    const takings = TIER_0.days.map((day) =>
      generateDay(SEED, day, TIER_0).events.reduce(
        (total, event) => total + (event.kind === "sale" ? event.units * event.unitPrice : 0),
        0,
      ),
    );
    expect(new Set(takings).size).toBeGreaterThan(1);
  });
});

describe("the reconcile step asks for the right entries", () => {
  it("asks a beginner for exactly one entry", () => {
    const tasks = buildReconcile(generateDay(SEED, 1, TIER_0));
    expect(tasks).toHaveLength(1);
    expect(tasks[0].id).toBe("sales");
  });

  it("asks for the sales entry plus one entry per bill", () => {
    const tasks = buildReconcile(generateDay(SEED, 5, TIER_1));
    // The supply run happens before the first customer, so it is entered first.
    expect([...tasks].map((task) => task.id).sort()).toEqual([
      "cost-ingredients",
      "cost-standing",
      "cost-utilities",
      "sales",
    ]);
    const times = tasks.map((task) => task.at);
    expect(times).toEqual([...times].sort((a, b) => a - b));
  });

  it("only ever asks for balanced entries", () => {
    for (const day of STAGE_ONE_DAYS) {
      const tier = tierForDay(day);
      if (!tier) continue;
      for (const task of buildReconcile(generateDay(SEED, day, tier))) {
        expect(task.amount).toBeGreaterThan(0);
        expect(entryTotals(task.expected).balanced).toBe(true);
      }
    }
  });

  it("rebuilds exactly the books the day produced", () => {
    // The whole architecture in one assertion: aggregating the day by hand gives
    // the same ledger as posting every single customer.
    for (const day of STAGE_ONE_DAYS) {
      const tier = tierForDay(day);
      if (!tier) continue;
      const script = generateDay(SEED, day, tier);

      const rebuilt = buildReconcile(script).reduce(
        (ledger, task) => applyEntry(ledger, task.expected),
        emptyLedger(),
      );

      expect(rebuilt).toEqual(runDay(script, emptyLedger()).dayLedger);
    }
  });
});

describe("what a day contains", () => {
  it("starts with nothing but sales", () => {
    const script = generateDay(SEED, 1, TIER_0);
    expect(script.events.length).toBeGreaterThan(0);
    expect(script.events.every((event) => event.kind === "sale")).toBe(true);
  });

  it("adds costs once the bills start", () => {
    const script = generateDay(SEED, 5, TIER_1);
    const costs = script.events.filter((event) => event.kind === "cost");
    const categories = new Set(costs.map((event) => event.category));
    expect(categories).toEqual(new Set(["ingredients", "utilities", "standing"]));
  });

  it("scales ingredient cost with cups made, but not the fixed bills", () => {
    const script = generateDay(SEED, 5, TIER_1);
    const cups = script.events
      .filter((event) => event.kind === "sale")
      .reduce((total, event) => total + event.units, 0);

    const costOf = (category: string) =>
      script.events.find((event) => event.kind === "cost" && event.category === category);

    // Ingredients track volume; the electricity bill and pitch fee do not.
    expect(costOf("ingredients")).toMatchObject({ amount: 3 * cups });
    expect(costOf("utilities")).toMatchObject({ amount: 12 });
    expect(costOf("standing")).toMatchObject({ amount: 8 });
  });

  it("serves exactly as many cups as the demand curve predicts", () => {
    const script = generateDay(SEED, 4, TIER_1);
    const served = script.events
      .filter((event) => event.kind === "sale")
      .reduce((total, event) => total + event.units, 0);

    expect(served).toBe(script.plannedCups);
  });
});

describe("the demand curve is a real demand curve", () => {
  const base = {
    referencePrice: 10,
    footTraffic: 24,
    elasticity: 1.4,
    capacity: 1000,
  };

  it("sells fewer cups as the price rises", () => {
    const at = (price: number) => cupsSoldAt({ ...base, unitPrice: price });
    expect(at(8)).toBeGreaterThan(at(10));
    expect(at(10)).toBeGreaterThan(at(12));
    expect(at(12)).toBeGreaterThan(at(16));
  });

  it("never sells below zero or above capacity", () => {
    expect(cupsSoldAt({ ...base, unitPrice: 100000, capacity: 40 })).toBe(0);
    expect(cupsSoldAt({ ...base, unitPrice: 1, capacity: 40 })).toBe(40);
  });
});

describe("Stage One keeps honest books", () => {
  const { reports, ledger } = runCampaign(SEED, STAGE_ONE_DAYS);

  it("plays every day of the stage", () => {
    expect(reports).toHaveLength(STAGE_ONE_DAYS.length);
    expect(STAGE_ONE_DAYS.every((day) => tierForDay(day) !== null)).toBe(true);
  });

  it("balances the trial balance at the end of every single day", () => {
    for (const report of reports) {
      expect(report.trialBalance.balanced).toBe(true);
      expect(report.equation.balanced).toBe(true);
      expect(report.equation.identityHolds).toBe(true);
      expect(report.balanceSheet.balanced).toBe(true);
    }
  });

  it("only ever posts accounts that exist in the chart of accounts", () => {
    const known = new Set(ACCOUNTS.map((account) => account.id));
    for (const report of reports) {
      for (const posted of report.entries) {
        for (const line of posted.entry.lines) {
          expect(line.amount).toBeGreaterThan(0);
          expect(known.has(line.accountId)).toBe(true);
        }
      }
    }
  });

  it("reports profit as revenue minus the day's costs", () => {
    for (const report of reports) {
      const { revenue, totalCosts, netProfit } = report.summary;
      expect(netProfit).toBeCloseTo(revenue - totalCosts, 6);
      expect(totalCosts).toBeCloseTo(
        report.summary.ingredientCost + report.summary.otherCosts,
        6,
      );
    }
  });

  it("shows the cash in the till growing by exactly the profit it earned", () => {
    // True only while every sale is a cash sale: the moment credit arrives,
    // profit and cash part company — which is the whole lesson of Act 2.
    const earned = reports.reduce((total, report) => total + report.summary.netProfit, 0);
    const last = reports[reports.length - 1];
    expect(last.summary.closingCash).toBeCloseTo(STARTING_CAPITAL + earned, 6);
  });

  it("carries the profit into the balance sheet's equity", () => {
    const last = reports[reports.length - 1];
    const earned = reports.reduce((total, report) => total + report.summary.netProfit, 0);
    expect(last.balanceSheet.netProfit).toBeCloseTo(earned, 6);
    expect(last.balanceSheet.contributedEquity).toBeCloseTo(STARTING_CAPITAL, 6);
  });

  it("replays identically for the same campaign seed", () => {
    const again = runCampaign(SEED, STAGE_ONE_DAYS);
    expect(again.ledger).toEqual(ledger);
  });
});
