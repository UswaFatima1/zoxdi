"use client";

import { useEffect, useState } from "react";
import { Avatar } from "@/components/layout/Avatar";
import { initialsFromName } from "@/lib/storage/progress";
import { ShareScore } from "./ShareScore";
import {
  browserStorage,
  chasePercent,
  clearChallenge,
  hasPassed,
  parseChallenge,
  readChallenge,
  saveChallenge,
  standingLine,
  type Challenge,
} from "@/lib/share/share";

export interface ChallengeBannerProps {
  /** The player's own XP. Zero on the welcome screen, where nobody has played yet. */
  xp?: number;
  name?: string;
  avatar?: string;
  levels?: number;
  streak?: number;
}

/**
 * The dare a visitor arrives holding: somebody shared a "beat me" link, and this
 * card says who, how much, and what it takes to pass them. Once they pass it,
 * the card turns into the invitation to send their own score back.
 */
export function ChallengeBanner({
  xp = 0,
  name = "You",
  avatar,
  levels = 0,
  streak = 0,
}: ChallengeBannerProps) {
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    setEntered(true);
    const storage = browserStorage();
    const incoming = parseChallenge(window.location.search);
    if (incoming) {
      saveChallenge(storage, incoming);
      setChallenge(incoming);
      return;
    }
    setChallenge(readChallenge(storage));
  }, []);

  if (!challenge) return null;

  const passed = hasPassed(challenge, xp);
  const percent = chasePercent(challenge, xp);
  const score = challenge.xp.toLocaleString("en-US");

  const line =
    xp > 0
      ? standingLine(challenge, xp)
      : challenge.xp > 0
        ? `Create your account, then earn ${score} XP to beat them.`
        : `${challenge.name} thinks you should give this a try.`;

  const dismiss = () => {
    clearChallenge(browserStorage());
    setChallenge(null);
  };

  return (
    <section className="animate-slide-up relative rounded-xl2 border border-credit/40 bg-paper-card p-4 shadow-card">
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss this challenge"
        className="absolute right-3 top-3 rounded-full border border-line px-2 py-0.5 text-[11px] font-bold text-ink-muted transition hover:text-ink"
      >
        Close
      </button>

      <p className="text-[11px] font-black uppercase tracking-wide text-credit">
        {passed ? "Challenge passed" : "A friend challenged you"}
      </p>

      <div className="mt-2 flex items-center gap-3">
        <Avatar profile={{ name: challenge.name, initials: initialsFromName(challenge.name) }} size={40} />
        <div className="min-w-0">
          <p className="truncate font-black text-ink">{challenge.name}</p>
          <p className="text-xs font-semibold text-ink-muted">
            {challenge.xp > 0 ? `${score} XP` : "the dare"}
            {challenge.levels > 0 ? ` and ${challenge.levels} levels` : ""}
          </p>
        </div>
      </div>

      <p className="mt-2 text-sm font-bold text-ink-soft">{line}</p>

      {xp > 0 && !passed ? (
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-paper-sunken">
          <div
            className="h-full rounded-full grad-ig-anim animate-gradient-pan transition-[width] duration-1000 ease-out"
            style={{ width: entered ? `${Math.max(percent, 3)}%` : "0%" }}
          />
        </div>
      ) : null}

      {passed ? (
        <div className="mt-3">
          <ShareScore
            variant="compact"
            name={name}
            avatar={avatar}
            xp={xp}
            levels={levels}
            streak={streak}
            headline="Challenge passed"
            subline={`Passed ${challenge.name}`}
          />
        </div>
      ) : null}
    </section>
  );
}
