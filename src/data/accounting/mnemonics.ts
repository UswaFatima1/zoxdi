/**
 * Pocket mnemonics for a quick review between sessions. These are the classic
 * memory hooks every accounting student meets; the deck is deliberately small so
 * the whole thing can be flipped through in under a minute.
 */

export interface MnemonicCard {
  id: string;
  /** The hook shown on the front of the card. */
  front: string;
  /** What the hook means. */
  back: string;
  /** The why behind it, so the mnemonic is a bridge, not a crutch. */
  note: string;
}

export const MNEMONIC_CARDS: MnemonicCard[] = [
  {
    id: "dead-clic",
    front: "DEAD CLIC",
    back: "Debits: Dividends, Expenses, Assets, Drawings · Credits: Liabilities, Income, Capital",
    note: "DEAD CLIC lists what grows on each side. Assets and expenses grow on the debit side; liabilities, income and the owner's capital grow on the credit side.",
  },
  {
    id: "deal",
    front: "DEAL",
    back: "Debits: Dividends (Drawings), Expenses, Assets",
    note: "The debit half of DEAD CLIC. If an account is one of these three, it increases on the debit side.",
  },
  {
    id: "girls",
    front: "GIRLS",
    back: "Credits: Gains, Income, Revenue, Liabilities, Shareholders' equity",
    note: "The credit half. Gains, income and revenue are all credit balances, and so are liabilities and equity.",
  },
  {
    id: "equation",
    front: "A = L + E",
    back: "Assets = Liabilities + Equity",
    note: "Every transaction keeps this true. What the business owns always equals what it owes plus what the owner has in it.",
  },
  {
    id: "profit",
    front: "Profit = Revenue − Expenses",
    back: "Income − the costs of earning it = what the owner keeps",
    note: "A positive answer is a profit; a negative one is a loss. Either way the trial balance still balances — that's not what it tests.",
  },
  {
    id: "contra",
    front: "Drawings is equity… but debits",
    back: "Contra accounts flip their type's normal side",
    note: "Drawings removes value from equity, so it behaves like an expense: it grows on the debit side even though it belongs to equity.",
  },
  {
    id: "trial",
    front: "Debits = Credits",
    back: "A trial balance only proves the columns agree",
    note: "It catches one-sided postings and mis-added columns, but it can't catch an entire missing transaction — both columns stay equal and wrong.",
  },
  {
    id: "unearned",
    front: "Money before work = a liability",
    back: "Unearned revenue is a promise until the goods are delivered",
    note: "Cash arrives and is debited; Unearned Revenue is credited because the business still owes the customer. Only later does it become real revenue.",
  },
];
