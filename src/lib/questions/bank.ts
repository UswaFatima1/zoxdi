/**
 * The generated half of the question bank.
 *
 * Rather than hand-writing hundreds of near-identical questions, the bank is
 * *derived* from the same content the rest of the app trusts — the chart of
 * accounts and the transaction bank — so every generated question is correct by
 * construction and can never drift out of step with what is taught. All
 * randomness is seeded, so a given question id always shows the same figures on
 * the server and in the browser.
 */

import { ACCOUNTS } from "@/data/accounting/accounts";
import { TRANSACTIONS } from "@/data/accounting/transactions";
import { formatMoney } from "@/lib/accounting/engine";
import {
  ACCOUNT_TYPE_LABEL,
  ACCOUNT_TYPES,
  NORMAL_BALANCE,
  opposite,
} from "@/lib/accounting/rules";
import type { EntryLine, Side } from "@/lib/accounting/types";
import { ADVANCED_QUESTIONS } from "./advanced";
import type { BankOption, BankQuestion, Difficulty } from "./types";

export * from "./types";

const SIDE_WORD: Record<Side, string> = { debit: "debit", credit: "credit" };
const LETTERS = ["a", "b", "c", "d"] as const;

/* ── Deterministic helpers ─────────────────────────────────────────────── */

function hashString(input: string): number {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed: number): () => number {
  let state = seed;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

const rngFor = (key: string) => mulberry32(hashString(key));

function intBetween(random: () => number, min: number, max: number): number {
  return min + Math.floor(random() * (max - min + 1));
}

function pick<T>(items: T[], random: () => number): T {
  return items[Math.floor(random() * items.length)] as T;
}

function shuffle<T>(items: T[], random: () => number): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [copy[index], copy[swap]] = [copy[swap], copy[index]];
  }
  return copy;
}

const money = (amount: number) => `$${formatMoney(amount)}`;
const accountOf = (id: string) => ACCOUNTS.find((account) => account.id === id);

/** Build up to four unique options, with the correct one placed stably. */
function buildOptions(
  seed: string,
  correctLabel: string,
  distractors: string[],
): { options: BankOption[]; correctOptionId: string } {
  const labels = [correctLabel];
  for (const distractor of distractors) {
    if (labels.length >= 4) break;
    if (!labels.includes(distractor)) labels.push(distractor);
  }
  const shuffled = shuffle(labels, rngFor(`${seed}:options`));
  const options: BankOption[] = shuffled.map((label, index) => ({
    id: LETTERS[index],
    label,
  }));
  const correctOptionId =
    options.find((option) => option.label === correctLabel)?.id ?? options[0].id;
  return { options, correctOptionId };
}

/* ── Generators ────────────────────────────────────────────────────────── */

/** Which of the five types is this account? */
function classifyQuestions(): BankQuestion[] {
  return ACCOUNTS.map((account) => ({
    id: `bank-classify-${account.id}`,
    topic: "Account types",
    difficulty: "easy",
    prompt: `Which type of account is ${account.name}?`,
    options: ACCOUNT_TYPES.map((type) => ({ id: type, label: ACCOUNT_TYPE_LABEL[type] })),
    correctOptionId: account.type,
    explanation: `${account.name} is ${ACCOUNT_TYPE_LABEL[
      account.type
    ].toLowerCase()}. ${account.description}`,
    conceptIds: ["account-classification"],
  }));
}

/** Which side increases this account? */
function normalSideQuestions(): BankQuestion[] {
  return ACCOUNTS.map((account) => {
    const side = account.normalBalance ?? NORMAL_BALANCE[account.type];
    const article = /^[aeiou]/i.test(account.type) ? "an" : "a";
    return {
      id: `bank-normal-${account.id}`,
      topic: "Debit & credit",
      difficulty: "easy" as Difficulty,
      prompt: `On which side does ${account.name} increase?`,
      options: [
        { id: "debit", label: "Debit" },
        { id: "credit", label: "Credit" },
      ],
      correctOptionId: side,
      explanation: account.normalBalance
        ? `${account.name} is the exception that proves the rule: it is a contra account, so it grows on the ${SIDE_WORD[side]} side — the opposite of a normal ${account.type}.`
        : `${account.name} is ${article} ${account.type}. ${ACCOUNT_TYPE_LABEL[account.type]} accounts increase on the ${SIDE_WORD[side]} side.`,
      conceptIds: ["debit-credit-rules"],
    };
  });
}

