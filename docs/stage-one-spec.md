# Stage One — Build Specification

> Days 1 to 8 of Stall Tycoon: The Ledger Weapon. The foundation is **built and
> tested**; the live-day UI is next. This document is the contract for the rest
> of Stage One.

---

## 1. Locked decisions

| Decision | Choice |
| --- | --- |
| Audience | 15-25, international, no exam board behind it |
| Look | 2D, vibrant and friendly, Monkey-Mart energy: warm yellows, chunky shapes, thick outlines |
| Currency | the **popo** (`Ⓟ`), fictional on purpose |
| Play | solo, offline-first, **fully interactive** during the live day |
| Interaction | real time: the day plays out live, you act, then you do the books |
| Online | deferred, but designed for — see section 10 |
| Engine | reuses the existing Zoxdi accounting engine; the world posts real journal entries |

### The currency

`src/lib/currency.ts` — glyph `Ⓟ` (U+24C5, renders everywhere without a custom
font), name "popo", `formatPopo()` for display. Amounts are small whole numbers
so a 15-year-old reads a balance sheet at a glance.

### The palette

Add as Tailwind theme extensions. **The existing dark tokens stay untouched** —
the study wings (`/learn`, `/lab`, `/daily`, `/speed`) keep their current look,
and the bright world belongs to `/campaign`.

| Token | Value | Use |
| --- | --- | --- |
| `world-cream` | `#FFF8E7` | scene backgrounds, panels |
| `popo-yellow` | `#FFD54A` | the primary accent, the cart, buttons |
| `popo-amber` | `#F5A623` | highlights, hover, the sun |
| `world-ink` | `#3A3327` | text — warm brown, never pure black |
| `world-sky` | `#7ED4F5` | sky, day clock |
| `world-leaf` | `#7CD97C` | successful entries, confirmations |
| `world-money` | `#34C77B` | profit, cash up |
| `world-cost` | `#FF6B6B` | costs, cash down, mistakes |
| `world-rival` | `#8C7AE6` | everything belonging to the competitor |

Rules: 3-4px rounded outlines, 16-24px corner radii, soft shadows, spring
animation (never linear), numerals in the existing tabular monospace so money
reads like money. `prefers-reduced-motion` removes springs but not progress.

---

## 2. Scope of Stage One

Eight days, two tiers, one new idea at a time.

| Days | Tier | What is new | Entries to build |
| --- | --- | --- | --- |
| 1-3 | **Just Sell** | somebody buys juice; that is the whole day | 1 |
| 4-8 | **The Bills** | the cart costs money to keep open | 4 |

Everything after Day 8 — credit sales, inventory, depreciation, the month-end
audit — is explicitly out of scope here.

---

## 3. The live day

One scene, one clock, a stream of small events.

**On screen:** a side-on street. The cart on the left, the rival's truck parked
across the road, customers walking in from the right. A sun arc tracks the day.

**The metrics strip:** popos in the till · cups sold · profit so far · market
share against the rival.

**What the player does:**
- sets the price on the chalkboard **before** the day starts;
- **serves customers by tapping them** as they arrive;
- can pause at any moment (a real-time game for 15-year-olds must always be
  pausable), and can fast-forward.

**Pacing kernels:** 240s (Days 1-3), 300s (Days 4-8), with 13-27 events per day
— roughly one moment every 11-18 seconds.

### The Impact HUD — the fading scaffold

Every event spawns a card showing what just happened financially. The card is
generous at first and then takes itself away. This is the mechanism that turns
watching into knowing.

| Days | The card shows |
| --- | --- |
| 1-8 | the full entry: both accounts, both sides, and the effect on the equation |
| 9-16 | the accounts affected, but the student picks the side |
| 17-30 | only what happened — no accounting at all |
| 31+ | only the raw event; the student also spots which events are transactions |

Stage One never leaves the top row. `TierConfig.scaffold` is already the switch
that will drive this.

---

## 4. The reconcile step

After the day ends, the student reopens it as a puzzle.

**Stage One uses one of the three stages:**
1. **Journal** — drag blocks onto the Dr/Cr scale *(active now)*
2. **Ledger** — drag entries into T-accounts *(unlocks Day 9)*
3. **Trial balance** — place balances into columns *(unlocks Day 17)*

**The day is aggregated, not itemised.** This is the design decision that makes
the whole thing finishable: a busy day of 27 events becomes **4 blocks**, because
that is how real bookkeeping works — a day's takings are one entry.

Day 1-3 blocks: `Today's juice sales`.
Day 4-8 blocks: `Ice and fruit` · `Today's juice sales` · `The electricity bill` · `The pitch fee`.

**The day log** sits beside the puzzle as a scrollable timeline of what happened.
Using it is legitimate and costs accuracy — the same lesson a real shopkeeper
learns: write it down when it happens.

**Wrong placements are diagnosed, not just marked wrong.** Grading routes into
`src/lib/learning/misconceptions.ts`, so the feedback says *"you treated a cost
as if it were cash coming in"*, not a red X, and the concept is recorded for the
Mastery Passport.

---

## 5. The close

The day's ledger already exists by the time the student finishes reconciling —
they built it. The close renders it:

- **Income statement** for the day: sales, then the costs, then profit.
- **Balance sheet** as of tonight: the till, and the owner's stake.
- **Trial balance** check: debits equal credits.
- **Score:** accuracy, hints, speed → XP and mastery through the existing
  `lib/learning` and `lib/storage` systems.

---

## 6. What is built

`npm.cmd run typecheck` clean · `npm.cmd test` **131 passing** (17 new for the sim).

