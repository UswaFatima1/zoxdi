/**
 * Local identity: the avatar and the shop name that make the game feel like
 * the student's own. Pure and dependency-free so storage can lean on it while
 * migrating older payloads, and so nothing here can ever hit the network.
 */

export const AVATARS = [
  "🦊",
  "🐯",
  "🐼",
  "🦁",
  "🐨",
  "🐵",
  "🐸",
  "🐙",
  "🦄",
  "🐲",
  "🦉",
  "🐧",
  "🐝",
  "🐬",
  "🚀",
  "⭐",
] as const;

export const DEFAULT_AVATAR: string = "🦊";

function hash(seed: string): number {
  let value = 0;
  for (let index = 0; index < seed.length; index += 1) {
    value = (value * 31 + seed.charCodeAt(index)) >>> 0;
  }
  return value;
}

/** A stable avatar for a name, so a profile always has a friendly face. */
export function avatarForName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return DEFAULT_AVATAR;
  return AVATARS[hash(trimmed) % AVATARS.length];
}

export function isAvatar(value: unknown): value is string {
  return typeof value === "string" && (AVATARS as readonly string[]).includes(value);
}

export function firstName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts[0] ?? "";
}

/** "Alex Morgan" -> "Alex's Shop". The home base of the whole game. */
export function defaultShopName(name: string): string {
  const first = firstName(name);
  return first ? `${first}'s Shop` : "My Shop";
}