/** Which side decreases this account? */
function decreaseSideQuestions(): BankQuestion[] {
  return ACCOUNTS.map((account) => {
    const increases = account.normalBalance ?? NORMAL_BALANCE[account.type];
    const decreases = opposite(increases);
    return {
      id: `bank-decrease-${account.id}`,
      topic: "Debit & credit",
      difficulty: "medium" as Difficulty,
      prompt: `To record a fall in ${account.name}, which side is used?`,
      options: [
        { id: "debit", label: "Debit" },
        { id: "credit", label: "Credit" },
      ],
      correctOptionId: decreases,
      explanation: `${account.name} increases on the ${SIDE_WORD[increases]} side, so it decreases on the ${SIDE_WORD[decreases]} side. Every account moves between exactly two sides.`,
      conceptIds: ["debit-credit-rules"],
    };
  });
}

/** Income statement or balance sheet? */
function statementQuestions(): BankQuestion[] {
  return ACCOUNTS.map((account) => {
    const onIncome = account.type === "revenue" || account.type === "expense";
    return {
      id: `bank-statement-${account.id}`,
      topic: "Financial statements",
      difficulty: "easy" as Difficulty,
      prompt: `On which statement does ${account.name} appear?`,
      options: [
        { id: "is", label: "Income statement" },
        { id: "bs", label: "Balance sheet" },
      ],
      correctOptionId: onIncome ? "is" : "bs",
      explanation: onIncome
        ? `${account.name} is ${account.type === "revenue" ? "revenue" : "an expense"}, which measures performance over a period — so it belongs to the income statement.`
        : `${account.name} is ${
            ACCOUNT_TYPE_LABEL[account.type].toLowerCase().startsWith("a") ||
            ACCOUNT_TYPE_LABEL[account.type].toLowerCase().startsWith("e")
              ? "an"
              : "a"
          } ${ACCOUNT_TYPE_LABEL[account.type].toLowerCase()}, a balance carried at a moment in time — so it belongs to the balance sheet.`,
      conceptIds: ["financial-statements"],
    };
  });
}

/** Balance a T-account from its two column totals. */
function balanceQuestions(count: number, difficultyFor: (index: number) => Difficulty): BankQuestion[] {
  const questions: BankQuestion[] = [];
  for (let index = 0; index < count; index += 1) {
    const seed = `bank-balance-${index}`;
    const random = rngFor(seed);
    const account = pick(ACCOUNTS, random);
    const difficulty = difficultyFor(index);
    const maxLines = difficulty === "hard" ? 4 : 3;

    const debitAmounts = Array.from(
      { length: intBetween(random, 1, maxLines) },
      () => intBetween(random, 1, 40) * 5000,
    );
    const creditAmounts = Array.from(
      { length: intBetween(random, 1, maxLines) },
      () => intBetween(random, 1, 40) * 5000,
    );
    let totalDebit = debitAmounts.reduce((sum, value) => sum + value, 0);
    let totalCredit = creditAmounts.reduce((sum, value) => sum + value, 0);
    if (totalDebit === totalCredit) {
      totalCredit += 5000;
    }
    const side: Side = totalDebit > totalCredit ? "debit" : "credit";
    const other: Side = opposite(side);
    const balance = Math.abs(totalDebit - totalCredit);
    const larger = Math.max(totalDebit, totalCredit);
    const correctLabel = `${money(balance)} on the ${SIDE_WORD[side]} side`;
    const { options, correctOptionId } = buildOptions(seed, correctLabel, [
      `${money(balance)} on the ${SIDE_WORD[other]} side`,
      `${money(larger)} on the ${SIDE_WORD[side]} side`,
      `${money(totalDebit + totalCredit)} on the ${SIDE_WORD[side]} side`,
    ]);

    questions.push({
      id: seed,
      topic: "Balancing accounts",
      difficulty,
      prompt: `${account.name} shows debits of ${money(totalDebit)} and credits of ${money(
        totalCredit,
      )}. What is its closing balance, and on which side does it sit?`,
      options,
      correctOptionId,
      explanation: `${account.name} debits total ${money(totalDebit)} and credits total ${money(
        totalCredit,
      )}. The larger column sets the side — ${SIDE_WORD[side]} — and the gap, ${money(
        balance,
      )}, is the closing balance.`,
      conceptIds: ["ledger-posting"],
    });
  }
  return questions;
}

/** Revenue less expenses — profit or loss? */
function profitQuestions(count: number, difficultyFor: (index: number) => Difficulty): BankQuestion[] {
  const questions: BankQuestion[] = [];
  for (let index = 0; index < count; index += 1) {
    const seed = `bank-profit-${index}`;
    const random = rngFor(seed);
    const revenue = intBetween(random, 3, 20) * 10000;
    let expenses = intBetween(random, 2, 18) * 10000;
    if (expenses === revenue) expenses += 10000;
    const profit = revenue - expenses;
    const correctLabel =
      profit >= 0 ? `A profit of ${money(profit)}` : `A loss of ${money(-profit)}`;

    const { options, correctOptionId } = buildOptions(seed, correctLabel, [
      profit >= 0 ? `A loss of ${money(profit)}` : `A profit of ${money(-profit)}`,
      `A profit of ${money(revenue)}`,
      `A loss of ${money(revenue + expenses)}`,
    ]);

    questions.push({
      id: seed,
      topic: "Profit & loss",
      difficulty: difficultyFor(index),
      prompt: `For a period, revenue is ${money(revenue)} and total expenses are ${money(
        expenses,
      )}. What is the result for the period?`,
      options,
      correctOptionId,
      explanation: `Profit = revenue − expenses = ${money(revenue)} − ${money(expenses)} = ${money(
        Math.abs(profit),
      )}, so the period ends in ${profit >= 0 ? "a profit" : "a loss"}.`,
      conceptIds: ["financial-statements"],
    });
  }
  return questions;
}

