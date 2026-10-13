"use client";

import { ACCOUNTS } from "@/data/accounting/accounts";
import { formatMoney } from "@/lib/accounting/engine";
import { findAccount } from "@/lib/accounting/engine";
import type { EntryLine } from "@/lib/accounting/types";
import type { Lang } from "@/lib/i18n";

/**
 * Renders the accounts touched by an entry as miniature T-accounts, so the
 * student sees how the journal entry lands in the ledger.
 */
export function TAccountView({ lines, lang }: { lines: EntryLine[]; lang: Lang }) {
  const rows = lines.map((line) => ({
    account: findAccount(ACCOUNTS, line.accountId),
    line,
  }));

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {rows.map(({ account, line }) => (
        <div key={`${account.id}-${line.side}`} className="overflow-hidden rounded-lg border border-line bg-paper-card">
          <div className="border-b border-line bg-paper-sunken/50 px-3 py-1.5 text-sm font-bold text-ink">
            {lang === "ur" && account.nameUr ? account.nameUr : account.name}
            <span className="ml-2 rounded bg-paper-sunken px-1.5 text-[11px] font-extrabold uppercase text-ink-muted">
              {account.type}
            </span>
          </div>
          <div className="grid grid-cols-2 divide-x divide-line text-center">
            <div className="py-2">
              <p className="text-[11px] font-bold uppercase tracking-wide text-debit-deep">Debit</p>
              <p className="font-mono text-sm font-bold text-ink">
                {line.side === "debit" ? formatMoney(line.amount) : "—"}
              </p>
            </div>
            <div className="py-2">
              <p className="text-[11px] font-bold uppercase tracking-wide text-credit-deep">Credit</p>
              <p className="font-mono text-sm font-bold text-ink">
                {line.side === "credit" ? formatMoney(line.amount) : "—"}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
