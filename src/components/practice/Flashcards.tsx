"use client";

import { useState } from "react";
import { MNEMONIC_CARDS } from "@/data/accounting/mnemonics";

export function Flashcards() {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const card = MNEMONIC_CARDS[index];
  const last = index === MNEMONIC_CARDS.length - 1;

  const go = (next: number) => {
    setFlipped(false);
    setIndex((next + MNEMONIC_CARDS.length) % MNEMONIC_CARDS.length);
  };

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <p className="text-center text-xs font-black uppercase tracking-wide text-ink-muted">
        Card {index + 1} of {MNEMONIC_CARDS.length}
      </p>

      <button
        type="button"
        onClick={() => setFlipped((value) => !value)}
        className="group block w-full [perspective:1200px]"
        aria-label={flipped ? "Show the front of the card" : "Flip the card"}
      >
        <div
          className={`relative h-72 w-full transition-transform duration-500 [transform-style:preserve-3d] ${
            flipped ? "[transform:rotateY(180deg)]" : ""
          }`}
        >
          {/* Front */}
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl3 border border-debit/40 bg-paper-card p-6 text-center shadow-card [backface-visibility:hidden]">
            <p className="font-mono text-3xl font-black text-ink sm:text-4xl">{card.front}</p>
            <p className="mt-4 rounded-full bg-debit-soft px-4 py-1.5 text-xs font-black text-debit-deep">
              Tap to flip
            </p>
          </div>
          {/* Back */}
          <div className="absolute inset-0 flex flex-col justify-center rounded-xl3 border border-credit/40 bg-paper-card p-6 text-center shadow-card [transform:rotateY(180deg)] [backface-visibility:hidden]">
            <p className="text-lg font-black leading-snug text-ink">{card.back}</p>
            <p className="mt-4 text-sm leading-relaxed text-ink-muted">{card.note}</p>
          </div>
        </div>
      </button>

      <div className="flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => go(index - 1)}
          className="rounded-full border border-line bg-paper-card px-5 py-2.5 text-sm font-bold text-ink-soft transition hover:border-credit/50 hover:text-ink"
        >
          ← Prev
        </button>
        <span className="flex gap-1.5">
          {MNEMONIC_CARDS.map((item, itemIndex) => (
            <button
              key={item.id}
              type="button"
              onClick={() => go(itemIndex)}
              aria-label={`Go to card ${itemIndex + 1}`}
              className={`h-2.5 w-2.5 rounded-full transition ${
                itemIndex === index ? "bg-credit" : "bg-paper-sunken hover:bg-ink/30"
              }`}
            />
          ))}
        </span>
        <button
          type="button"
          onClick={() => go(index + 1)}
          className="rounded-full border border-line bg-paper-card px-5 py-2.5 text-sm font-bold text-ink-soft transition hover:border-credit/50 hover:text-ink"
        >
          Next →
        </button>
      </div>

      {last && (
        <p className="text-center text-sm font-semibold text-good animate-rise">
          That&apos;s the whole deck — nice. 🎉
        </p>
      )}
    </div>
  );
}
