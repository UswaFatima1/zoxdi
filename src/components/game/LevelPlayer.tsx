"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ACCOUNTS } from "@/data/accounting/accounts";
import {
  LEVEL_BY_ID,
  LEVELS,
  TRANSACTION_BY_ID,
  type BalanceLevel,
  type ClassifyLevel,
  type EffectLevel,
  type ForgeLevel,
  type Level,
  type QuizLevel,
  type SortLevel,
  type Transaction,
  type TrialLevel,
} from "@/data/accounting";
import { equationDelta, findAccount } from "@/lib/accounting/engine";
import type { AccountType, EntryLine, Side } from "@/lib/accounting/types";
import { ACCOUNT_TYPE_BLURB, ACCOUNT_TYPE_LABEL } from "@/lib/accounting/rules";
import { CONCEPT_ORDER } from "@/lib/learning/concepts";
import { diagnoseAccountTypeChoice, diagnoseEntry } from "@/lib/learning/diagnose";
import { applyAttemptToConcepts } from "@/lib/learning/mastery";
import { misconceptionFor } from "@/lib/learning/misconceptions";
import { isLevelUnlocked } from "@/lib/learning/path";
import { xpForLevel } from "@/lib/learning/xp";
import { levelRewards, type LevelRewards } from "@/lib/learning/rewards";
import { t } from "@/lib/i18n";
import { advanceStreak, localDayKey } from "@/lib/storage/progress";
import { useProgressContext } from "@/lib/storage/ProgressContext";
import { FeedbackPanel, type Correction } from "@/components/learning/FeedbackPanel";
import { HintPanel } from "@/components/learning/HintPanel";
import { TransactionPanel } from "@/components/game/TransactionPanel";
import { ForgeBuilder } from "@/components/game/ForgeBuilder";
import { ChoiceList } from "@/components/game/ChoiceList";
import { AccountBalanceTask } from "@/components/game/AccountBalanceTask";
import { TrialBalanceTask } from "@/components/game/TrialBalanceTask";
import { BucketSortTask } from "@/components/game/BucketSortTask";
import { TYPE_STYLES } from "@/components/game/AccountCard";
import type { ConceptId } from "@/lib/learning/concepts";
import { formatMoney } from "@/lib/accounting/engine";
import { playSfx } from "@/lib/fx/sound";
import { Confetti } from "@/components/fx/Confetti";

const MODE_PROMPT: Record<Level["mode"], string> = {
  forge: "Build the journal entry",
  classify: "Classify this account",
  effect: "Choose the effect on the equation",
  balance: "Find the closing balance",
  trial: "Build the trial balance",
  sort: "Sort each item",
  quiz: "Choose the best answer",
};

export interface LevelCheck {
  correct: boolean;
  headline: string;
  detail: string;
  remedy: string;
  tags: string[];
  conceptIds: ConceptId[];
  tAccounts?: EntryLine[];
  delta?: ReturnType<typeof equationDelta> | null;
  /** XP granted the first time this level was completed (0 on replays). */
  xpAward?: number;
  correction?: Correction;
  /** Badges and titles earned by clearing this level. */
  rewards?: LevelRewards;
}

/** Difficulty drives XP; it is derived from the mode and the content. */
function levelDifficulty(level: Level): number {
  switch (level.mode) {
    case "forge":
      return TRANSACTION_BY_ID[level.transactionId]?.difficulty ?? 2;
    case "classify":
      return 1;
    case "effect":
    case "quiz":
    case "balance":
      return 2;
    case "trial":
    case "sort":
      return 3;
  }
}

function transactionFor(level: Level): Transaction | null {
  switch (level.mode) {
    case "forge":
    case "effect":
      return TRANSACTION_BY_ID[level.transactionId];
    case "classify": {
      const account = findAccount(ACCOUNTS, level.accountId);
      return {
        id: `classify-${level.accountId}`,
        scenario: `Look at the account named "${account.name}". What kind of account is it?`,
        amount: 0,
        currency: "USD",
        accountIds: [account.id],
        expected: [],
        difficulty: 1,
      };
    }
    default:
      return null;
  }
}