/** Fill in the missing figure from A = L + E. */
function equationQuestions(count: number, difficultyFor: (index: number) => Difficulty): BankQuestion[] {
  const questions: BankQuestion[] = [];
  for (let index = 0; index < count; index += 1) {
    const seed = `bank-equation-${index}`;
    const random = rngFor(seed);
    const liabilities = intBetween(random, 1, 20) * 10000;
    const equity = intBetween(random, 1, 20) * 10000;
    const assets = liabilities + equity;
    const unknown = pick(["assets", "liabilities", "equity"] as const, random);

    let prompt: string;
    let correctLabel: string;
    let distractors: string[];
    let explanation: string;

    if (unknown === "assets") {
      prompt = `Using Assets = Liabilities + Equity, what are total assets when liabilities are ${money(
        liabilities,
      )} and equity is ${money(equity)}?`;
      correctLabel = money(assets);
      distractors = [money(liabilities), money(equity), money(Math.abs(liabilities - equity))];
      explanation = `Assets = liabilities + equity = ${money(liabilities)} + ${money(
        equity,
      )} = ${money(assets)}.`;
    } else if (unknown === "liabilities") {
      prompt = `Using Assets = Liabilities + Equity, what are total liabilities when assets are ${money(
        assets,
      )} and equity is ${money(equity)}?`;
      correctLabel = money(liabilities);
      distractors = [money(assets), money(equity), money(assets + equity)];
      explanation = `Liabilities = assets − equity = ${money(assets)} − ${money(
        equity,
      )} = ${money(liabilities)}.`;
    } else {
      prompt = `Using Assets = Liabilities + Equity, what is total equity when assets are ${money(
        assets,
      )} and liabilities are ${money(liabilities)}?`;
      correctLabel = money(equity);
      distractors = [money(assets), money(liabilities), money(assets + liabilities)];
      explanation = `Equity = assets − liabilities = ${money(assets)} − ${money(
        liabilities,
      )} = ${money(equity)}.`;
    }

    const { options, correctOptionId } = buildOptions(seed, correctLabel, distractors);
    questions.push({
      id: seed,
      topic: "Accounting equation",
      difficulty: difficultyFor(index),
      prompt,
      options,
      correctOptionId,
      explanation,
      conceptIds: ["accounting-equation"],
    });
  }
  return questions;
}

/** The net effect of a real transaction on assets, liabilities or equity. */
function effectOf(transaction: (typeof TRANSACTIONS)[number], kind: "assets" | "liabilities" | "equity"): number {
  let delta = 0;
  for (const line of transaction.expected) {
    const account = accountOf(line.accountId);
    if (!account) continue;
    const counts =
      kind === "assets"
        ? account.type === "asset"
        : kind === "liabilities"
          ? account.type === "liability"
          : account.type === "equity" ||
            account.type === "revenue" ||
            account.type === "expense";
    if (!counts) continue;
    // Equity rises on the credit side; an expense is a debit that reduces it,
    // which the same "credit − debit" sign handles automatically.
    delta += line.side === "debit" ? line.amount : -line.amount;
  }
  return delta;
}

function effectQuestions(): BankQuestion[] {
  const kinds: ("assets" | "liabilities" | "equity")[] = ["assets", "liabilities", "equity"];
  const questions: BankQuestion[] = [];
  for (const transaction of TRANSACTIONS) {
    for (const kind of kinds) {
      const id = `bank-effect-${transaction.id}-${kind}`;
      const delta = effectOf(transaction, kind);
      const amount = Math.abs(delta);
      const direction = delta > 0 ? "Increase" : "Decrease";
      const correctLabel =
        delta === 0 ? `No change in total ${kind}` : `${direction} by ${money(amount)}`;
      const fallback = transaction.amount || 10000;
      const distractors =
        delta === 0
          ? [
              `Increase by ${money(fallback)}`,
              `Decrease by ${money(fallback)}`,
              `Increase by ${money(fallback * 2)}`,
            ]
          : [
              `${delta > 0 ? "Decrease" : "Increase"} by ${money(amount)}`,
              `No change in total ${kind}`,
              `${direction} by ${money(amount + 5000)}`,
            ];
      const { options, correctOptionId } = buildOptions(id, correctLabel, distractors);
      questions.push({
        id,
        topic: "Effect on the equation",
        difficulty: "medium",
        prompt: `${transaction.scenario} What is the effect on total ${kind}?`,
        options,
        correctOptionId,
        explanation:
          delta === 0
            ? `Nothing happens to total ${kind}: the transaction moves value between accounts of the same kind, so the ${kind} total is unchanged.`
            : `Total ${kind} ${delta > 0 ? "rise" : "fall"} by ${money(
                amount,
              )}. That is the net change once every line of the entry is taken into account.`,
        conceptIds: ["accounting-equation"],
      });
    }
  }
  return questions;
}

