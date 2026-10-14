"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cardBlob, copyText, downloadCard, drawScoreCard, shareScore } from "@/lib/share/card";
import { challengeUrl, shareText, type Challenge } from "@/lib/share/share";

export interface ShareScoreProps {
  name: string;
  avatar?: string;
  xp: number;
  levels: number;
  streak: number;
  /** For example "Level 12": makes the shared message specific. */
  levelLabel?: string;
  /** The big line on the card. */
  headline?: string;
  /** The second line on the card, usually the level title. */
  subline?: string;
  /** "compact" hides the preview but still shares the picture. */
  variant?: "full" | "compact";
}

const CARD_URL = "zoxdi.pages.dev";

/**
 * "Send your score": draws the score card and offers the three ways people
 * actually share - the device sheet, the saved image, or the copied link.
 */
export function ShareScore({
  name,
  avatar,
  xp,
  levels,
  streak,
  levelLabel,
  headline = "Score card",
  subline = "Accounting, taught as a game",
  variant = "full",
}: ShareScoreProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const challenge = useMemo<Challenge>(
    () => ({ name, xp, levels, at: Date.now() }),
    [name, xp, levels],
  );
  const link = useMemo(() => challengeUrl(challenge), [challenge]);
  const message = useMemo(
    () => shareText({ name, xp, levels, levelLabel, url: link }),
    [name, xp, levels, levelLabel, link],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawScoreCard(canvas, {
      name: name || "A player",
      avatar: avatar ?? "",
      headline,
      subline,
      xp,
      levels,
      streak,
      url: CARD_URL,
    });
  }, [name, avatar, headline, subline, xp, levels, streak]);

  const flash = (text: string) => {
    setStatus(text);
    window.setTimeout(() => setStatus((current) => (current === text ? null : current)), 2800);
  };

  const onShare = async () => {
    const outcome = await shareScore({ canvas: canvasRef.current, text: message, title: "Zoxdi" });
    if (outcome === "copied") flash("Message copied. Paste it anywhere.");
    if (outcome === "failed") flash("Sharing is blocked here. Use Copy link instead.");
  };

  const onSave = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    flash(downloadCard(canvas) ? "Image saved. Post it anywhere." : "Could not save the image.");
  };

  const onCopy = async () => {
    flash((await copyText(message)) ? "Link copied." : "Copy failed. Select the link by hand.");
  };

  const onCopyImage = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const blob = await cardBlob(canvas);
      const ClipboardItemCtor = window.ClipboardItem;
      if (blob && navigator.clipboard && ClipboardItemCtor) {
        await navigator.clipboard.write([new ClipboardItemCtor({ "image/png": blob })]);
        flash("Image copied. Paste it in a chat.");
        return;
      }
    } catch {
      // Clipboard images are not allowed everywhere; the download still works.
    }
    flash("Image copy is blocked here. Use Save image.");
  };

  return (
    <section
      className={
        variant === "full"
          ? "animate-rise rounded-xl2 border border-credit/40 bg-credit-soft/30 p-4"
          : ""
      }
    >
      <div className="flex items-start gap-4">
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className={
            variant === "full"
              ? "w-28 shrink-0 rounded-xl border border-line shadow-card sm:w-36"
              : "hidden"
          }
        />
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-black text-ink sm:text-lg">Send your score</h2>
          <p className="mt-1 text-xs leading-snug text-ink-soft sm:text-sm">
            Post the card or send the link. Whoever opens it is told to beat your XP.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onShare}
              className="rounded-full bg-ig-135 px-4 py-2.5 text-sm font-black text-white shadow-glow transition hover:opacity-95 active:scale-[0.99]"
            >
              Share score
            </button>
            <button
              type="button"
              onClick={onCopy}
              className="rounded-full border-2 border-line bg-paper-card px-4 py-2.5 text-sm font-bold text-ink transition hover:border-credit/50"
            >
              Copy link
            </button>
            <button
              type="button"
              onClick={onSave}
              className="rounded-full border-2 border-line bg-paper-card px-4 py-2.5 text-sm font-bold text-ink transition hover:border-credit/50"
            >
              Save image
            </button>
            {variant === "full" ? (
              <button
                type="button"
                onClick={onCopyImage}
                className="rounded-full border-2 border-line bg-paper-card px-4 py-2.5 text-sm font-bold text-ink transition hover:border-credit/50"
              >
                Copy image
              </button>
            ) : null}
          </div>
          <p aria-live="polite" className="mt-2 min-h-[1rem] text-xs font-bold text-credit-deep">
            {status ?? ""}
          </p>
        </div>
      </div>
    </section>
  );
}
