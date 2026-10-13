import type { LeaderboardPlayer } from "@/lib/learning/xp";

/**
 * A seeded cohort so the leaderboard is meaningful before there is a backend.
 *
 * These are illustrative classmates, not live users — the platform is fully
 * static and stores progress on-device. Your own row is merged in and ranked
 * against this cohort, which is honest about what a no-server prototype can do.
 */
export const LEADERBOARD_COHORT: LeaderboardPlayer[] = [
  { id: "seed-hamza", name: "Hamza Sheikh", initials: "HS", xp: 2480, masteredLevels: 19 },
  { id: "seed-fatima", name: "Fatima Noor", initials: "FN", xp: 2210, masteredLevels: 17 },
  { id: "seed-bilal", name: "Bilal Ahmed", initials: "BA", xp: 1985, masteredLevels: 16 },
  { id: "seed-zainab", name: "Zainab Riaz", initials: "ZR", xp: 1740, masteredLevels: 14 },
  { id: "seed-usman", name: "Usman Tariq", initials: "UT", xp: 1520, masteredLevels: 12 },
  { id: "seed-mariam", name: "Mariam Iqbal", initials: "MI", xp: 1310, masteredLevels: 11 },
  { id: "seed-ali", name: "Ali Hassan", initials: "AH", xp: 1090, masteredLevels: 9 },
  { id: "seed-sana", name: "Sana Malik", initials: "SM", xp: 860, masteredLevels: 7 },
  { id: "seed-omer", name: "Omer Farooq", initials: "OF", xp: 640, masteredLevels: 5 },
  { id: "seed-hira", name: "Hira Javed", initials: "HJ", xp: 430, masteredLevels: 3 },
];
