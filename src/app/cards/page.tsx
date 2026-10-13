"use client";

import Link from "next/link";
import { Flashcards } from "@/components/practice/Flashcards";

export default function CardsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 py-6">
      <div className="text-center">
        <p className="text-xs font-black uppercase tracking-wide text-credit">
          Quick review
        </p>
        <h1 className="mt-1 text-3xl font-black text-ink sm:text-4xl">Mnemonics</h1>
        <p className="mt-2 text-ink-muted">
          Flip through the memory hooks — DEAD CLIC, DEAL, GIRLS — between
          sessions.
        </p>
      </div>
      <Flashcards />
      <p className="text-center">
        <Link
          href="/daily"
          className="text-sm font-bold text-credit underline-offset-4 hover:underline"
        >
          ☀️ Back to the Daily Challenge
        </Link>
      </p>
    </div>
  );
}
