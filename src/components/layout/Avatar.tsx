import type { UserProfile } from "@/lib/storage/progress";

/**
 * A deterministic gradient avatar from initials. Each person gets a stable
 * pair of brand colours derived from their name, so the leaderboard looks
 * lively without any image uploads.
 */
const GRADIENTS = [
  "linear-gradient(135deg,#F58529,#E1306C)",
  "linear-gradient(135deg,#E1306C,#9B30BF)",
  "linear-gradient(135deg,#9B30BF,#405DE6)",
  "linear-gradient(135deg,#405DE6,#F58529)",
  "linear-gradient(135deg,#FFD93D,#F58529)",
  "linear-gradient(135deg,#E1306C,#405DE6)",
];

export function gradientFor(seed: string): string {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }
  return GRADIENTS[hash % GRADIENTS.length];
}

export function Avatar({
  profile,
  size = 36,
  className = "",
}: {
  profile: Pick<UserProfile, "name" | "initials"> & { avatar?: string };
  size?: number;
  className?: string;
}) {
  const emoji = profile.avatar;
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-extrabold text-white shadow-card ring-2 ring-white/70 dark:ring-white/10 ${className}`}
      style={{
        width: size,
        height: size,
        backgroundImage: gradientFor(profile.name),
        fontSize: Math.round(size * (emoji ? 0.5 : 0.36)),
      }}
      aria-hidden="true"
    >
      {emoji ?? profile.initials}
    </span>
  );
}