function checkForge(level: ForgeLevel, lines: EntryLine[]): LevelCheck | null {
  const transaction = TRANSACTION_BY_ID[level.transactionId];
  if (lines.length === 0) return null;
  const diagnosis = diagnoseEntry(lines, transaction.expected, ACCOUNTS);
  return {
    correct: diagnosis.validation.correct,
    headline: diagnosis.headline,
    detail: diagnosis.detail,
    remedy: diagnosis.remedy,
    tags: diagnosis.tags,
    conceptIds: diagnosis.conceptIds.length > 0 ? diagnosis.conceptIds : level.conceptIds,
    tAccounts: diagnosis.validation.correct ? transaction.expected : undefined,
    delta: diagnosis.validation.correct
      ? equationDelta(ACCOUNTS, transaction.expected)
      : null,
  };
}

function checkClassify(level: ClassifyLevel, chosen: AccountType | null): LevelCheck | null {
  if (!chosen) return null;
  const account = findAccount(ACCOUNTS, level.accountId);
  const choice = diagnoseAccountTypeChoice(chosen, account.type);
  if (choice.correct) {
    const article = /^[aeiou]/i.test(ACCOUNT_TYPE_LABEL[account.type]) ? "an" : "a";
    return {
      correct: true,
      headline: `Correct — ${account.name} is ${article} ${ACCOUNT_TYPE_LABEL[account.type]}`,
      detail: account.description,
      remedy: "",
      tags: [],
      conceptIds: ["account-classification"],
      delta: null,
    };
  }
  const misconception = misconceptionFor(choice.tag ?? "account-substitution");
  return {
    correct: false,
    headline: misconception.label,
    detail: `${account.name} is ${
      ACCOUNT_TYPE_LABEL[account.type]
    }: ${ACCOUNT_TYPE_BLURB[account.type].toLowerCase()} ${misconception.explanation}`,
    remedy: misconception.remedy,
    tags: choice.tag ? [choice.tag] : [],
    conceptIds: ["account-classification"],
  };
}

function checkEffect(level: EffectLevel, chosenOptionId: string | null): LevelCheck | null {
  if (!chosenOptionId) return null;
  const transaction = TRANSACTION_BY_ID[level.transactionId];
  const option = level.options.find((candidate) => candidate.id === chosenOptionId);
  const correct = chosenOptionId === level.correctOptionId;
  if (!option) return null;

  return {
    correct,
    headline: correct ? "Exactly right" : "The equation moved differently",
    detail: correct
      ? level.explanation
      : `"${option.label}" is not what happened here. ${level.explanation}`,
    remedy: correct
      ? ""
      : "Read the entry, then ask which of assets, liabilities and equity actually changed.",
    tags: [],
    conceptIds: level.conceptIds,
    tAccounts: correct ? transaction.expected : undefined,
    delta: correct ? equationDelta(ACCOUNTS, transaction.expected) : null,
  };
}

function checkQuiz(level: QuizLevel, chosenOptionId: string | null): LevelCheck | null {
  if (!chosenOptionId) return null;
  const option = level.options.find((candidate) => candidate.id === chosenOptionId);
  const correct = chosenOptionId === level.correctOptionId;
  if (!option) return null;
  return {
    correct,
    headline: correct ? "That's it" : "Not quite — have another think",
    detail: correct ? level.explanation : `${level.explanation}`,
    remedy: correct ? "" : "Re-read the statements, then try again.",
    tags: correct ? [] : level.misconceptionTags,
    conceptIds: level.conceptIds,
  };
}

function checkBalance(level: BalanceLevel, chosenOptionId: string | null): LevelCheck | null {
  if (!chosenOptionId) return null;
  const option = level.options.find((candidate) => candidate.id === chosenOptionId);
  const correct = chosenOptionId === level.correctOptionId;
  if (!option) return null;
  return {
    correct,
    headline: correct ? "Correct — that's the closing balance" : "That's not the closing balance",
    detail: correct ? level.explanation : `${level.explanation}`,
    remedy: correct ? "" : "Total each column, then take the smaller total from the larger.",
    tags: correct ? [] : level.misconceptionTags,
    conceptIds: level.conceptIds,
  };
}

