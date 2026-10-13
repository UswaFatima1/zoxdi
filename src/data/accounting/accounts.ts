import type { Account } from "@/lib/accounting/types";

/**
 * A small, realistic chart of accounts for a general trading business.
 * Optional translated names are carried alongside each account so the
 * interface could be localised without a rebuild; the app ships in English.
 */
export const ACCOUNTS: Account[] = [
  // ── Assets: what the business owns or is owed ──────────────────────────
  {
    id: "cash",
    name: "Cash",
    nameUr: "نقد",
    type: "asset",
    description: "Money the business holds in notes and coins.",
  },
  {
    id: "bank",
    name: "Bank",
    nameUr: "بینک",
    type: "asset",
    description: "Money the business keeps in its bank account.",
  },
  {
    id: "accounts-receivable",
    name: "Accounts Receivable",
    nameUr: "قابلِ وصول حسابات",
    type: "asset",
    description: "Money customers owe the business for goods already sold on credit.",
  },
  {
    id: "inventory",
    name: "Inventory",
    nameUr: "مال",
    type: "asset",
    description: "Goods the business has bought to sell.",
  },
  {
    id: "equipment",
    name: "Equipment",
    nameUr: "آلات و سامان",
    type: "asset",
    description: "Long-lasting items such as shelving, fridges and counters.",
  },
  {
    id: "office-supplies",
    name: "Office Supplies",
    nameUr: "دفتری سامان",
    type: "asset",
    description: "Everyday items such as paper and pens, kept for later use.",
  },
  {
    id: "prepaid-rent",
    name: "Prepaid Rent",
    nameUr: "پیشگی کرایہ",
    type: "asset",
    description: "Rent paid in advance for a future period, still an asset until it is used.",
  },

  // ── Liabilities: what the business owes ────────────────────────────────
  {
    id: "accounts-payable",
    name: "Accounts Payable",
    nameUr: "قابلِ ادائیگی حسابات",
    type: "liability",
    description: "Money the business owes suppliers for goods bought on credit.",
  },
  {
    id: "bank-loan",
    name: "Bank Loan",
    nameUr: "بینک قرض",
    type: "liability",
    description: "Money borrowed from the bank and still to be repaid.",
  },
  {
    id: "salaries-payable",
    name: "Salaries Payable",
    nameUr: "قابلِ ادائیگی تنخواہیں",
    type: "liability",
    description: "Wages earned by staff but not yet paid.",
  },
  {
    id: "unearned-revenue",
    name: "Unearned Revenue",
    nameUr: "پیشگی آمدنی",
    type: "liability",
    description: "Money received from a customer before the goods are delivered.",
  },
  {
    id: "utilities-payable",
    name: "Utilities Payable",
    nameUr: "قابلِ ادائیگی یوٹیلیٹی بل",
    type: "liability",
    description: "Electricity, gas or water bills received but not yet paid.",
  },

  // ── Equity: the owner's stake ──────────────────────────────────────────
  {
    id: "capital",
    name: "Owner's Capital",
    nameUr: "مالک کا سرمایہ",
    type: "equity",
    description: "Value the owner has put into the business.",
  },
  {
    id: "drawings",
    name: "Owner's Drawings",
    nameUr: "مالک کی نکاسی",
    type: "equity",
    // Contra-equity: increases on the debit side because it *reduces* equity.
    normalBalance: "debit",
    description: "Money the owner takes out of the business for personal use.",
  },

  // ── Revenue: income earned ─────────────────────────────────────────────
  {
    id: "sales-revenue",
    name: "Sales Revenue",
    nameUr: "فروخت آمدنی",
    type: "revenue",
    description: "Income earned from selling goods.",
  },
  {
    id: "service-revenue",
    name: "Service Revenue",
    nameUr: "خدمات آمدنی",
    type: "revenue",
    description: "Income earned from providing a service.",
  },

  // ── Expenses: costs used up ────────────────────────────────────────────
  {
    id: "rent-expense",
    name: "Rent Expense",
    nameUr: "کرایہ خرچ",
    type: "expense",
    description: "The cost of using the shop premises.",
  },
  {
    id: "salaries-expense",
    name: "Salaries Expense",
    nameUr: "تنخواہ خرچ",
    type: "expense",
    description: "Wages paid to staff for their work.",
  },
  {
    id: "utilities-expense",
    name: "Utilities Expense",
    nameUr: "یوٹیلیٹی خرچ",
    type: "expense",
    description: "The cost of electricity, gas and water used.",
  },
  {
    id: "marketing-expense",
    name: "Marketing Expense",
    nameUr: "تشہیری خرچ",
    type: "expense",
    description: "The cost of advertising and promoting the business.",
  },
  {
    id: "cost-of-goods-sold",
    name: "Cost of Goods Sold",
    nameUr: "بکری شدہ مال کی لاگت",
    type: "expense",
    description: "What the goods sold originally cost the business.",
  },
  {
    id: "bad-debts",
    name: "Bad Debts",
    nameUr: "ناقابلِ وصول قرضے",
    type: "expense",
    description: "Money owed by customers that will never be collected.",
  },
  {
    id: "bank-charges",
    name: "Bank Charges",
    nameUr: "بینک چارجز",
    type: "expense",
    description: "Fees the bank charges for running the account.",
  },
];

export const ACCOUNT_IDS = ACCOUNTS.map((account) => account.id);
