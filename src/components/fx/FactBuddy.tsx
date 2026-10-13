"use client";

import { useEffect, useState } from "react";

/**
 * A small, friendly 2D mascot — a coin wearing a wizard's cap — who pipes up
 * with a fun, true fact about accounting. It changes every few minutes on its
 * own (and on a tap), so the hero keeps offering something new to read.
 */
const FACTS = [
  "Double entry isn't double the work — it's how the books stay honest.",
  "Every debit has a credit. That one little rule is the whole game.",
  "Assets = Liabilities + Equity. A whole business in a single line.",
  "Revenue is not cash, and profit is not money in the bank.",
  "A trial balance that agrees proves you were consistent, not correct.",
  "Depreciation doesn't pay for anything — it spreads a cost over time.",
  "“Debit” comes from the Latin debere — “to owe”.",
  "Writing may have been invented to keep accounts, nearly 5,000 years ago.",
  "An asset is a promise of future benefit; a liability is a promise to pay.",
  "Profit is an opinion. Cash is a fact.",
  "Closing the books isn't the end — it's how the next year begins.",
  "No such thing as a small entry: every cent has an equal and opposite cent.",
];

const ROTATE_MS = 3 * 60 * 1000;

export function Mascot({ size = 72 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 96 96"
      fill="none"
      aria-hidden="true"
      className="drop-shadow-sm"
    >
      <defs>
        <linearGradient id="zb-hat" x1="20" y1="2" x2="76" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFD93D" />
          <stop offset="45%" stopColor="#F58529" />
          <stop offset="100%" stopColor="#9B30BF" />
        </linearGradient>
        <linearGradient id="zb-body" x1="48" y1="36" x2="48" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#6A84FF" />
          <stop offset="100%" stopColor="#9B30BF" />
        </linearGradient>
      </defs>

      <g transform="rotate(-7 48 40)">
        {/* wizard cap */}
        <path d="M48 6 L66 34 H30 Z" fill="url(#zb-hat)" />
        <ellipse cx="48" cy="34" rx="27" ry="6.5" fill="url(#zb-hat)" />
        <circle cx="48" cy="9" r="3.4" fill="#FFF6D6" />
        <path
          d="M33 24 l1.5 3.2 3.2 1.5 -3.2 1.5 -1.5 3.2 -1.5 -3.2 -3.2 -1.5 3.2 -1.5 z"
          fill="#FFF6D6"
          opacity="0.92"
        />
        <path
          d="M62 23 l1.2 2.7 2.7 1.2 -2.7 1.2 -1.2 2.7 -1.2 -2.7 -2.7 -1.2 2.7 -1.2 z"
          fill="#FFF6D6"
          opacity="0.8"
        />
      </g>

      {/* coin body */}
      <circle cx="48" cy="63" r="26" fill="url(#zb-body)" />
      <circle cx="48" cy="63" r="26" fill="none" stroke="#fff" strokeOpacity="0.35" strokeWidth="2" />
      <circle cx="48" cy="63" r="20.5" fill="none" stroke="#fff" strokeOpacity="0.18" strokeWidth="1.5" />

      {/* face */}
      <circle cx="39" cy="58" r="3.6" fill="#fff" />
      <circle cx="57" cy="58" r="3.6" fill="#fff" />
      <circle cx="40" cy="59" r="1.7" fill="#2b2040" />
      <circle cx="58" cy="59" r="1.7" fill="#2b2040" />
      <path d="M39 70 q9 8 18 0" stroke="#fff" strokeWidth="3" strokeLinecap="round" fill="none" />
      <circle cx="32" cy="68" r="3.2" fill="#fff" opacity="0.35" />
      <circle cx="64" cy="68" r="3.2" fill="#fff" opacity="0.35" />
    </svg>
  );
}

export function FactBuddy({
  rotationMs = ROTATE_MS,
  className = "",
}: {
  rotationMs?: number;
  className?: string;
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((current) => (current + 1) % FACTS.length);
    }, rotationMs);
    return () => clearInterval(id);
  }, [rotationMs]);

  const next = () => setIndex((current) => (current + 1) % FACTS.length);

  return (
    <div className={`flex items-start gap-3 ${className}`}>
      <button
        type="button"
        onClick={next}
        aria-label="Show another accounting fact"
        title="Another fact!"
        className="shrink-0 animate-float rounded-2xl transition hover:scale-105 active:scale-95"
      >
        <Mascot size={72} />
      </button>

      <div
        key={index}
        className="animate-rise relative flex-1 rounded-2xl border border-line bg-paper-card px-3.5 py-2.5 shadow-card"
      >
        <span className="pointer-events-none absolute -left-1.5 top-5 h-3 w-3 rotate-45 border-b border-l border-line bg-paper-card" />
        <p className="text-[11px] font-black uppercase tracking-wide text-ink-muted">
          🪄 Fun fact
        </p>
        <p className="mt-0.5 text-sm font-semibold leading-snug text-ink-soft">
          {FACTS[index]}
        </p>
      </div>
    </div>
  );
}
