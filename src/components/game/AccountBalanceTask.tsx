"use client";

import type { Account } from "@/lib/accounting/types";
import { formatMoney } from "@/lib/accounting/engine";
import type { Lang } from "@/lib/i18n";
import { ChoiceList, type ChoiceOption } from "./ChoiceList";

/**
 * Read a single T-account: totals are shown, the balance is what the student
 * must work out. This is the "balance an account" skill from the ledger work.
 */
export function AccountBalanceTask({
  account,
  debits,
  credits,
  options,
  value,
  onChange,
  disabled,
  lang,
}: {
  account: Account;
  debits: number[];
  credits: number[];
  options: ChoiceOption[];
  value: string | null;
  onChange: (id: string) => void;
  disabled?: boolean;
  lang: Lang;
}) {
  const debitTotal = debits.reduce((sum, value) => sum + value, 0);
  const creditTotal = credits.reduce((sum, value) => sum + value, 0);

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-xl2 border-2 border-line bg-paper-card">
        <div className="border-b border-line bg-paper-sunken/50 px-4 py-2 text-center font-extrabold text-ink">
          {lang === "ur" && account.nameUr ? account.nameUr : account.name} (T-account)
        </div>
        <div className="grid grid-cols-2 divide-x divide-line">
          <div className="p-3">
            <p className="mb-2 text-center text-[11px] font-black uppercase tracking-wide text-debit-deep">
              Debit
            </p>
            <ul className="space-y-1.5">
              {debits.length === 0 && <li className="text-center text-sm text-ink-muted">—</li>}
              {debits.map((amount, index) => (
                <li
                  key={index}
                  className="rounded-lg bg-debit-soft/50 px-2.5 py-1.5 text-center font-mono text-sm font-bold text-ink"
                >
                  {formatMoney(amount)}
                </li>
              ))}
            </ul>
            <p className="mt-2 border-t border-line pt-1.5 text-center font-mono text-sm font-black text-debit-deep">
              {formatMoney(debitTotal)}
            </p>
          </div>
          <div className="p-3">
            <p className="mb-2 text-center text-[11px] font-black uppercase tracking-wide text-credit-deep">
              Credit
            </p>
            <ul className="space-y-1.5">
              {credits.length === 0 && <li className="text-center text-sm text-ink-muted">—</li>}
              {credits.map((amount, index) => (
                <li
                  key={index}
                  className="rounded-lg bg-credit-soft/50 px-2.5 py-1.5 text-center font-mono text-sm font-bold text-ink"
                >
                  {formatMoney(amount)}
                </li>
              ))}
            </ul>
            <p className="mt-2 border-t border-line pt-1.5 text-center font-mono text-sm font-black text-credit-deep">
              {formatMoney(creditTotal)}
            </p>
          </div>
        </div>
      </div>

      <ChoiceList options={options} value={value} onChange={onChange} disabled={disabled} />
    </div>
  );
}