function entryLabel(lines: EntryLine[]): string {
  return lines
    .map(
      (line) =>
        `${line.side === "debit" ? "Dr" : "Cr"} ${accountOf(line.accountId)?.name ?? line.accountId} ${money(
          line.amount,
        )}`,
    )
    .join("; ");
}

/** Which journal entry records this event? */
function entryQuestions(): BankQuestion[] {
  return TRANSACTIONS.map((transaction) => {
    const id = `bank-entry-${transaction.id}`;
    const expected = transaction.expected;
    const correctLabel = entryLabel(expected);
    const flipped = entryLabel(expected.map((line) => ({ ...line, side: opposite(line.side) })));
    const oneLineFlipped = entryLabel([
      { ...expected[0], side: opposite(expected[0].side) },
      ...expected.slice(1),
    ]);
    const swapTarget = transaction.accountIds.filter(
      (accountId) => !expected.some((line) => line.accountId === accountId),
    )[0];
    const swapped = swapTarget
      ? entryLabel([{ ...expected[0], accountId: swapTarget }, ...expected.slice(1)])
      : flipped;

    const difficulty: Difficulty =
      transaction.difficulty === 1 ? "easy" : transaction.difficulty === 2 ? "medium" : "hard";

    const { options, correctOptionId } = buildOptions(id, correctLabel, [
      flipped,
      swapped,
      oneLineFlipped,
    ]);

    return {
      id,
      topic: "Journal entries",
      difficulty,
      prompt: `Which entry records this? “${transaction.scenario}”`,
      options,
      correctOptionId,
      explanation: `${transaction.narration ?? "This entry"}: ${correctLabel}. Every entry keeps debits equal to credits, and each account moves on its normal side for its type.`,
      conceptIds: ["journal-entries", "double-entry"],
    } satisfies BankQuestion;
  });
}

/* ── The assembled bank ────────────────────────────────────────────────── */

const alternate = (first: Difficulty, second: Difficulty) => (index: number): Difficulty =>
  index % 2 === 0 ? first : second;

export const QUESTION_BANK: BankQuestion[] = [
  ...classifyQuestions(),
  ...normalSideQuestions(),
  ...decreaseSideQuestions(),
  ...statementQuestions(),
  ...balanceQuestions(150, alternate("medium", "hard")),
  ...profitQuestions(90, alternate("easy", "medium")),
  ...equationQuestions(70, alternate("easy", "medium")),
  ...effectQuestions(),
  ...entryQuestions(),
  ...ADVANCED_QUESTIONS,
];

export const BANK_SIZE = QUESTION_BANK.length;

export const BANK_TOPICS: string[] = Array.from(
  new Set(QUESTION_BANK.map((question) => question.topic)),
).sort();

export function questionsByDifficulty(difficulty: Difficulty): BankQuestion[] {
  return QUESTION_BANK.filter((question) => question.difficulty === difficulty);
}

export function countByDifficulty(): Record<Difficulty, number> {
  return QUESTION_BANK.reduce(
    (counts, question) => {
      counts[question.difficulty] += 1;
      return counts;
    },
    { easy: 0, medium: 0, hard: 0, expert: 0 } as Record<Difficulty, number>,
  );
}

/** Draw a shuffled run of questions, optionally filtered, deterministically. */
export function drawQuestions(params: {
  difficulty?: Difficulty | "all";
  topic?: string;
  count?: number;
  seed?: string;
}): BankQuestion[] {
  const { difficulty = "all", topic, count = 10, seed = "run" } = params;
  let pool = QUESTION_BANK;
  if (difficulty !== "all") pool = pool.filter((question) => question.difficulty === difficulty);
  if (topic) pool = pool.filter((question) => question.topic === topic);

  const random = rngFor(`${seed}:${difficulty}:${topic ?? "any"}`);
  const shuffled = shuffle(pool, random).slice(0, Math.min(count, pool.length));
  return shuffled.map((question) => ({
    ...question,
    options: shuffle(question.options, random),
  }));
}

export type { BankOption, BankQuestion, Difficulty };
