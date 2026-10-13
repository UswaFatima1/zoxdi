"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ACCOUNTS } from "@/data/accounting/accounts";
import { accountingEquation, applyEntry, formatMoney } from "@/lib/accounting/engine";
import type { EntryLine, Ledger, Side } from "@/lib/accounting/types";
import { balanceSheet, incomeStatement, trialBalance } from "@/lib/accounting/statements";
import { useProgressContext } from "@/lib/storage/ProgressContext";
import { EntryComposer } from "./EntryComposer";
import { LabGuide } from "./LabGuide";
import {
  BalanceSheetPanel,
  IncomeStatementPanel,
  LedgerPanel,
  TrialBalancePanel,
} from "./StatementPanels";

/** A journal entry the student typed in the Lab. */
interface CustomEntry {
  id: string;
  narration: string;
  lines: EntryLine[];
}

const BLANK_DRAFT: EntryLine[] = [
  { accountId: "cash", side: "debit", amount: 0 },
  { accountId: "capital", side: "credit", amount: 0 },
];

const GUIDE_KEY = "zoxdi.lab.guide.v1";

type LabView = "all" | "journal" | "ledger" | "trial" | "income" | "balance";

const VIEWS: { id: LabView; label: string; icon: string }[] = [
  { id: "all", label: "Dashboard", icon: "🗂️" },
  { id: "journal", label: "Journal", icon: "📓" },
  { id: "ledger", label: "Ledger", icon: "📒" },
  { id: "trial", label: "Trial balance", icon: "⚖️" },
  { id: "income", label: "Income", icon: "📈" },
  { id: "balance", label: "Balance sheet", icon: "🏦" },
];

/** The "why & how" lesson that explains the idea behind each module. */
const VIEW_LESSON: Partial<Record<LabView, string>> = {
  journal: "journal-entries",
  ledger: "ledger",
  trial: "trial-balance",
  income: "financial-statements",
  balance: "financial-statements",
};

function KpiCard({
  label,
  hint,
  value,
  accent,
}: {
  label: string;
  hint: string;
  value: number;
  accent: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl2 border border-line bg-paper-card p-3 shadow-card">
      <span className={`absolute inset-x-0 top-0 h-1 ${accent}`} aria-hidden="true" />
      <p className="text-[11px] font-black uppercase tracking-wide text-ink-muted">{label}</p>
      <p className="mt-1 font-mono text-lg font-black tabular-nums text-ink">{formatMoney(value)}</p>
      <p className="mt-0.5 text-[11px] font-bold text-ink-muted">{hint}</p>
    </div>
  );
}

function PanelBox({
  title,
  icon,
  hint,
  tall = false,
  children,
}: {
  title: string;
  icon: string;
  hint?: string;
  tall?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="flex min-h-0 flex-col overflow-hidden rounded-xl2 border border-line bg-paper-card shadow-card">
      <div className="flex items-center justify-between gap-2 border-b border-line bg-paper-sunken/40 px-4 py-2.5">
        <p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wide text-ink-soft">
          <span aria-hidden="true">{icon}</span>
          {title}
        </p>
        {hint ? (
          <span className="truncate text-[11px] font-bold uppercase tracking-wide text-ink-muted">
            {hint}
          </span>
        ) : null}
      </div>
      <div
        className={`min-h-0 flex-1 overflow-y-auto p-3 ${
          tall ? "max-h-[34rem]" : "max-h-[22rem] xl:max-h-[26rem]"
        }`}
      >
        {children}
      </div>
    </section>
  );
}

