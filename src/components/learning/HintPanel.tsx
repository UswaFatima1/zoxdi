"use client";

import { t } from "@/lib/i18n";

export interface HintPanelProps {
  hints: string[];
  revealed: number;
  onReveal: () => void;
  lang: "en" | "ur";
}

export function HintPanel({ hints, revealed, onReveal, lang }: HintPanelProps) {
  if (hints.length === 0) return null;
  const done = revealed >= hints.length;

  return (
    <div className="rounded-xl border border-gold/40 bg-gold-soft/30 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-bold text-gold-deep">
          {revealed > 0
            ? `Hints revealed: ${Math.min(revealed, hints.length)}/${hints.length}`
            : "Stuck? Hint away."}
        </p>
        <button
          type="button"
          onClick={onReveal}
          disabled={done}
          className="rounded-full bg-gold px-4 py-1.5 text-sm font-bold text-[#3a2700] transition hover:bg-gold-soft disabled:cursor-not-allowed disabled:opacity-40"
        >
          {done
            ? "All hints out"
            : revealed === hints.length - 1
              ? t("hint.one-more", lang)
              : t("action.hint", lang)}
        </button>
      </div>
      {revealed > 0 && (
        <ol className="mt-3 space-y-1.5">
          {hints.slice(0, revealed).map((hint, index) => (
            <li key={index} className="flex gap-2 text-sm text-ink-soft">
              <span className="font-bold text-gold-deep">{index + 1}.</span>
              <span>{hint}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
