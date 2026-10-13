/**
 * Short, interactive "why and how" lessons.
 *
 * Each concept a student meets for the first time gets taught *before* the
 * graded levels that use it — exactly like the debit/credit lesson that ships
 * before Chapter 2. The content is written for a first-timer: why the idea
 * exists, how it works, one worked example, and a quick check.
 */

import type { Side } from "@/lib/accounting/types";
import type { ConceptId } from "./concepts";

export type LessonAccent = "gold" | "debit" | "credit" | "good" | "ink";

/** A small static illustration shown inside a lesson step. */
export type LessonVisual =
  | "equation"
  | "journal"
  | "ledger"
  | "trial"
  | "statements";

export interface LessonLine {
  text: string;
  side: Side;
}

export interface LessonQuestion {
  prompt: string;
  options: { label: string; correct: boolean }[];
  explain: string;
}

export interface Lesson {
  slug: string;
  conceptId: ConceptId;
  /** The chapter this lesson belongs to. */
  chapterId: string;
  icon: string;
  accent: LessonAccent;
  /** Small label above the title, e.g. "Why the ledger exists". */
  eyebrow: string;
  title: string;
  /** One line used on the "learn first" card. */
  tagline: string;
  why: { heading: string; body: string; points: string[] };
  how: { heading: string; body: string; points: string[] };
  visual: LessonVisual;
  example: { scenario: string; lines: LessonLine[]; note: string };
  questions: LessonQuestion[];
  next: { href: string; label: string };
}

