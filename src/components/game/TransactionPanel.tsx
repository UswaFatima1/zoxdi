"use client";

import { formatMoney } from "@/lib/accounting/engine";
import type { Transaction } from "@/data/accounting/types";
import type { Lang } from "@/lib/i18n";

export function TransactionPanel({
  transaction,
  lang,
}: {
  transaction: Transaction;
  lang: Lang;
}) {
  return (
    <div className="rounded-xl2 border border-line bg-paper-card p-5 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <p className="text-base leading-relaxed text-ink sm:text-lg">
          {transaction.scenario}
        </p>
        <div className="shrink-0 rounded-full bg-ink px-3 py-1.5 text-sm font-extrabold text-gold-soft">
          {formatMoney(transaction.amount)}
          <span className="ml-1 text-[11px] font-bold uppercase text-paper/60">
            {transaction.currency}
          </span>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs text-ink-muted">
        <span className="rounded-md bg-paper-sunken px-2 py-0.5 font-semibold">
          Difficulty {transaction.difficulty}/3
        </span>
        <span>•</span>
        <span>{lang === "ur" ? "ہر فیصلہ دو کھاتوں کو بدلتا ہے" : "Every decision changes at least two accounts"}</span>
      </div>
    </div>
  );
}
