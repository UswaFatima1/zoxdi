import type { LeaderboardPlayer } from "@/lib/learning/xp";

/**
 * A seeded cohort so the board is meaningful while the platform is new.
 *
 * These are not live accounts: the names, XP and level counts are fixed values,
 * ranked against the visitor's own row. Real players arrive through the
 * `leaderboard` view in supabase/schema.sql, which this cohort can be merged
 * with or replaced by.
 */
export const LEADERBOARD_COHORT: LeaderboardPlayer[] = [
  { id: "seed-ayesha", name: "Ayesha Khan", initials: "AK", xp: 2880, masteredLevels: 21 },
  { id: "seed-emma", name: "Emma Wilson", initials: "EW", xp: 2645, masteredLevels: 20 },
  { id: "seed-hamza", name: "Hamza Sheikh", initials: "HS", xp: 2470, masteredLevels: 19 },
  { id: "seed-sofia", name: "Sofia Rossi", initials: "SR", xp: 2295, masteredLevels: 17 },
  { id: "seed-yuki", name: "Yuki Tanaka", initials: "YT", xp: 2110, masteredLevels: 16 },
  { id: "seed-bilal", name: "Bilal Ahmed", initials: "BA", xp: 1985, masteredLevels: 16 },
  { id: "seed-zainab", name: "Zainab Riaz", initials: "ZR", xp: 1760, masteredLevels: 14 },
  { id: "seed-liam", name: "Liam Carter", initials: "LC", xp: 1620, masteredLevels: 13 },
  { id: "seed-mei", name: "Mei Chen", initials: "MC", xp: 1480, masteredLevels: 12 },
  { id: "seed-usman", name: "Usman Tariq", initials: "UT", xp: 1330, masteredLevels: 11 },
  { id: "seed-diego", name: "Diego Alvarez", initials: "DA", xp: 1180, masteredLevels: 10 },
  { id: "seed-mariam", name: "Mariam Iqbal", initials: "MI", xp: 1040, masteredLevels: 9 },
  { id: "seed-amara", name: "Amara Okafor", initials: "AO", xp: 895, masteredLevels: 8 },
  { id: "seed-priya", name: "Priya Nair", initials: "PN", xp: 720, masteredLevels: 6 },
  { id: "seed-lars", name: "Lars Nielsen", initials: "LN", xp: 540, masteredLevels: 4 },
  { id: "seed-omar", name: "Omar Haddad", initials: "OH", xp: 380, masteredLevels: 3 },
];
