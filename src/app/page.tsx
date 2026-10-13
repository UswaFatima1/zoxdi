import Link from "next/link";
import { FactBuddy } from "@/components/fx/FactBuddy";

const JOURNEY = [
  { icon: "🧾", label: "Transaction" },
  { icon: "⚖️", label: "Debit & Credit" },
  { icon: "📓", label: "Journal" },
  { icon: "📒", label: "Ledger" },
  { icon: "✅", label: "Trial balance" },
  { icon: "🏦", label: "Statements" },
];

const FEATURES = [
  {
    icon: "🩺",
    title: "A mistake becomes a lesson",
    body: "Zoxdi names your error — “you mixed up an asset and a liability” — then fixes it.",
    ring: "border-credit/40",
  },
  {
    icon: "🧪",
    title: "Account Lab",
    body: "Post your own transactions and watch the ledger, trial balance and statements update live.",
    ring: "border-debit/40",
  },
  {
    icon: "🛂",
    title: "Your profile",
    body: "Real proof you learned — first-try answers, fewer hints, retention over time.",
    ring: "border-gold/40",
  },
];

export default function HomePage() {
  return (
    <div className="space-y-16 pb-10 sm:space-y-20">
      {/* Hero — a full-bleed band so the page never looks boxed in */}
      <section className="relative -mx-4 overflow-hidden border-y border-line/50 px-4 py-12 sm:-mx-6 sm:px-6 sm:py-16 lg:-mx-8 lg:px-8">
        <div className="pointer-events-none absolute inset-0 grad-ig-anim animate-gradient-pan opacity-[0.09]" />
        <div className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 animate-float rounded-full bg-credit/25 blur-3xl" />
        <div
          className="pointer-events-none absolute -right-24 top-0 h-80 w-80 animate-float rounded-full bg-debit/25 blur-3xl"
          style={{ animationDelay: "1.4s" }}
        />
        <div className="pointer-events-none absolute left-1/2 top-1/3 h-64 w-64 rounded-full bg-gold/20 blur-3xl" />

        <div className="relative mx-auto grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] xl:gap-16">
          <div className="animate-slide-up">
            <div className="mb-5 flex flex-wrap gap-2 text-xs font-black uppercase tracking-wider">
              <span className="rounded-full bg-credit-soft px-3 py-1 text-credit-deep">
                Beginner → Pro
              </span>
              <span className="rounded-full bg-debit-soft px-3 py-1 text-debit-deep">Game-based</span>
              <span className="rounded-full bg-gold-soft px-3 py-1 text-gold-deep">Works offline</span>
            </div>

            <h1 className="text-4xl font-black leading-[1.05] tracking-tight text-ink sm:text-6xl xl:text-7xl">
              Learn accounting
              <br />
              by <span className="text-ig">running a shop.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-ink-muted sm:text-xl">
              From your first dollar to the balance sheet — real books, real
              mistakes, one level at a time.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/learn"
                className="rounded-full bg-ig-135 px-7 py-3.5 font-black text-white shadow-glow transition hover:-translate-y-0.5 hover:opacity-95 active:scale-[0.99]"
              >
                Start learning →
              </Link>
              <Link
                href="/lab"
                className="rounded-full border border-line bg-paper-card px-7 py-3.5 font-bold text-ink-soft transition hover:-translate-y-0.5 hover:border-credit/50 hover:text-ink"
              >
                🧪 Account Lab
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-bold text-ink-muted">
              <span>🎓 6 chapters</span>
              <span>🎮 40 levels</span>
              <span>🎯 500+ questions</span>
            </div>
          </div>

          {/* Illustration: a live journal card with a talking mascot */}
          <div className="relative animate-bounce-in">
            <div className="grad-ring rounded-xl3 border border-line bg-paper-card p-5 shadow-lift">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-paper-sunken px-3 py-1 text-xs font-black uppercase tracking-wide text-ink-muted">
                  Journal entry
                </span>
                <span className="font-mono text-sm font-black text-credit-deep">$60,000</span>
              </div>
              <p className="mt-3 text-sm font-semibold text-ink-soft">
                Bought inventory on credit — pay next month.
              </p>
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between rounded-xl border-2 border-debit/40 bg-debit-soft/50 px-3 py-2.5">
                  <span className="text-sm font-black text-debit-deep">Dr · Inventory</span>
                  <span className="font-mono text-sm font-bold text-ink">60,000</span>
                </div>
                <div className="flex items-center justify-between rounded-xl border-2 border-credit/40 bg-credit-soft/50 px-3 py-2.5">
                  <span className="text-sm font-black text-credit-deep">Cr · Accounts Payable</span>
                  <span className="font-mono text-sm font-bold text-ink">60,000</span>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2 rounded-xl bg-good-soft px-3 py-2 text-sm font-bold text-good">
                ✓ Balanced — assets up, liabilities up
              </div>

              <div className="mt-4 border-t border-line/70 pt-4">
                <FactBuddy />
              </div>
            </div>
            <div className="absolute -bottom-4 -right-4 hidden animate-float rounded-2xl border border-line bg-paper-card px-4 py-2 shadow-card sm:block">
              <span className="font-mono text-lg font-black text-ig">+120 XP</span>
            </div>
          </div>
        </div>
      </section>

      {/* The learning journey */}
      <section className="animate-rise text-center">
        <h2 className="text-sm font-black uppercase tracking-wide text-ink-muted">
          The journey you will complete
        </h2>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          {JOURNEY.map((step, index) => (
            <div key={step.label} className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-2 rounded-full border border-line bg-paper-card px-3.5 py-2 shadow-card">
                <span className="text-lg" aria-hidden="true">{step.icon}</span>
                <span className="text-sm font-bold text-ink">{step.label}</span>
              </div>
              {index < JOURNEY.length - 1 && (
                <span className="text-ink-muted" aria-hidden="true">→</span>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="grid gap-5 md:grid-cols-3">
        {FEATURES.map((feature, index) => (
          <div
            key={feature.title}
            style={{ animationDelay: `${index * 90}ms` }}
            className={`animate-rise rounded-xl3 border-2 ${feature.ring} bg-paper-card p-6 shadow-card transition hover:-translate-y-1 hover:shadow-lift`}
          >
            <span className="text-4xl" aria-hidden="true">{feature.icon}</span>
            <h3 className="mt-3 text-lg font-black text-ink">{feature.title}</h3>
            <p className="mt-1.5 text-sm text-ink-muted">{feature.body}</p>
          </div>
        ))}
      </section>

      {/* Practise */}
      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-xl3 border border-line bg-paper-card p-6 shadow-card transition hover:-translate-y-1 hover:shadow-lift">
          <div className="flex items-center justify-between">
            <span className="text-4xl" aria-hidden="true">☀️</span>
            <span className="rounded-full bg-gold-soft px-3 py-1 text-xs font-black text-gold-deep">
              Streak
            </span>
          </div>
          <h3 className="mt-3 text-lg font-black text-ink">The Daily Challenge</h3>
          <p className="mt-1.5 text-sm text-ink-muted">
            Five questions, two minutes, every day. Keep the streak alive and the
            books stay fresh — a new set arrives each morning.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/daily"
              className="rounded-full bg-ig-135 px-5 py-2.5 text-sm font-black text-white shadow-glow transition hover:opacity-95"
            >
              Start today →
            </Link>
            <Link
              href="/cards"
              className="rounded-full border border-line px-5 py-2.5 text-sm font-bold text-ink-soft transition hover:border-credit/50 hover:text-ink"
            >
              🃏 Mnemonics
            </Link>
          </div>
        </div>
        <div className="rounded-xl3 border border-line bg-paper-card p-6 shadow-card transition hover:-translate-y-1 hover:shadow-lift">
          <div className="flex items-center justify-between">
            <span className="text-4xl" aria-hidden="true">⚡</span>
            <span className="rounded-full bg-credit-soft px-3 py-1 text-xs font-black text-credit-deep">
              60 seconds
            </span>
          </div>
          <h3 className="mt-3 text-lg font-black text-ink">The Speed Round</h3>
          <p className="mt-1.5 text-sm text-ink-muted">
            Five questions against the clock — the fastest way to prove you know
            the rules, and a score to beat.
          </p>
          <div className="mt-4">
            <Link
              href="/speed"
              className="rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-paper transition hover:bg-ink-soft"
            >
              Beat your best →
            </Link>
          </div>
        </div>
        <div className="rounded-xl3 border border-line bg-paper-card p-6 shadow-card transition hover:-translate-y-1 hover:shadow-lift">
          <div className="flex items-center justify-between">
            <span className="text-4xl" aria-hidden="true">🎯</span>
            <span className="rounded-full bg-debit-soft px-3 py-1 text-xs font-black text-debit-deep">
              500+ questions
            </span>
          </div>
          <h3 className="mt-3 text-lg font-black text-ink">The Question Drills</h3>
          <p className="mt-1.5 text-sm text-ink-muted">
            Filter by easy, medium, hard or expert and run ten at a time — every answer explained,
            every question drawn from a real set of books.
          </p>
          <div className="mt-4">
            <Link
              href="/drills"
              className="rounded-full border border-line px-5 py-2.5 text-sm font-bold text-ink-soft transition hover:border-credit/50 hover:text-ink"
            >
              Start a run →
            </Link>
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="animate-bounce-in overflow-hidden rounded-xl3 grad-ig p-1">
        <div className="rounded-[calc(1.75rem-4px)] bg-paper-card px-6 py-10 text-center sm:px-10">
          <h2 className="text-3xl font-black text-ink sm:text-4xl">
            Ready to open the shop?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-ink-muted">
            Six chapters. Forty levels. Five hundred questions. A leaderboard to climb.
          </p>
          <Link
            href="/learn"
            className="mt-6 inline-block rounded-full bg-ig-135 px-8 py-3.5 font-black text-white shadow-glow transition hover:opacity-95"
          >
            Begin Chapter 1
          </Link>
        </div>
      </section>
    </div>
  );
}
