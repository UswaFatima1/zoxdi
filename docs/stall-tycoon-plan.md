# Stall Tycoon: The Ledger Weapon — Build Plan (v2)

> An international, kid-friendly accounting simulator. You **run a real day of
> business in real time**, then **reconstruct that day in the books** by hand.
> Planning document only — nothing here is built yet.
>
> v2 supersedes v1: the loop is reordered. The live day comes *first*, and the
> accounting is the *reconciliation* that follows it.

---

## 1. The core loop (three beats, every day)

```
[1] THE LIVE DAY            [2] THE RECONCILE              [3] THE CLOSE
    real time, 3-5 min          drag & drop, 2-4 min           instants
    customers arrive,           the day's events come back      ledger -> trial
    sales happen, bills         as blocks; you rebuild the      balance -> income
    land. A HUD shows the       entry, post to the ledger,      statement -> balance
    accounting impact of        then to the trial balance.      sheet. Day score.
    every event as it occurs.
```

The order is the pedagogy. The student **sees** the real-world event with its
accounting shadow, then has to **reproduce it deliberately** minutes later. That
is the difference between recognising an entry and being able to write one.

The economy and the books stay one system: the live day emits an **event log**,
and that same event log is the source of the blocks in the reconcile step. The
answer to the puzzle is always exactly what happened today — never a mystery
number invented by the level designer.

---

## 2. What the live day looks like

A single scene (the stall), a clock, and a stream of events.

| On screen | What it shows |
| --- | --- |
| The day clock | a compressed day (morning → evening) in 3-5 minutes |
| Customers | they walk up, order, pay. Foot traffic rises and falls |
| The rival | the ice-cream truck / mega-mart bar across the street, reacting to your price |
| **The Impact HUD** | every event spawns a small card: *"Sale · +$12.00 · Dr Cash / Cr Sales · assets up, equity up"* |
| The live metrics strip | cash in the till, cups sold, stock left, profit-so-far, market share vs the rival |

### The fading scaffold — the actual learning mechanism

The HUD is deliberately generous at first and then **takes itself away**:

| Stage | What the HUD reveals about each event |
| --- | --- |
| Days 1-8 | the full entry: both sides, both accounts, the effect on the equation |
| Days 9-16 | the accounts affected, but you must pick the side |
| Days 17-30 | only *what happened* ("a sale", "the electric bill") — no accounting |
| Days 31-60 | only the raw event — you must also spot which events are even transactions |

This is the single most important design lever in the game. Fading support, not
adding difficulty, is what turns watching into knowing.

### Render real time, compute deterministically

The day is a **seeded event script** played back on a tick loop:

```ts
interface DayScript {
  seed: number;
  events: DayEvent[];   // fixed schedule: time, customer, units, price, terms
}
type DayEvent =
  | { t: number; kind: "sale";     customer: CustomerType; units: number; price: number; paid: "cash" | "credit" }
  | { t: number; kind: "purchase"; item: "fruit" | "ice" | "cups"; units: number; cost: number; paid: "cash" | "credit" }
  | { t: number; kind: "bill";     bill: "electricity" | "rent" | "wages"; amount: number }
  | { t: number; kind: "waste";    units: number; reason: "spoilage" | "spill" }
  | { t: number; kind: "event";    what: "monsoon" | "festival" | "breakdown" };
```

Real-time rendering means it feels alive. A fixed script means the day is
**replayable, testable and fair** — the same seed always produces the same day,
so the reconcile phase always has exactly one correct answer set.

---

## 3. The reconcile step (where accounting actually happens)

Three drag-and-drop stages, introduced one at a time over the first two weeks:

1. **Journal** — drag transaction blocks onto Dr and Cr sides of the balance
   scale. This is the existing Balance Forge, fed by today's events.
2. **Ledger** — drag each entry into the right T-account and watch the columns
   fill. Introduced around Day 9.
3. **Trial balance** — drag each account's balance into the debit or credit
   column, then check it balances. Introduced around Day 17.

Then **The Close** runs the existing statement functions over the day's ledger:
trial balance → income statement → balance sheet (→ cash flow statement from
Day 17 onward), ending on the score, the market-share bar and the rival's
reaction.

**The day log is the memory aid.** A scrollable "receipts / camera log" timeline
of the day sits beside the puzzle, exactly as a real owner would use receipts.
Consulting it is legitimate but costs accuracy points, which teaches the same
lesson a real shopkeeper learns: *write it down when it happens.*

Wrong placements route into the misconception engine that already exists
(`src/lib/learning/misconceptions.ts`), so a mistake produces "you treated a
payment as a sale" rather than a red X.

---

## 4. The complexity ladder (this matters more than the 60-day map)