function checkTrial(
  level: TrialLevel,
  assignments: Record<string, Side | null>,
): LevelCheck | null {
  const rows = level.rows.map((row) => ({
    ...row,
    chosenSide: assignments[row.accountId] ?? null,
  }));
  if (rows.some((row) => row.chosenSide === null)) return null;

  const wrong = rows.filter((row) => row.chosenSide !== row.correctSide);
  const correct = wrong.length === 0;
  const totalDebit = rows
    .filter((row) => row.chosenSide === "debit")
    .reduce((sum, row) => sum + row.amount, 0);
  const totalCredit = rows
    .filter((row) => row.chosenSide === "credit")
    .reduce((sum, row) => sum + row.amount, 0);

  const correction: Correction = {
    heading: correct ? "Your trial balance" : "Correct columns",
    rows: rows.map((row) => {
      const account = findAccount(ACCOUNTS, row.accountId);
      const side = row.correctSide === "debit" ? "Dr" : "Cr";
      return {
        label: account.name,
        value: `${side} ${formatMoney(row.amount)}`,
        ok: row.chosenSide === row.correctSide,
      };
    }),
  };

  const wrongNames = wrong
    .map((row) => findAccount(ACCOUNTS, row.accountId).name)
    .slice(0, 4)
    .join(", ");

  return {
    correct,
    headline: correct ? "Balanced! The two columns agree" : "Two columns, not yet equal",
    detail: correct
      ? level.explanation
      : `${wrongNames} ${wrong.length === 1 ? "is" : "are"} in the wrong column. ${level.explanation}`,
    remedy: correct ? "" : "Ask which side each account grows on, then place its balance there.",
    tags: correct ? [] : level.misconceptionTags,
    conceptIds: level.conceptIds,
    correction,
  };
}

function checkSort(
  level: SortLevel,
  assignments: Record<string, string | null>,
): LevelCheck | null {
  const rows = level.items.map((item) => ({
    ...item,
    chosen: assignments[item.id] ?? null,
  }));
  if (rows.some((row) => row.chosen === null)) return null;

  const labelOf = (bucketId: string) =>
    level.buckets.find((bucket) => bucket.id === bucketId)?.label ?? bucketId;
  const wrong = rows.filter((row) => row.chosen !== row.bucketId);
  const correct = wrong.length === 0;

  const correction: Correction = {
    heading: correct ? "Your classification" : "Correct classification",
    rows: rows.map((row) => ({
      label: row.label,
      value: labelOf(row.bucketId),
      ok: row.chosen === row.bucketId,
    })),
  };

  const wrongNames = wrong.map((row) => row.label).slice(0, 4).join(", ");

  return {
    correct,
    headline: correct ? "All sorted correctly" : "A few items are in the wrong place",
    detail: correct
      ? level.explanation
      : `${wrongNames} ${wrong.length === 1 ? "belongs" : "belong"} elsewhere. ${level.explanation}`,
    remedy: correct ? "" : "Ask what each item represents before you sort it.",
    tags: correct ? [] : level.misconceptionTags,
    conceptIds: level.conceptIds,
    correction,
  };
}

