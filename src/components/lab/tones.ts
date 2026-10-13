import type { AccountType } from "@/lib/accounting/types";

/** Shared colour treatment for an account type, used across the Lab. */
export const ACCOUNT_TYPE_TONE: Record<AccountType, string> = {
  asset: "bg-debit-soft text-debit-deep",
  liability: "bg-credit-soft text-credit-deep",
  equity: "bg-gold-soft text-gold-deep",
  revenue: "bg-good-soft text-good",
  expense: "bg-bad-soft text-bad",
};

export function accountTypeTone(type: AccountType): string {
  return ACCOUNT_TYPE_TONE[type];
}