| File | What it does |
| --- | --- |
| `src/lib/currency.ts` | the popo and its formatting |
| `src/lib/sim/types.ts` | world events, day script, day report |
| `src/lib/sim/rng.ts` | seeded randomness — never `Math.random()` |
| `src/lib/sim/demand.ts` | the price/volume curve, the whole economics engine |
| `src/lib/sim/script.ts` | seed + tier → one day on the street |
| `src/lib/sim/post.ts` | **event → journal entry**, the bridge to the real engine |
| `src/lib/sim/reconcile.ts` | a day's events → the 1-4 blocks a student builds |
| `src/lib/sim/replay.ts` | play a day through the ledger and report the statements |
| `src/data/campaign/tiers.ts` | Tier 0 and Tier 1 definitions |
| `tests/sim.test.ts` | 17 tests holding the invariants below |

### Verified behaviour (a real walkthrough, seed 20261012)

| Day | Tier | Events | Cups | Sales | Costs | Profit | Till |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Just Sell | 15 | 24 | Ⓟ240 | — | Ⓟ240 | Ⓟ740 |
| 2 | Just Sell | 16 | 24 | Ⓟ240 | — | Ⓟ240 | Ⓟ980 |
| 3 | Just Sell | 13 | 20 | Ⓟ200 | — | Ⓟ200 | Ⓟ1,180 |
| 4 | The Bills | 22 | 25 | Ⓟ250 | Ⓟ95 | Ⓟ155 | Ⓟ1,335 |
| 5 | The Bills | 27 | 33 | Ⓟ330 | Ⓟ119 | Ⓟ211 | Ⓟ1,546 |
| 6 | The Bills | 26 | 29 | Ⓟ290 | Ⓟ107 | Ⓟ183 | Ⓟ1,729 |
| 7 | The Bills | 27 | 30 | Ⓟ300 | Ⓟ110 | Ⓟ190 | Ⓟ1,919 |
| 8 | The Bills | 24 | 27 | Ⓟ270 | Ⓟ101 | Ⓟ169 | Ⓟ2,088 |

Final balance sheet: assets `Ⓟ2,088` = equity `Ⓟ2,088`, **balanced**, of which
`Ⓟ500` is the kid's starting capital and `Ⓟ1,588` is profit. Ingredient costs
scale with volume; the electricity bill and pitch fee do not — fixed versus
variable cost, introduced without ever using the words.

### The invariants the tests hold

1. The same seed plays the identical day; different seeds and days do not.
2. Every event lands inside the day, in chronological order.
3. A tier's days differ from one another (word of mouth), so no two days look alike.
4. Ingredient cost tracks cups made; the fixed bills do not.
5. Demand falls as the price rises, and is clamped to `[0, capacity]`.
6. Debits equal credits, and `Assets = Liabilities + Equity`, at the end of
   **every single day**.
7. Only real accounts are ever posted, always for a positive amount.
8. Profit equals revenue minus costs; the till grows by exactly the profit earned.
9. **Reconciling a day by hand reproduces exactly the ledger that day produced.**

Number 9 is the architecture in one assertion. It is also the anti-cheat
mechanism for the future online league (section 10).

---

## 7. Deliberate simplifications

1. **The supply run is booked straight to cost of goods sold.** A juice cart
   buys exactly what it will juice today and holds no stock, so there is no
   inventory to value yet. The inventory/FIFO material arrives at Day 17 with a
   crate of fruit that *does* sit over. Nothing here teaches that buying stock is
   an expense, because this cart never has stock.
2. **Costs are the same every day.** Real overhead drifts; quiet variation is
   noise for a beginner and arrives later with weather events.
3. **The rival is scenery.** It appears in the scene and holds a market-share
   bar, but does not yet react to your price. That is the Day 9+ story.

---

## 8. Acceptance criteria for Stage One

- [ ] Days 1-3 ask for **one** entry; Days 4-8 ask for **four**.
- [ ] A full day plays in 4-6 minutes including the reconcile.
- [ ] The till, profit and balance sheet always agree with the reconcile.
- [ ] Every wrong block produces a named misconception and a fix.
- [ ] Pause works everywhere; reduced motion strips springs but not progress.
- [ ] Closing the tab mid-day and returning resumes the campaign.
- [ ] No network calls. It works on a plane.
- [ ] Smooth on a low-end phone with the sounds muted.

---

## 9. Next tasks

1. **Palette** — add the theme tokens and a `/campaign` world shell.
2. **The live day** — scene, sun arc, walk-on customers, tap-to-serve, till,
   and the Impact HUD fed by `generateDay()`.
3. **The reconcile** — reuse `BalanceScale`/`AccountCard`, fed by
   `buildReconcile()`, plus the day log.
4. **The close** — render `runDay()`'s statements through the existing panels.
5. **Campaign state** — day, tier, carried ledger, persisted in the versioned
   store next to `zoxdi.progress`.
6. **Add `framer-motion`** for the springs.

---

## 10. The online league (designed for, not built)

The advanced mode you described — a shared local market where everyone gets the
same token grant, trades in real time, and the winner is whoever used money
wisely — fits this architecture unusually well, because of one property:

**A run is `seed + decision log`, and `seed + decision log` replays exactly.**

So a leaderboard entry is not a claimed number, it is a *proof*: the server
replays the run and either reproduces the score or rejects it. No trust, no
cheating, no server-side simulation needed. The same property makes ghost/replay
of a rival's day possible for teaching.

Shape, when the time comes:
1. Local, offline league: several profiles on one device, same seed, compare
   final balance sheets. Ships with no backend at all.
2. Optional server sync: upload `{seed, decisions}` rather than state.
3. Live market: a season-long token grant, a shared price board, and a weekly
   settlement day — the "who used money wisely" ranking read straight off the
   balance sheet and cash-flow statement each player already produced.

Keep this out of Stage One. It is the reward for finishing the campaign, and it
only works if every earlier day already balances.