export const LESSONS: Lesson[] = [
  {
    slug: "accounting-equation",
    conceptId: "accounting-equation",
    chapterId: "ch1",
    icon: "🔺",
    accent: "gold",
    eyebrow: "Why the equation comes first",
    title: "Everything is funded by someone",
    tagline: "Every business owns things and owes things — and the two always match.",
    why: {
      heading: "A business is a simple balance",
      body: "Everything a business owns had to be paid for by someone — either outsiders it owes, or the owner's own money. Write that as one sentence and you have the foundation of accounting.",
      points: [
        "**Assets** — what the business owns: cash, stock, equipment.",
        "**Liabilities** — what it owes to outsiders: loans, unpaid bills.",
        "**Equity** — what is left over for the owner.",
        "This is not a coincidence. The two sides must match, always.",
      ],
    },
    how: {
      heading: "One rule, every transaction",
      body: "Assets = Liabilities + Equity. Every transaction changes at least two of the three, but the equals sign never breaks.",
      points: [
        "Owner invests $100,000 → Cash ↑ and Capital ↑.",
        "Take a $40,000 loan → Cash ↑ and Bank Loan ↑.",
        "Buy $10,000 stock on credit → Inventory ↑ and Payable ↑.",
        "Notice: nothing ever changes on one side alone.",
      ],
    },
    visual: "equation",
    example: {
      scenario: "The owner opens a shop with $100,000 of her own money",
      lines: [
        { text: "Cash (asset) goes up", side: "debit" },
        { text: "Owner's Capital (equity) goes up", side: "credit" },
      ],
      note: "Assets rise by $100,000 and equity rises by the same $100,000 — the equation stays balanced.",
    },
    questions: [
      {
        prompt: "The business buys a $5,000 van on credit. What happens?",
        options: [
          { label: "Assets ↑ and Liabilities ↑", correct: true },
          { label: "Assets ↑ and Equity ↑", correct: false },
          { label: "Liabilities ↑ and Equity ↓", correct: false },
        ],
        explain: "The van is a new asset; the unpaid bill is a new liability. Both sides grow together.",
      },
      {
        prompt: "Which form of the equation is always true?",
        options: [
          { label: "Assets = Liabilities + Equity", correct: true },
          { label: "Assets = Liabilities − Equity", correct: false },
          { label: "Assets + Liabilities = Equity", correct: false },
        ],
        explain: "It holds after every transaction — that is the whole point of double entry.",
      },
    ],
    next: { href: "/learn", label: "Start Chapter 1 ▶" },
  },
  {
    slug: "journal-entries",
    conceptId: "journal-entries",
    chapterId: "ch2",
    icon: "📓",
    accent: "debit",
    eyebrow: "Why journals exist",
    title: "The diary of the business",
    tagline: "Write each transaction once, in a fixed format, so nothing is forgotten.",
    why: {
      heading: "A story needs a notebook",
      body: "A business makes hundreds of transactions. Without a standard record, nobody could rebuild what happened. The journal is that record — the first place every transaction is written down.",
      points: [
        "It is kept in **date order**: a diary, not a summary.",
        "Each entry shows **which accounts moved** and **by how much**.",
        "It is the source document everything else is built from.",
        "A fixed format means any accountant reads it the same way.",
      ],
    },
    how: {
      heading: "Every entry has two sides",
      body: "A journal entry lists the account debited first, the account credited below it, and the amounts — and the two totals must be equal.",
      points: [
        "**Debit** lines first, indented **credit** lines underneath.",
        "Total debits = total credits, always.",
        "A short **narration** explains the story in words.",
        "One transaction = one entry.",
      ],
    },
    visual: "journal",
    example: {
      scenario: "Sold goods for $8,000 cash",
      lines: [
        { text: "Cash (asset) goes up", side: "debit" },
        { text: "Sales Revenue (income) goes up", side: "credit" },
      ],
      note: "Cash grows and income grows. Debits of $8,000 equal credits of $8,000.",
    },
    questions: [
      {
        prompt: "Which entry records “paid $2,000 rent in cash”?",
        options: [
          { label: "Dr Rent Expense, Cr Cash", correct: true },
          { label: "Dr Cash, Cr Rent Expense", correct: false },
          { label: "Dr Rent Expense, Cr Capital", correct: false },
        ],
        explain: "An expense grows on the debit side; cash leaves, so cash is credited.",
      },
      {
        prompt: "In a correctly written journal entry…",
        options: [
          { label: "Total debits equal total credits", correct: true },
          { label: "Debits are always larger", correct: false },
          { label: "Only one account is used", correct: false },
        ],
        explain: "Equal debits and credits is exactly what double entry means.",
      },
    ],
    next: { href: "/lessons/ledger", label: "Next: the ledger →" },
  },
  {
    slug: "ledger",
    conceptId: "ledger-posting",
    chapterId: "ch3",
    icon: "📒",
    accent: "credit",
    eyebrow: "Why the ledger exists",
    title: "One home per account",
    tagline: "The journal tells the story in time; the ledger tells it by account.",
    why: {
      heading: "The journal has a blind spot",
      body: "The journal is in date order. To find how much cash you hold right now, you would have to read every entry ever written. The ledger fixes that by collecting everything for one account in one place.",
      points: [
        "The **journal** answers: what happened?",
        "The **ledger** answers: what is the balance now?",
        "Every account gets its own page — its own **T-account**.",
        "Posting is just copying journal lines into those accounts.",
      ],
    },
    how: {
      heading: "Post, then balance",
      body: "Take each journal line and copy it into its account on the same side. Then net the two sides to find the closing balance.",
      points: [
        "A debit line goes to the debit column of that account.",
        "A credit line goes to the credit column.",
        "Total each column; the difference is the **balance**.",
        "The side with the bigger total is the balance side.",
      ],
    },
    visual: "ledger",
    example: {
      scenario: "Cash: +$100,000 capital in, −$25,000 rent out",
      lines: [
        { text: "Cash debits $100,000", side: "debit" },
        { text: "Cash credits $25,000", side: "credit" },
      ],
      note: "Cash holds $100,000 on the debit side and $25,000 on the credit side — a closing balance of $75,000 Dr.",
    },
    questions: [
      {
        prompt: "What is the ledger for?",
        options: [
          { label: "Showing each account's running balance", correct: true },
          { label: "Replacing the journal", correct: false },
          { label: "Working out tax", correct: false },
        ],
        explain: "The ledger groups all the movements of an account so you can read its balance at a glance.",
      },
      {
        prompt: "Posting a journal line to the ledger means…",
        options: [
          { label: "Copying it to the same side of its account", correct: true },
          { label: "Moving it to the opposite side", correct: false },
          { label: "Deleting it from the journal", correct: false },
        ],
        explain: "Debits post to debit, credits post to credit. The journal itself never changes.",
      },
    ],
    next: { href: "/lessons/trial-balance", label: "Next: the trial balance →" },
  },
  {
    slug: "trial-balance",
    conceptId: "trial-balance",
    chapterId: "ch4",
    icon: "⚖️",
    accent: "good",
    eyebrow: "Why we check before we report",
    title: "The arithmetic health check",
    tagline: "List every balance, add both columns, and prove debits = credits.",
    why: {
      heading: "Reports are only as good as the numbers behind them",
      body: "Before building any statement you want a fast, honest check that the ledger is internally consistent. The trial balance is that check: one list, two columns, two equal totals.",
      points: [
        "It is a **proof of arithmetic**, not a report.",
        "Every account appears with its **closing balance**.",
        "Debit balances go in the debit column, credit balances in the credit column.",
        "Equal totals mean the ledger agrees with itself.",
      ],
    },
    how: {
      heading: "Build it in three steps",
      body: "Read the closing balance from each account, drop it into the correct column, then total both columns.",
      points: [
        "Take each account's closing balance from the ledger.",
        "Put it in the **debit** column if it is a debit balance, otherwise the **credit** column.",
        "Total both columns — they must agree.",
        "A balanced trial balance still cannot catch every error, such as a transaction left out entirely.",
      ],
    },
    visual: "trial",
    example: {
      scenario: "A tiny ledger after three entries",
      lines: [
        { text: "Cash $75,000 → debit column", side: "debit" },
        { text: "Rent Expense $25,000 → debit column", side: "debit" },
        { text: "Capital $100,000 → credit column", side: "credit" },
      ],
      note: "Both columns total $100,000, so the trial balance agrees.",
    },
    questions: [
      {
        prompt: "A trial balance's job is to…",
        options: [
          { label: "Check that debits equal credits", correct: true },
          { label: "Show the profit for the year", correct: false },
          { label: "List the owner's drawings", correct: false },
        ],
        explain: "It is a check on the arithmetic of the ledger before the statements are prepared.",
      },
      {
        prompt: "Which error can a balanced trial balance still hide?",
        options: [
          { label: "A transaction left out completely", correct: true },
          { label: "A debit typed into the credit column", correct: false },
          { label: "A column added up wrongly", correct: false },
        ],
        explain: "Leaving a transaction out, or posting it twice to the same side, keeps the totals equal — the trial balance cannot see it.",
      },
    ],
    next: { href: "/lessons/financial-statements", label: "Next: the financial statements →" },
  },
  {
    slug: "financial-statements",
    conceptId: "financial-statements",
    chapterId: "ch5",
    icon: "🏦",
    accent: "ink",
    eyebrow: "Why the statements exist",
    title: "Two questions, two statements",
    tagline: "Did we make money? What is the business worth?",
    why: {
      heading: "Owners and lenders ask two things",
      body: "After all the bookkeeping, two simple questions matter: was the year profitable, and what is the business worth right now? Each has its own statement.",
      points: [
        "The **income statement** answers: did we make money?",
        "The **balance sheet** answers: what is it worth?",
        "The income statement covers a **period**; the balance sheet is a **snapshot**.",
        "They connect — profit flows into the owner's equity.",
      ],
    },
    how: {
      heading: "From balances to statements",
      body: "Revenue and expense accounts are temporary: they feed the income statement. Asset, liability and equity accounts carry forward to the balance sheet.",
      points: [
        "Income statement: Revenue − Expenses = **Profit** (or loss).",
        "Balance sheet: **Assets = Liabilities + Equity**.",
        "Profit is added to equity on the balance sheet.",
        "Together they tell the whole financial story.",
      ],
    },
    visual: "statements",
    example: {
      scenario: "Revenue $8,000, expenses $6,000, assets $75,000, liabilities $40,000",
      lines: [
        { text: "Revenue $8,000 − Expenses $6,000 = Profit $2,000", side: "credit" },
        { text: "Assets $75,000 = Liabilities $40,000 + Equity $35,000", side: "debit" },
      ],
      note: "The $2,000 profit closes into equity: $40,000 liabilities + $35,000 equity = $75,000 assets.",
    },
    questions: [
      {
        prompt: "Which statement answers “did we make money this year?”",
        options: [
          { label: "The income statement", correct: true },
          { label: "The balance sheet", correct: false },
          { label: "The ledger", correct: false },
        ],
        explain: "Revenue less expenses gives the profit or loss — that is the income statement.",
      },
      {
        prompt: "On the balance sheet, assets always equal…",
        options: [
          { label: "Liabilities + Equity", correct: true },
          { label: "Revenue − Expenses", correct: false },
          { label: "Cash", correct: false },
        ],
        explain: "The equation holds after every transaction, so the balance sheet must always balance.",
      },
    ],
    next: { href: "/learn", label: "Start practising ▶" },
  },
  {
    slug: "adjusting-entries",
    conceptId: "journal-entries",
    chapterId: "ch6",
    icon: "🛠️",
    accent: "debit",
    eyebrow: "Why we adjust at period end",
    title: "Making the period tell the truth",
    tagline: "Match costs and income to the period they belong to — not to when cash moved.",
    why: {
      heading: "Cash and time are not the same thing",
      body: "Some costs and income arrive gradually, or are paid at the wrong moment. Without adjusting, a period's profit can be badly wrong even though every entry so far was correct.",
      points: [
        "Wages earned this month but paid next month are a cost **now**.",
        "Rent paid in advance is not this month's expense — it is still an asset.",
        "Equipment wears out a little every month. That is **depreciation**.",
        "Adjusting entries move amounts into the period that earned them.",
      ],
    },
    how: {
      heading: "Four adjustments cover most of it",
      body: "Every adjustment is still an ordinary journal entry — debits equal credits, same rules as always.",
      points: [
        "**Accrual** — cost incurred, not yet paid → Dr Expense, Cr Payable.",
        "**Prepayment** — paid ahead → the unused part stays an asset.",
        "**Depreciation** — Dr Depreciation Expense, Cr Accumulated Depreciation.",
        "**Unearned income** — cash received but not yet earned → a liability, not income.",
      ],
    },
    visual: "journal",
    example: {
      scenario: "Wages earned this month, paid next month: $4,000",
      lines: [
        { text: "Wages Expense (cost) goes up", side: "debit" },
        { text: "Wages Payable (liability) goes up", side: "credit" },
      ],
      note: "The cost lands in the period that used the labour, even though no cash has moved yet.",
    },
    questions: [
      {
        prompt: "Rent paid this month for next month is…",
        options: [
          { label: "An asset (prepaid rent) until next month", correct: true },
          { label: "This month's expense", correct: false },
          { label: "Owner's drawings", correct: false },
        ],
        explain: "The benefit belongs to next month, so it sits as an asset until that period uses it.",
      },
      {
        prompt: "A depreciation entry records…",
        options: [
          { label: "The part of an asset used up this period", correct: true },
          { label: "A cash payment", correct: false },
          { label: "The asset's full cost at once", correct: false },
        ],
        explain: "Depreciation spreads an asset's cost across the periods that benefit from it.",
      },
    ],
    next: { href: "/lessons/financial-statements", label: "See the financial statements →" },
  },
];

export const LESSON_BY_SLUG = Object.fromEntries(LESSONS.map((lesson) => [lesson.slug, lesson]));

export function lessonForChapter(chapterId: string): Lesson | undefined {
  return LESSONS.find((lesson) => lesson.chapterId === chapterId);
}

export function lessonForConcept(conceptId: ConceptId): Lesson | undefined {
  return LESSONS.find((lesson) => lesson.conceptId === conceptId);
}