Difficulty ramps along four axes at once: **events per day**, **new concepts**,
**scaffold removed**, and **day length**.

| Tier | Days | The live day | Blocks/day | New accounting | New economics |
| --- | --- | --- | --- | --- | --- |
| 0 · Just sell | 1-3 | 4-6 walk-up cash sales, nothing else | 3-5 | a sale is `Dr Cash / Cr Sales` | price vs quantity |
| 1 · The bills | 4-8 | + cash costs (fruit, ice, electricity) | 6-10 | expenses cut profit; expense vs asset | cost per cup, margin |
| 2 · Pay me later | 9-16 | + credit sales, credit purchases, settling up | 10-14 | accrual vs cash, receivables, payables, *a payment is not a sale* | the cash conversion cycle |
| 3 · What did those cups cost? | 17-26 | + inventory buying, spoilage, waste | 12-18 | inventory as an asset, COGS, FIFO vs weighted average | bulk buying, holding cost |
| 4 · Things that last | 27-38 | + equipment, monthly bills, wages owed | 15-20 | capital vs revenue spend, depreciation, prepayments, accruals, matching | fixed vs variable cost, break-even |
| 5 · More than one stall | 39-52 | + a second and third stall, staff, tax | 20-25 | overhead allocation, bad debts, sales tax | economies of scale, game theory vs the rival |
| 6 · The franchise | 53-60 | network, suppliers, financing, the market war | 25+ | financing, full-cycle close, cash-flow discipline | capital structure, market share war |

Showcase days (15, 30, 45) are the audits: the day is paused, a month of
scrambled blocks is dumped in front of the student, and they must balance the
trial balance. Day 60 is the finale simulation, scoring every choice made across
the campaign into two or three endings.

### The Act-2 trap worth building everything around

Around Days 20-30, let a student run a profitable month and still fail — because
customers paid on credit and the electricity bill was due in cash. Show the
income statement in the black next to an empty till. Then: *"Profit is an
opinion. Cash is a fact."* That is the best lesson in this whole design, and it
is only possible because the live day and the books are the same system.

---

## 5. What already exists in `E:\zoxdi` (reuse, don't rebuild)

| Need | Already built | Where |
| --- | --- | --- |
| Debit/credit engine that cannot lie | journal, ledger, T-accounts, equation, trial balance, income statement, balance sheet | `src/lib/accounting/` |
| Drag-onto-a-scale mechanic | live balance scale + account cards + pointer/tap drag | `components/game/BalanceScale.tsx`, `ForgeBuilder.tsx`, `AccountCard.tsx` |
| Levels as data, not code | 7 level modes, typed content schema, validated by tests | `src/data/accounting/types.ts`, `levels.ts` |
| Mistakes become lessons | misconception detection + mastery estimation | `src/lib/learning/` |
| Progress, XP, badges, streaks | all built, offline-first, versioned | `src/lib/storage/`, `lib/learning/xp.ts` |
| Timed practice | 60-second Speed Round, Daily Challenge | `components/practice/` |
| Statements UI | trial balance / income / balance panels | `components/lab/StatementPanels.tsx` |
| Dark theme, sound, confetti, reduced-motion | built | `components/fx/`, `lib/fx/sound.ts` |
| i18n scaffold (currently en + ur) | key-based strings, RTL support | `src/lib/i18n.ts` |

**Build Stall Tycoon as a campaign layer inside Zoxdi.** The engine, the scale,
the learning brain, the statements panels and the storage layer are directly
reusable; only the live day is genuinely new.

---

## 6. What to build

```
src/
|-- lib/
|   |-- sim/                      <- NEW: the live day (pure logic, no React)
|   |   |-- script.ts             seeded day-script generator per tier
|   |   |-- demand.ts             customer arrival + price elasticity (segments)
|   |   |-- rival.ts              competitor AI state machine
|   |   |-- economy.ts            inventory lots, spoilage, capacity
|   |   `-- replay.ts             script -> event log -> expected entries
|   |-- reconcile/                <- NEW: the drag-and-drop answer engine
|   |   |-- blocks.ts             event -> draggable transaction blocks
|   |   `-- grade.ts              journal / ledger / trial grading + misconceptions
|   `-- campaign/
|       |-- state.ts              day, tier, forks taken, endings, seed
|       `-- ledger-tasks.ts       which reconcile stages are unlocked, and when
|-- lib/accounting/
|   `-- statements.ts             EXTEND: add cashFlowStatement()
|-- data/campaign/
|   |-- tiers.ts                  the ladder from section 4
|   |-- days.ts                   60 day definitions (scenario + script params)
|   `-- forks.ts                  strategic decisions at 15 / 30 / 45 / 60
`-- components/campaign/
    |-- CampaignMap.tsx           the road, 60 stops
    |-- live/                     the real-time day: scene, clock, Impact HUD, till
    |-- reconcile/                the three drag-and-drop stages + the day log
    |-- close/                    statements + rival comparison + day score
    `-- scene/                    the cinematic backdrop
```