export function LabDashboard() {
  const { progress, lang } = useProgressContext();
  const [entries, setEntries] = useState<CustomEntry[]>([]);
  const [draft, setDraft] = useState<EntryLine[]>(BLANK_DRAFT);
  const [narration, setNarration] = useState("");
  const [guideOpen, setGuideOpen] = useState(false);
  const [view, setView] = useState<LabView>("all");
  const composerRef = useRef<HTMLDivElement | null>(null);

  // Show the guide once, on the first visit to the Lab.
  useEffect(() => {
    try {
      if (!localStorage.getItem(GUIDE_KEY)) setGuideOpen(true);
    } catch {
      setGuideOpen(true);
    }
  }, []);

  const closeGuide = () => {
    setGuideOpen(false);
    try {
      localStorage.setItem(GUIDE_KEY, "1");
    } catch {
      // Ignore storage failures; the guide simply reappears next time.
    }
  };

  // The live ledger is the single source of truth: every panel is derived.
  const ledger = useMemo<Ledger>(
    () => entries.reduce<Ledger>((current, entry) => applyEntry(current, entry.lines), {}),
    [entries],
  );

  const equation = useMemo(() => accountingEquation(ACCOUNTS, ledger), [ledger]);
  const trial = useMemo(() => trialBalance(ACCOUNTS, ledger), [ledger]);
  const income = useMemo(() => incomeStatement(ACCOUNTS, ledger), [ledger]);
  const sheet = useMemo(() => balanceSheet(ACCOUNTS, ledger), [ledger]);

  const postEntry = () => {
    const usable = draft.filter((line) => line.amount > 0);
    if (usable.length === 0) return;
    const entry: CustomEntry = {
      id:
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `entry-${Date.now()}`,
      narration: narration.trim() || "Your entry",
      lines: usable,
    };
    setEntries((current) => [...current, entry]);
    setDraft(BLANK_DRAFT);
    setNarration("");
  };

  const removeEntry = (id: string) => {
    setEntries((current) => current.filter((entry) => entry.id !== id));
  };

  const quickAdd = (accountId: string, side: Side) => {
    setDraft((current) => {
      const blankIndex = current.findIndex((line) => line.amount === 0);
      if (blankIndex >= 0) {
        return current.map((line, index) =>
          index === blankIndex ? { accountId, side, amount: 0 } : line,
        );
      }
      return [...current, { accountId, side, amount: 0 }];
    });
    composerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const journal = (
    <div className="rounded-xl2 border border-line bg-paper-card shadow-card">
      <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
        <p className="text-[11px] font-black uppercase tracking-wide text-ink-soft">
          📓 Journal
        </p>
        {entries.length > 0 && (
          <button
            type="button"
            onClick={() => setEntries([])}
            className="text-[11px] font-bold text-ink-muted underline-offset-2 transition hover:text-bad hover:underline"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="p-3">
        {entries.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line px-3 py-6 text-center text-sm text-ink-muted">
            No entries yet. Write your first one above — try “Owner invests $100,000”.
          </p>
        ) : (
          <div className="max-h-[26rem] space-y-2 overflow-y-auto pr-1">
            {[...entries].reverse().map((entry, reversedIndex) => (
              <div
                key={entry.id}
                className="animate-rise rounded-xl border border-line bg-paper-sunken/30 p-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="flex items-center gap-2 text-xs font-bold text-ink">
                    <span className="rounded bg-paper-card px-1.5 py-0.5 font-mono text-[11px] font-black text-ink-muted">
                      #{entries.length - reversedIndex}
                    </span>
                    {entry.narration}
                  </p>
                  <button
                    type="button"
                    onClick={() => removeEntry(entry.id)}
                    className="rounded-md px-1.5 text-ink-muted transition hover:bg-bad-soft hover:text-bad"
                    aria-label={`Remove ${entry.narration}`}
                  >
                    ✕
                  </button>
                </div>
                <div className="mt-1.5 space-y-0.5">
                  {entry.lines.map((line, index) => {
                    const account = ACCOUNTS.find(
                      (candidate) => candidate.id === line.accountId,
                    );
                    const isDebit = line.side === "debit";
                    return (
                      <div
                        key={`${line.accountId}-${index}`}
                        className="flex items-center justify-between gap-2 text-xs"
                      >
                        <span className="flex items-center gap-1.5">
                          <span
                            className={`font-mono text-[11px] font-black ${
                              isDebit ? "text-debit-deep" : "text-credit-deep"
                            }`}
                          >
                            {isDebit ? "DR" : "CR"}
                          </span>
                          <span className={isDebit ? "font-semibold text-ink" : "pl-3 text-ink"}>
                            {account?.name ?? line.accountId}
                          </span>
                        </span>
                        <span className="font-mono font-bold tabular-nums text-ink">
                          {formatMoney(line.amount)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-4 py-6">
      <LabGuide open={guideOpen} onClose={closeGuide} />

      {/* Heading */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-credit">Account Lab</p>
          <h1 className="mt-1 text-2xl font-black text-ink sm:text-3xl">Your own books, live</h1>
          <p className="mt-1 max-w-xl text-sm text-ink-muted">
            Post a transaction and watch the ledger, trial balance, income statement and balance
            sheet move together. Nothing is pre-loaded — it is all yours.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-3 py-1.5 text-xs font-black ${
              equation.balanced ? "bg-good-soft text-good" : "bg-bad-soft text-bad"
            }`}
          >
            {entries.length === 0
              ? "No entries yet"
              : equation.balanced
                ? `✓ In balance · ${entries.length} entr${entries.length === 1 ? "y" : "ies"}`
                : "✗ Out of balance"}
          </span>
          <button
            type="button"
            onClick={() => setGuideOpen(true)}
            className="rounded-full border border-line bg-paper-card px-4 py-1.5 text-xs font-bold text-ink-soft transition hover:border-credit/50 hover:text-ink"
          >
            ❔ How it works
          </button>
          <Link
            href="/learn"
            className="rounded-full border border-line bg-paper-card px-4 py-1.5 text-xs font-bold text-ink-soft transition hover:border-credit/50 hover:text-ink"
          >
            ← Back to levels
          </Link>
        </div>
      </div>

      {/* KPI strip: the accounting equation, as the books' headline numbers */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Assets" hint="what the business owns" value={equation.assets} accent="bg-debit" />
        <KpiCard
          label="Liabilities"
          hint="what it owes"
          value={equation.liabilities}
          accent="bg-credit"
        />
        <KpiCard label="Equity" hint="owner's stake" value={equation.equity} accent="bg-gold" />
        <KpiCard
          label={income.netProfit >= 0 ? "Net profit" : "Net loss"}
          hint="revenue − expenses"
          value={income.netProfit}
          accent="bg-good"
        />
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl2 border border-line bg-paper-card px-4 py-2.5 text-sm font-bold shadow-card">
        <span className="text-[11px] font-black uppercase tracking-wide text-ink-muted">
          Accounting equation
        </span>
        <span className="font-mono text-debit-deep">{formatMoney(equation.assets)}</span>
        <span className="text-ink-muted">=</span>
        <span className="font-mono text-credit-deep">{formatMoney(equation.liabilities)}</span>
        <span className="text-ink-muted">+</span>
        <span className="font-mono text-gold-deep">{formatMoney(equation.equity)}</span>
        <span
          className={`ml-auto rounded-full px-2.5 py-0.5 text-xs font-black ${
            equation.identityHolds ? "bg-good-soft text-good" : "bg-bad-soft text-bad"
          }`}
        >
          {equation.identityHolds ? "✓ balanced" : "✗ off"}
        </span>
      </div>

      <div className="grid gap-4 xl:grid-cols-[380px_1fr]">
        {/* Left rail: entry builder + journal */}
        <div className="space-y-4">
          <div ref={composerRef} className="scroll-mt-24">
            <EntryComposer
              accounts={ACCOUNTS}
              lines={draft}
              narration={narration}
              onLinesChange={setDraft}
              onNarrationChange={setNarration}
              onPost={postEntry}
              onClear={() => {
                setDraft(BLANK_DRAFT);
                setNarration("");
              }}
            />
          </div>
          {journal}
        </div>

        {/* Right: the books, by module */}
        <div className="space-y-3">
          <div className="flex flex-wrap gap-1.5 rounded-xl2 border border-line bg-paper-card p-1.5 shadow-card">
            {VIEWS.map((item) => {
              const active = view === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setView(item.id)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-black transition ${
                    active
                      ? "grad-ig text-white shadow-sm"
                      : "text-ink-muted hover:bg-paper-sunken hover:text-ink"
                  }`}
                >
                  <span className="mr-1.5" aria-hidden="true">
                    {item.icon}
                  </span>
                  {item.label}
                </button>
              );
            })}
            {VIEW_LESSON[view] && (
              <Link
                href={`/lessons/${VIEW_LESSON[view]}`}
                className="ml-auto rounded-lg border border-credit/30 bg-credit-soft/40 px-3 py-1.5 text-xs font-black text-credit-deep transition hover:bg-credit-soft"
              >
                ❔ Why &amp; how
              </Link>
            )}
          </div>

          {view === "all" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <PanelBox title="T-accounts" icon="📒" hint="debit / credit">
                <LedgerPanel ledger={ledger} lang={lang} onQuickAdd={quickAdd} />
              </PanelBox>
              <PanelBox title="Trial balance" icon="⚖️" hint="must agree">
                <TrialBalancePanel trial={trial} lang={lang} />
              </PanelBox>
              <PanelBox title="Income statement" icon="📈" hint="performance to date">
                <IncomeStatementPanel income={income} lang={lang} />
              </PanelBox>
              <PanelBox title="Balance sheet" icon="🏦" hint="at a moment in time">
                <BalanceSheetPanel sheet={sheet} lang={lang} />
              </PanelBox>
            </div>
          )}

          {view === "journal" && <div>{journal}</div>}

          {view === "ledger" && (
            <PanelBox title="General ledger" icon="📒" hint="click an account to post to it" tall>
              <LedgerPanel ledger={ledger} lang={lang} onQuickAdd={quickAdd} />
            </PanelBox>
          )}

          {view === "trial" && (
            <PanelBox title="Trial balance" icon="⚖️" hint="total debits = total credits" tall>
              <TrialBalancePanel trial={trial} lang={lang} />
            </PanelBox>
          )}

          {view === "income" && (
            <PanelBox title="Income statement" icon="📈" hint="for the whole period" tall>
              <IncomeStatementPanel income={income} lang={lang} />
            </PanelBox>
          )}

          {view === "balance" && (
            <PanelBox title="Balance sheet" icon="🏦" hint="assets = liabilities + equity" tall>
              <BalanceSheetPanel sheet={sheet} lang={lang} />
            </PanelBox>
          )}
        </div>
      </div>

      {!progress.profile && (
        <p className="text-center text-xs text-ink-muted">
          Sign in to save your XP and appear on the leaderboard.
        </p>
      )}
    </div>
  );
}
