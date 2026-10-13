import type { Transaction } from "./types";

/**
 * The transaction bank for the vertical slice.
 *
 * Every transaction records the accounts the game expects, so no UI component
 * ever contains an accounting answer — content and behaviour stay separate.
 * Some transactions note simplifying assumptions in `explanation`, such as a
 * cash sale recorded without its matching cost-of-goods-sold entry, because
 * the level is teaching one idea at a time.
 */
export const TRANSACTIONS: Transaction[] = [
  {
    id: "t-capital-investment",
    scenario:
      "First day! Alex opens Zoxdi Traders and invests their own savings of $500,000 in cash into the business.",
    amount: 500000,
    currency: "USD",
    accountIds: ["cash", "capital", "bank", "sales-revenue", "accounts-payable"],
    expected: [
      { accountId: "cash", side: "debit", amount: 500000 },
      { accountId: "capital", side: "credit", amount: 500000 },
    ],
    narration: "Cash brought in by the owner",
    difficulty: 1,
  },
  {
    id: "t-buy-inventory-cash",
    scenario:
      "Zoxdi Traders buys inventory worth $120,000 and pays for it immediately in cash.",
    amount: 120000,
    currency: "USD",
    accountIds: ["inventory", "cash", "accounts-payable", "capital", "rent-expense"],
    expected: [
      { accountId: "inventory", side: "debit", amount: 120000 },
      { accountId: "cash", side: "credit", amount: 120000 },
    ],
    narration: "Inventory purchased for cash",
    difficulty: 1,
  },
  {
    id: "t-buy-inventory-credit",
    scenario:
      "Zoxdi Traders buys inventory worth $60,000 from a supplier on credit. The payment is due next month.",
    amount: 60000,
    currency: "USD",
    accountIds: ["inventory", "accounts-payable", "cash", "capital", "sales-revenue"],
    expected: [
      { accountId: "inventory", side: "debit", amount: 60000 },
      { accountId: "accounts-payable", side: "credit", amount: 60000 },
    ],
    narration: "Inventory purchased on credit",
    difficulty: 2,
  },
  {
    id: "t-pay-rent",
    scenario:
      "Zoxdi Traders pays $25,000 in cash for this month's shop rent.",
    amount: 25000,
    currency: "USD",
    accountIds: ["rent-expense", "cash", "bank", "capital", "inventory"],
    expected: [
      { accountId: "rent-expense", side: "debit", amount: 25000 },
      { accountId: "cash", side: "credit", amount: 25000 },
    ],
    narration: "Monthly shop rent paid",
    difficulty: 1,
  },
  {
    id: "t-cash-sale",
    scenario:
      "Zoxdi Traders sells goods for $45,000 and receives cash on the spot.",
    amount: 45000,
    currency: "USD",
    accountIds: ["cash", "sales-revenue", "inventory", "capital", "accounts-receivable"],
    expected: [
      { accountId: "cash", side: "debit", amount: 45000 },
      { accountId: "sales-revenue", side: "credit", amount: 45000 },
    ],
    narration: "Goods sold for cash",
    difficulty: 2,
  },
  {
    id: "t-credit-sale",
    scenario:
      "Zoxdi Traders sells goods for $30,000 to a customer who will pay next week.",
    amount: 30000,
    currency: "USD",
    accountIds: ["accounts-receivable", "sales-revenue", "cash", "accounts-payable", "capital"],
    expected: [
      { accountId: "accounts-receivable", side: "debit", amount: 30000 },
      { accountId: "sales-revenue", side: "credit", amount: 30000 },
    ],
    narration: "Goods sold on credit",
    difficulty: 2,
  },
  {
    id: "t-customer-pays",
    scenario:
      "The customer who bought goods on credit last week now pays the $30,000 they owed, in cash.",
    amount: 30000,
    currency: "USD",
    accountIds: ["cash", "accounts-receivable", "sales-revenue", "capital", "accounts-payable"],
    expected: [
      { accountId: "cash", side: "debit", amount: 30000 },
      { accountId: "accounts-receivable", side: "credit", amount: 30000 },
    ],
    narration: "Receipt from credit customer",
    difficulty: 2,
  },
  {
    id: "t-bank-deposit",
    scenario:
      "Zoxdi Traders takes $300,000 in shop cash and deposits it into the business bank account.",
    amount: 300000,
    currency: "USD",
    accountIds: ["bank", "cash", "capital", "equipment", "bank-loan"],
    expected: [
      { accountId: "bank", side: "debit", amount: 300000 },
      { accountId: "cash", side: "credit", amount: 300000 },
    ],
    narration: "Cash banked",
    difficulty: 1,
  },
  {
    id: "t-pay-supplier",
    scenario:
      "Zoxdi Traders pays the supplier $60,000 it owed for the inventory bought on credit earlier.",
    amount: 60000,
    currency: "USD",
    accountIds: ["accounts-payable", "cash", "inventory", "capital", "rent-expense"],
    expected: [
      { accountId: "accounts-payable", side: "debit", amount: 60000 },
      { accountId: "cash", side: "credit", amount: 60000 },
    ],
    narration: "Supplier paid",
    difficulty: 2,
  },
  {
    id: "t-drawings",
    scenario:
      "Alex takes $10,000 in cash out of the business to spend on a family occasion.",
    amount: 10000,
    currency: "USD",
    accountIds: ["drawings", "cash", "capital", "rent-expense", "inventory"],
    expected: [
      { accountId: "drawings", side: "debit", amount: 10000 },
      { accountId: "cash", side: "credit", amount: 10000 },
    ],
    narration: "Owner's drawings",
    difficulty: 3,
  },
  {
    id: "t-bank-loan",
    scenario:
      "Zoxdi Traders takes a $200,000 loan from the bank and receives the cash today.",
    amount: 200000,
    currency: "USD",
    accountIds: ["cash", "bank-loan", "capital", "sales-revenue", "bank"],
    expected: [
      { accountId: "cash", side: "debit", amount: 200000 },
      { accountId: "bank-loan", side: "credit", amount: 200000 },
    ],
    narration: "Cash borrowed from bank",
    difficulty: 2,
  },
  {
    id: "t-advance-from-customer",
    scenario:
      "A customer pays $15,000 in advance for goods Zoxdi Traders will deliver next month.",
    amount: 15000,
    currency: "USD",
    accountIds: ["cash", "unearned-revenue", "sales-revenue", "accounts-receivable", "capital"],
    expected: [
      { accountId: "cash", side: "debit", amount: 15000 },
      { accountId: "unearned-revenue", side: "credit", amount: 15000 },
    ],
    narration: "Advance received from customer",
    difficulty: 3,
  },
  {
    id: "t-accrue-wages",
    scenario:
      "Staff have worked all week but will be paid next Friday. The wages earned but not yet paid are $30,000.",
    amount: 30000,
    currency: "USD",
    accountIds: [
      "salaries-expense",
      "salaries-payable",
      "cash",
      "accounts-payable",
      "capital",
    ],
    expected: [
      { accountId: "salaries-expense", side: "debit", amount: 30000 },
      { accountId: "salaries-payable", side: "credit", amount: 30000 },
    ],
    narration: "Wages accrued (earned, not yet paid)",
    difficulty: 3,
  },
  {
    id: "t-prepay-rent",
    scenario:
      "Zoxdi Traders pays $60,000 now to cover the next three months of shop rent in advance.",
    amount: 60000,
    currency: "USD",
    accountIds: ["prepaid-rent", "cash", "rent-expense", "bank", "capital"],
    expected: [
      { accountId: "prepaid-rent", side: "debit", amount: 60000 },
      { accountId: "cash", side: "credit", amount: 60000 },
    ],
    narration: "Rent paid in advance",
    difficulty: 3,
  },
  {
    id: "t-write-off-bad-debt",
    scenario:
      "A customer who owed $8,000 has gone out of business; the debt will never be paid and is written off.",
    amount: 8000,
    currency: "USD",
    accountIds: ["bad-debts", "accounts-receivable", "cash", "sales-revenue", "capital"],
    expected: [
      { accountId: "bad-debts", side: "debit", amount: 8000 },
      { accountId: "accounts-receivable", side: "credit", amount: 8000 },
    ],
    narration: "Bad debt written off",
    difficulty: 3,
  },
];

export const TRANSACTION_BY_ID = Object.fromEntries(
  TRANSACTIONS.map((transaction) => [transaction.id, transaction]),
);