New routes: `/campaign`, `/campaign/[day]` (live → reconcile → close),
`/campaign/end`. Existing `/learn`, `/lab`, `/daily`, `/speed`, `/progress`
become the "study" and "drill" wings and keep working untouched.

New dependencies: **`framer-motion`** only (spring-animated blocks, layout
transitions, respects reduced motion). The day ticker is a `requestAnimationFrame`
loop — no game engine needed.

### Missing engine pieces

1. **`cashFlowStatement()`** — not present today; required for the Act-2 trap.
2. **Inventory valuation** — FIFO and weighted average over real lots, plus
   spoilage entries.
3. **Depreciation** — straight-line with accumulated depreciation as a
   contra-asset.
4. **Receivables aging** — who owes what, and when it becomes overdue.
5. **Demand model** — two customer segments with different price sensitivity,
   clamped by stall capacity.
6. **Rival AI** — a small rule-based state machine that escalates by tier.

---

## 7. Kid-first design rules

1. **No jargon before the experience.** "Debit" appears the first time the HUD
   shows a debit, not before.
2. **Big numbers, icons, colour, sound.** Money is a font that carries meaning;
   the existing `font-mono tabular-nums` money style already helps.
3. **The pause button is sacred.** A real-time game for children must always be
   pausable, and reduced-motion must remain a first-class path.
4. **Failures are meetings, not verdicts.** Every wrong block explains itself.
5. **The currency is abstract.** A neutral formatter (`$` default, one-line swap)
   keeps this international; amounts are small and readable at every tier.
6. **One day is one sitting.** 6-9 minutes end to end, resumable mid-day.

---

## 8. Tests that make this trustworthy

Vitest is already wired. The invariants that matter:

- after any day, debits equal credits and `Assets == Liabilities + Equity`;
- the cash-flow statement reconciles to the actual movement of cash;
- the same seed always produces the same day script, event log and answer set;
- the reconcile grader accepts exactly the entries the replay produced;
- demand falls as price rises; a credit-only day can still be profitable and
  insolvent (the Act-2 trap is provably reachable, not scripted theatre);
- every day definition and tier is content-valid, like `tests/content.test.ts`.

---

## 9. Build order

**M0 — Proof spike (2-3 days).** A seeded `DayScript` for Tier 0, replayed to an
event log, converted to journal entries and posted through the existing engine.
Done when a debug page runs three days whose ledgers balance every day and whose
income statement moves. *No art, no UI.*

**M1 — The three beats (1-2 weeks).** `/campaign`, the live scene with the
Impact HUD, the reconcile drag-and-drop, the close, and campaign persistence.
Done when Days 1-8 are playable end to end and a reload resumes.

**M2 — Accruals and the first audit (1-2 weeks).** Credit sales and purchases,
the ledger and trial-balance stages, fading HUD, and Day 15: the scrambled-block
month-end audit plus the first strategic fork.

**M3 — Cost and cash (2 weeks).** Inventory, COGS, spoilage, wages, prepayments,
depreciation, `cashFlowStatement()`, the rival's predatory pricing — and the
Act-2 trap plus the Day 30 full-statement audit.

**M4 — Acts 3-4 content (2-3 weeks).** Frozen engine; templated day authoring
across tiers 5 and 6, the last two forks.

**M5 — Finale and scenes (1-2 weeks).** Day 60 simulation, the endings, and the
cinematic backdrops (start with 2D layered parallax; upgrade only the finale
scene to 3D later if it earns it).

**M6 — Playtest (ongoing).** Tuning the real-time pacing and the point at which
the HUD steps back. Watch children play before trusting any number in this plan.

---

## 10. Decisions I need before M0

1. **How interactive is the live day?** Fully automatic (you set the price
   beforehand and watch) / light interaction (you serve customers by tapping) /
   active management (reroute stock, handle a breakdown mid-day). *This is the
   biggest scope lever in the project.*
2. **Target age band** — 11-14 or 15-18? It sets vocabulary, day length and how
   fast the HUD fades.
3. **Visual target** — 2D cinematic parallax (recommended) or real 3D?
4. **Currency and languages** — one neutral currency, and which locale set
   (English + Spanish + Arabic + Hindi/Urdu)?
5. **Online at all?** Solo/offline (recommended) or accounts plus a shared
   leaderboard?
