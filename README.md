# Zoxdi

**Accountancy, taught as a game you can win.**

Zoxdi is an adaptive, game-based accounting platform for everyone, everywhere.
It never opens with a definition. You run a small shop, make real business
decisions in dollars, and watch every transaction move what the business owns,
owes and is worth — so the rules make sense because you have already lived the
transactions.

The core idea: **let people experience accounting before asking them to
memorise accounting rules**, and make every mistake a targeted lesson.

---

## What is in the app

- **6 chapters, 40 levels** on the learning path, from a first dollar to the
  balance sheet.
- **Concept lessons** with a "why & how" story before each new idea — the
  accounting equation, journal entries, the ledger, the trial balance,
  statements and adjusting entries (`/lessons`).
- **Account Lab** (`/lab`): post your own transactions and watch the ledger,
  trial balance and statements update live, with a real statement layout.
- **Question drills** (`/drills`): filter easy → expert and run ten at a time,
  every answer explained, with a per-level badge and title.
- **Daily challenge** (`/daily`), **speed round** (`/speed`) and **flashcards**
  (`/cards`).
- **A profile / mastery passport** (`/progress`): first-try success, hint usage
  and retention, not time spent, plus a misconception map.
- **Accounts** so progress follows you to any device, with an offline-first
  fallback that needs no backend at all.

Light and dark themes ship together (dark by default), with an Instagram-bright
gradient, motion throughout, and full-width responsive layout from 320 px up.

---

## Stack

| Concern | Choice |
| --- | --- |
| App | Next.js (App Router) + TypeScript, **static export** to `out/` |
| Styling | Tailwind CSS with CSS-variable theme tokens |
| Accounts + saved progress | **Supabase** (row-level security; public anon key only) |
| Hosting | **Cloudflare Pages** (free) — see [`DEPLOY.md`](./DEPLOY.md) |
| Analytics | **Google Analytics 4** (+ optional Cloudflare Web Analytics) |

Every service is optional and switched on by a build-time environment variable
(`.env.example`). With nothing configured, Zoxdi still runs: it keeps accounts
and progress itself and stays fully playable offline.

---

## Architecture

```
src/
├── app/                    Next.js App Router (static export)
│   ├── page.tsx            home / the pitch
│   ├── learn/              the chapter map
│   ├── lessons/            concept lessons ("why & how")
│   ├── lab/                Account Lab
│   ├── drills/ daily/ speed/ cards/
│   ├── play/[levelId]/     the playable level
│   ├── leaderboard/ progress/
│   ├── about/ login/
│   └── layout.tsx          theme pre-paint, header, footer, mobile nav, GA4
├── components/
│   ├── game/               BalanceScale, AccountCard, ForgeBuilder,
│   │                       TransactionPanel, TAccountView, LevelPlayer
│   ├── learning/           ConceptLesson, MiniDemo, HintPanel, FeedbackPanel,
│   │                       MasteryMap, MisconceptionMap
│   ├── lab/                the Account Lab dashboard and composer
│   ├── analytics/          GoogleAnalytics (GA4 loader + page views)
│   └── layout/             Header, MobileNav, Footer, ProfileGate, Logo, Avatar
├── lib/
│   ├── accounting/         types, rules, engine, validate   ← no UI, no content
│   ├── learning/           concepts, lessons, misconceptions, diagnose,
│   │                       mastery, recommendations, path
│   ├── analytics/          GA4 event helpers
│   ├── supabase/           config, client, cloud calls (SDK lazy-loaded)
│   └── storage/            versioned progress store + React context
└── data/accounting/        accounts, transactions, levels, question bank
```

Three decisions carry most of the weight:

1. **Accounting rules are separate from animations.** `src/lib/accounting` never
   imports React or content. One definition of "which side increases this
   account" serves every mechanic.
2. **Content is structured data, not hardcoded in the UI.** Each transaction
   declares its accounts, expected entry, explanation, difficulty and
   misconception tags.
3. **The engine is tested independently.** `tests/` holds **137 tests** across
   the rules, ledger, equation, validation, misconception detection, mastery,
   badges, titles, statements and storage migration.

The Supabase SDK is imported dynamically, so it stays out of the initial page
bundle and is only fetched by a visitor who is actually signing in.

---

## Running it

Node 18+ required.

```bash
npm install
npm run typecheck     # tsc --noEmit
npm test              # 137 tests
npm run build         # static export to ./out

# preview the exported site
node scripts/serve-static.mjs 4173 out   # http://localhost:4173
```

`npm run dev` starts the regular Next dev server.

To use the cloud or analytics locally, copy `.env.example` to `.env.local`, fill
in the values, and rebuild (the values are inlined at build time).

---

## Publishing

Step-by-step instructions for the free stack (Cloudflare Pages + Supabase +
Google Analytics 4 + Cloudflare Web Analytics) are in
[`DEPLOY.md`](./DEPLOY.md). In short: push to Git, connect the repo to
Cloudflare Pages, set `npm run build` with output directory `out`, add the
`NEXT_PUBLIC_*` environment variables, and deploy to a free `*.pages.dev`
address.

---

## Deliberate scope limits (honest notes)

- **Mastery percentages are estimates**, produced by the evidence model above
  (first-try success, hint usage, retention). They are only meaningful once real
  learners use the app.
- **The global leaderboard** is wired to the Supabase `leaderboard` view when a
  backend is configured, and falls back to a local cohort board otherwise.
- **The question bank is a living set.** New questions can be added as data
  without touching a component.

## Suggested next steps

1. Watch real learners use it and let their confusions shape the mechanics.
2. Grow the question bank and any concept that needs a clearer "why & how".
3. Add a pre-test / post-test pilot with a transparent method and report the
   limitations and results.
