"use client";

import type { Account, AccountType, Side } from "@/lib/accounting/types";
import { ACCOUNT_TYPE_LABEL, increaseSide } from "@/lib/accounting/rules";
import type { Lang } from "@/lib/i18n";

export const TYPE_STYLES: Record<AccountType, string> = {
  asset: "bg-debit-soft text-debit-deep",
  liability: "bg-credit-soft text-credit-deep",
  equity: "bg-gold-soft text-gold-deep",
  revenue: "bg-good-soft text-good",
  expense: "bg-bad-soft text-bad",
};

export interface AccountCardProps {
  account: Account;
  lang: Lang;
  selected?: boolean;
  placed?: Side | null;
  disabled?: boolean;
  onSelect?: () => void;
  onPointerDown?: (event: React.PointerEvent) => void;
}

const SIDE_LABEL: Record<Side, { en: string; ur: string }> = {
  debit: { en: "Debit", ur: "ڈیبٹ" },
  credit: { en: "Credit", ur: "کریڈٹ" },
};

export function AccountCard({
  account,
  lang,
  selected = false,
  placed = null,
  disabled = false,
  onSelect,
  onPointerDown,
}: AccountCardProps) {
  const side = increaseSide(account);
  return (
    <button
      type="button"
      draggable={false}
      disabled={disabled}
      onPointerDown={onPointerDown}
      onClick={onSelect}
      className={`group w-full touch-manipulation rounded-xl border-2 bg-paper-card px-3 py-2.5 text-left shadow-card transition
        ${
          selected
            ? "border-gold ring-2 ring-gold/40"
            : placed
              ? placed === "debit"
                ? "border-debit bg-debit-soft/40"
                : "border-credit bg-credit-soft/40"
              : "border-line hover:border-gold/60 hover:shadow-lift"
        }
        ${disabled ? "cursor-not-allowed opacity-50" : "cursor-grab active:cursor-grabbing"}
      `}
      aria-pressed={selected}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-ink">
            {lang === "ur" && account.nameUr ? account.nameUr : account.name}
            {lang === "ur" && account.nameUr ? (
              <span className="ml-2 hidden text-xs font-normal text-ink-muted sm:inline">
                {account.name}
              </span>
            ) : null}
          </p>
          <p className="truncate text-xs text-ink-muted">{account.description}</p>
        </div>
        <span
          className={`shrink-0 rounded-full px-1.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wide ${TYPE_STYLES[account.type]}`}
        >
          {ACCOUNT_TYPE_LABEL[account.type]}
        </span>
      </div>
      <div className="mt-1.5 flex items-center gap-1.5">
        <span className="rounded-md bg-paper-sunken px-1.5 py-0.5 text-[11px] font-bold text-ink-soft">
          ↑ {SIDE_LABEL[side][lang]}
        </span>
      </div>
    </button>
  );
}