export function LevelPlayer({ levelId }: { levelId: string }) {
  const { progress, update, lang } = useProgressContext();
  const level = LEVEL_BY_ID[levelId];

  const [lines, setLines] = useState<EntryLine[]>([]);
  const [chosenType, setChosenType] = useState<AccountType | null>(null);
  const [chosenOption, setChosenOption] = useState<string | null>(null);
  const [trialAssign, setTrialAssign] = useState<Record<string, Side | null>>({});
  const [sortAssign, setSortAssign] = useState<Record<string, string | null>>({});
  const [hints, setHints] = useState(0);
  const [submits, setSubmits] = useState(0);
  const [check, setCheck] = useState<LevelCheck | null>(null);
  const [burst, setBurst] = useState(0);
  const [xpPop, setXpPop] = useState<{ id: number; amount: number } | null>(null);

  const levelIndex = LEVELS.findIndex((candidate) => candidate.id === levelId);
  const nextLevel = LEVELS[levelIndex + 1] ?? null;
  const unlocked = useMemo(
    () => isLevelUnlocked(levelId, LEVELS, progress.completedLevelIds),
    [progress.completedLevelIds, levelId],
  );

  if (!level) {
    return (
      <div className="py-20 text-center">
        <h1 className="text-2xl font-extrabold text-ink">Level not found</h1>
        <Link href="/learn" className="mt-3 inline-block font-bold text-credit hover:underline">
          {t("action.back-to-chapters", lang)}
        </Link>
      </div>
    );
  }

  if (!unlocked) {
    return (
      <div className="py-20 text-center">
        <h1 className="text-2xl font-extrabold text-ink">This level is locked</h1>
        <p className="mt-2 text-ink-muted">
          Complete the earlier levels in order and this one will unlock.
        </p>
        <Link href="/learn" className="mt-3 inline-block font-bold text-credit hover:underline">
          {t("action.back-to-chapters", lang)}
        </Link>
      </div>
    );
  }

  const transaction = transactionFor(level);
  const trayAccounts = transaction
    ? transaction.accountIds
        .map((id) => findAccount(ACCOUNTS, id))
        .sort((a, b) => a.name.localeCompare(b.name))
    : [];

  const canSubmit = (() => {
    switch (level.mode) {
      case "forge":
        return lines.length > 0;
      case "classify":
        return chosenType !== null;
      case "effect":
      case "quiz":
      case "balance":
        return chosenOption !== null;
      case "trial":
        return level.rows.every((row) => trialAssign[row.accountId]);
      case "sort":
        return level.items.every((item) => sortAssign[item.id]);
    }
  })();

  const submit = () => {
    const result = (() => {
      switch (level.mode) {
        case "forge":
          return checkForge(level, lines);
        case "classify":
          return checkClassify(level, chosenType);
        case "effect":
          return checkEffect(level, chosenOption);
        case "quiz":
          return checkQuiz(level, chosenOption);
        case "balance":
          return checkBalance(level, chosenOption);
        case "trial":
          return checkTrial(level, trialAssign);
        case "sort":
          return checkSort(level, sortAssign);
      }
    })();
    if (!result) return;

    const attempt = submits + 1;
    const now = Date.now();
    const difficulty = levelDifficulty(level);
    const award = xpForLevel({ difficulty, attempts: attempt, hintsUsed: hints });
    const alreadyAwarded = Boolean(progress.xp.awarded[level.id]);
    const xpAward = result.correct && !alreadyAwarded ? award.total : 0;

    // Work out what clearing this level unlocks, so the student sees the badge
    // and the title the moment they earn them.
    const rewards = result.correct
      ? levelRewards(progress, level.id, xpAward, hints)
      : undefined;
    setCheck({ ...result, xpAward, rewards });
    setSubmits(attempt);

    if (result.correct) {
      playSfx(xpAward > 0 ? "levelup" : "correct");
      if (xpAward > 0) {
        setBurst((count) => count + 1);
        setXpPop({ id: now, amount: xpAward });
      }
    } else {
      playSfx("wrong");
    }

    update((current) => {
      const mastery = applyAttemptToConcepts(current.mastery, result.conceptIds, {
        correct: result.correct,
        hintsUsed: hints,
        attemptsUsed: attempt,
        at: now,
      });

      const misconceptionCounts = { ...current.misconceptionCounts };
      if (!result.correct) {
        for (const tag of result.tags) {
          misconceptionCounts[tag] = (misconceptionCounts[tag] ?? 0) + 1;
        }
      }

      const stats = {
        totalAttempts: current.stats.totalAttempts + 1,
        totalCorrect: current.stats.totalCorrect + (result.correct ? 1 : 0),
        hintsUsed: current.stats.hintsUsed + hints,
      };

      if (!result.correct) {
        return { ...current, mastery, misconceptionCounts, stats };
      }

      const alreadyComplete = current.completedLevelIds.includes(level.id);
      const granted = current.xp.awarded[level.id]
        ? 0
        : xpForLevel({ difficulty, attempts: attempt, hintsUsed: hints }).total;

      return {
        ...current,
        completedLevelIds: alreadyComplete
          ? current.completedLevelIds
          : [...current.completedLevelIds, level.id],
        levelResults: {
          ...current.levelResults,
          [level.id]: {
            levelId: level.id,
            correct: true,
            attempts: attempt,
            hintsUsed: hints,
            completedAt: now,
          },
        },
        xp: granted
          ? {
              total: current.xp.total + granted,
              awarded: { ...current.xp.awarded, [level.id]: granted },
            }
          : current.xp,
        mastery,
        misconceptionCounts,
        streak: advanceStreak(current.streak, localDayKey(now)),
        stats,
      };
    });
  };

  const onLinesChange = (nextLines: EntryLine[]) => {
    setLines(nextLines);
    if (check && !check.correct) setCheck(null);
  };

  const pickOption = (id: string) => {
    setChosenOption(id);
    if (check && !check.correct) setCheck(null);
  };

  const retry = () => setCheck(null);

  const modePrompt = MODE_PROMPT[level.mode];

  return (
    <div className="mx-auto max-w-3xl space-y-5 py-6">
      <Confetti burstKey={burst} />
      {xpPop ? (
        <div
          key={xpPop.id}
          className="pointer-events-none fixed left-1/2 top-24 z-[65] -translate-x-1/2"
        >
          <span className="animate-float-up inline-block rounded-full bg-ig-135 px-5 py-2.5 text-lg font-black text-white shadow-glow">
            +{xpPop.amount} XP
          </span>
        </div>
      ) : null}
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/learn" className="text-sm font-bold text-ink-muted hover:text-ink">
          ← {t("action.back-to-chapters", lang)}
        </Link>
        <span className="rounded-full grad-ig px-3 py-1 text-xs font-black uppercase tracking-wide text-white">
          Level {level.order}
        </span>
      </div>

      <div>
        <h1 className="text-2xl font-black text-ink sm:text-3xl">{level.title}</h1>
        <p className="mt-1 text-ink-muted">{level.subtitle}</p>
      </div>

      {transaction ? (
        <TransactionPanel transaction={transaction} lang={lang} />
      ) : level.instruction ? (
        <div className="rounded-xl2 border border-line bg-paper-card p-5 shadow-card">
          <p className="text-base leading-relaxed text-ink sm:text-lg">{level.instruction}</p>
        </div>
      ) : null}

      {/* The task */}
      <div className="rounded-xl2 border border-line bg-paper-card p-4 shadow-card sm:p-5">
        <p className="mb-3 text-sm font-black uppercase tracking-wide text-credit">
          {modePrompt}
        </p>

        {level.mode === "forge" && (
          <ForgeBuilder
            accounts={trayAccounts}
            transactionAmount={transaction?.amount ?? 0}
            lines={lines}
            onLinesChange={onLinesChange}
            disabled={check?.correct ?? false}
            lang={lang}
          />
        )}

        {level.mode === "classify" && (
          <div className="flex flex-wrap gap-2">
            {(Object.keys(ACCOUNT_TYPE_LABEL) as AccountType[]).map((type) => (
              <button
                key={type}
                type="button"
                disabled={check?.correct ?? false}
                onClick={() => {
                  setChosenType(type);
                  if (check && !check.correct) setCheck(null);
                }}
                className={`rounded-full border-2 px-4 py-2 text-sm font-bold transition ${
                  chosenType === type
                    ? "border-credit ring-2 ring-credit/30 bg-paper-card"
                    : "border-line bg-paper-card hover:border-credit/50"
                }`}
              >
                <span
                  className={`mr-1.5 rounded-full px-2 py-0.5 text-[11px] font-extrabold uppercase ${TYPE_STYLES[type]}`}
                >
                  {ACCOUNT_TYPE_LABEL[type]}
                </span>
                {ACCOUNT_TYPE_BLURB[type]}
              </button>
            ))}
          </div>
        )}

        {level.mode === "effect" && (
          <ChoiceList
            options={level.options}
            value={chosenOption}
            onChange={pickOption}
            disabled={check?.correct ?? false}
          />
        )}

        {level.mode === "quiz" && (
          <ChoiceList
            options={level.options}
            value={chosenOption}
            onChange={pickOption}
            disabled={check?.correct ?? false}
          />
        )}

        {level.mode === "balance" && (
          <AccountBalanceTask
            account={findAccount(ACCOUNTS, level.accountId)}
            debits={level.debits}
            credits={level.credits}
            options={level.options}
            value={chosenOption}
            onChange={pickOption}
            disabled={check?.correct ?? false}
            lang={lang}
          />
        )}

        {level.mode === "trial" && (
          <TrialBalanceTask
            rows={level.rows}
            assignments={trialAssign}
            onChange={(accountId, side) => {
              setTrialAssign((current) => ({ ...current, [accountId]: side }));
              if (check && !check.correct) setCheck(null);
            }}
            disabled={check?.correct ?? false}
            lang={lang}
          />
        )}

        {level.mode === "sort" && (
          <BucketSortTask
            buckets={level.buckets}
            items={level.items}
            assignments={sortAssign}
            onChange={(itemId, bucketId) => {
              setSortAssign((current) => ({ ...current, [itemId]: bucketId }));
              if (check && !check.correct) setCheck(null);
            }}
            disabled={check?.correct ?? false}
          />
        )}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <HintPanel
            hints={level.hints}
            revealed={hints}
            onReveal={() => {
              playSfx("click");
              setHints((current) => Math.min(current + 1, level.hints.length));
            }}
            lang={lang}
          />
          <button
            type="button"
            onClick={submit}
            disabled={!canSubmit || check?.correct === true}
            className="shrink-0 rounded-full bg-ig-135 px-5 py-3 font-black text-white shadow-glow transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-40 sm:px-7"
          >
            {t("action.check", lang)}
          </button>
        </div>
      </div>

      {/* Feedback */}
      {check && (
        <FeedbackPanel
          correct={check.correct}
          headline={check.headline}
          detail={check.detail}
          remedy={check.remedy}
          tags={check.tags}
          conceptIds={check.conceptIds}
          tAccounts={check.tAccounts}
          delta={check.delta}
          correction={check.correction}
          xpAward={check.xpAward}
          onTryAgain={check.correct ? undefined : retry}
          onNext={
            check.correct
              ? () => {
                  if (nextLevel) window.location.href = `/play/${nextLevel.id}/`;
                }
              : undefined
          }
          nextLabel={
            nextLevel
              ? `${t("action.next", lang)}: ${nextLevel.title}`
              : t("action.back-to-chapters", lang)
          }
          lang={lang}
        />
      )}

      {/* Rewards: the badge and title this clear unlocked */}
      {check?.correct && check.rewards ? (
        <div className="animate-rise rounded-xl2 border border-gold/40 bg-gold-soft/30 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-lg" aria-hidden="true">
              {check.rewards.title.icon}
            </span>
            <p className="text-sm font-black text-gold-deep">
              {check.rewards.titleUpgraded ? "New title — " : "Title — "}
              {check.rewards.title.name}
            </p>
            {check.rewards.titleUpgraded ? (
              <span className="rounded-full bg-gold px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wide text-[#3a2700]">
                Promoted
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-xs font-semibold text-ink-soft">{check.rewards.title.blurb}</p>

          {check.rewards.badges.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {check.rewards.badges.map((entry) => (
                <span
                  key={entry.badge.id}
                  className="animate-bounce-in inline-flex items-center gap-1.5 rounded-full border border-good/40 bg-good-soft/60 px-3 py-1.5 text-xs font-black text-good"
                >
                  <span aria-hidden="true">{entry.badge.icon}</span>
                  Badge unlocked: {entry.badge.name}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Concept chips */}
      <div className="flex flex-wrap items-center gap-2 text-xs text-ink-muted">
        <span className="font-bold uppercase tracking-wide">Trains:</span>
        {level.conceptIds.map((conceptId) => (
          <span key={conceptId} className="rounded-full bg-paper-sunken px-2.5 py-1 font-semibold">
            {CONCEPT_ORDER.includes(conceptId) ? conceptId.replaceAll("-", " ") : conceptId}
          </span>
        ))}
      </div>
    </div>
  );
}
