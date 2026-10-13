/**
 * Combines structural validation with misconception detection to produce the
 * student-facing diagnosis. This is the "a mistake becomes a lesson" feature:
 * the output is not a red cross, it is a named error, an explanation and a
 * targeted next step.
 */

import type { Account, AccountType, EntryLine, JournalEntry } from "../accounting/types";
import { validateEntry, type ValidationResult } from "../accounting/validate";
import type { ConceptId } from "./concepts";
import {
  confusionTag,
  detectMisconceptions,
  misconceptionFor,
  type Misconception,
} from "./misconceptions";

export interface EntryDiagnosis {
  validation: ValidationResult;
  tags: string[];
  misconceptions: Misconception[];
  conceptIds: ConceptId[];
  headline: string;
  detail: string;
  remedy: string;
}

export function diagnoseEntry(
  submitted: JournalEntry | EntryLine[],
  expected: JournalEntry | EntryLine[],
  accounts: Account[],
): EntryDiagnosis {
  const validation = validateEntry(submitted, expected, accounts);

  if (validation.correct) {
    return {
      validation,
      tags: [],
      misconceptions: [],
      conceptIds: [],
      headline: "Correct — the entry is right and it balances",
      detail:
        "Both sides are equal and you chose the correct accounts. That is exactly what the journal expects.",
      remedy: "",
    };
  }

  const tags = detectMisconceptions(submitted, expected, accounts, validation);
  const misconceptions = tags.map(misconceptionFor);
  const conceptIds = [...new Set(misconceptions.map((item) => item.conceptId))];

  const primary = misconceptions[0];
  const detailLines: string[] = [];
  if (primary) detailLines.push(primary.explanation);
  for (const issue of validation.issues) {
    // The generic "out by X" issue shares the extra-line kind; hide it here
    // because the unbalanced-entry misconception already covers it.
    if (issue.kind === "extra-line" && !issue.accountId) continue;
    detailLines.push(issue.message);
  }

  return {
    validation,
    tags,
    misconceptions,
    conceptIds,
    headline: primary ? primary.label : "Not quite yet",
    detail: detailLines.join(" "),
    remedy: primary?.remedy ?? "Re-read the scenario and try once more.",
  };
}

export interface ChoiceDiagnosis {
  correct: boolean;
  conceptIds: ConceptId[];
  /** Canonical misconception tag when the choice was wrong. */
  tag?: string;
}

/** Diagnosis for a single-answer choice, such as classifying an account. */
export function diagnoseAccountTypeChoice(
  chosen: AccountType,
  actual: AccountType,
): ChoiceDiagnosis {
  if (chosen === actual) return { correct: true, conceptIds: [] };
  return {
    correct: false,
    conceptIds: ["account-classification"],
    tag: confusionTag(chosen, actual),
  };
}
