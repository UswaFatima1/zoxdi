/**
 * Titles are the long arc of progress.
 *
 * Where a badge celebrates a single milestone, a title describes how far the
 * student has come — from an empty set of books to a complete accounting cycle.
 * Titles are *derived* from the levels already completed, so they can never
 * drift out of step with progress and need no storage of their own.
 */

export interface Title {
  id: string;
  name: string;
  icon: string;
  blurb: string;
  /** Levels that must be completed to hold this title. */
  at: number;
}

export const TITLES: Title[] = [
  {
    id: "newcomer",
    name: "Newcomer",
    icon: "🌱",
    blurb: "The books are still empty. Every accountant started exactly here.",
    at: 0,
  },
  {
    id: "first-entries",
    name: "First Entries",
    icon: "🖋️",
    blurb: "You can take what happened and write it down.",
    at: 1,
  },
  {
    id: "junior-clerk",
    name: "Junior Clerk",
    icon: "📗",
    blurb: "You know which side each kind of account moves on.",
    at: 4,
  },
  {
    id: "ledger-keeper",
    name: "Ledger Keeper",
    icon: "📒",
    blurb: "T-accounts hold no fear for you.",
    at: 9,
  },
  {
    id: "bookkeeper",
    name: "Bookkeeper",
    icon: "🧾",
    blurb: "You keep a clean, balanced set of books.",
    at: 14,
  },
  {
    id: "trial-balancer",
    name: "Trial Balancer",
    icon: "⚖️",
    blurb: "You can prove the columns agree — and say what that still would not catch.",
    at: 19,
  },
  {
    id: "financial-reporter",
    name: "Financial Reporter",
    icon: "📊",
    blurb: "You turn a list of balances into real statements.",
    at: 24,
  },
  {
    id: "senior-accountant",
    name: "Senior Accountant",
    icon: "🎓",
    blurb: "Accruals, prepayments and year-end entries are routine.",
    at: 30,
  },
  {
    id: "controller",
    name: "Financial Controller",
    icon: "🏛️",
    blurb: "You see the whole cycle and the judgement behind each entry.",
    at: 35,
  },
  {
    id: "hero",
    name: "Accounting Hero",
    icon: "🦸",
    blurb: "Zero to hero: the whole language of business, spoken fluently.",
    at: 40,
  },
];

export function titleFor(completedLevels: number): Title {
  let current = TITLES[0];
  for (const title of TITLES) {
    if (completedLevels >= title.at) current = title;
  }
  return current;
}

export function nextTitle(completedLevels: number): Title | null {
  return TITLES.find((title) => title.at > completedLevels) ?? null;
}

export interface TitleProgress {
  title: Title;
  next: Title | null;
  /** Levels completed at the start of the current title's band. */
  bandStart: number;
  /** Levels needed to reach the next title (or the current target). */
  bandEnd: number;
  /** 0..1 toward the next title. */
  ratio: number;
}

export function titleProgress(completedLevels: number): TitleProgress {
  const title = titleFor(completedLevels);
  const next = nextTitle(completedLevels);
  const bandStart = title.at;
  const bandEnd = next?.at ?? title.at;
  const span = Math.max(1, bandEnd - bandStart);
  return {
    title,
    next,
    bandStart,
    bandEnd,
    ratio: next ? Math.max(0, Math.min(1, (completedLevels - bandStart) / span)) : 1,
  };
}
