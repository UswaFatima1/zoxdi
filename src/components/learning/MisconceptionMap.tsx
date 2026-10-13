"use client";

import { isKnownMisconception, misconceptionFor } from "@/lib/learning/misconceptions";

export interface MisconceptionMapProps {
  counts: Record<string, number>;
}

export function MisconceptionMap({ counts }: MisconceptionMapProps) {
  const entries = Object.entries(counts)
    .filter(([tag, count]) => count > 0 && isKnownMisconception(tag))
    .sort((a, b) => b[1] - a[1]);

  if (entries.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-line bg-paper-card p-6 text-center text-sm text-ink-muted">
        No repeated misconceptions recorded yet. When one shows up, Zoxdi names
        it here and points you to the exercise that fixes it.
      </p>
    );
  }

  return (
    <div className="space-y-2.5">
      {entries.map(([tag, count]) => {
        const misconception = misconceptionFor(tag);
        return (
          <div key={tag} className="rounded-xl border border-line bg-paper-card p-3.5 shadow-card">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-bold text-ink">{misconception.label}</p>
              <span className="shrink-0 rounded-full bg-bad-soft px-2.5 py-0.5 text-xs font-extrabold text-bad">
                ×{count}
              </span>
            </div>
            <p className="mt-1.5 text-sm text-ink-soft">{misconception.explanation}</p>
            <p className="mt-1.5 text-sm">
              <span className="font-bold text-gold-deep">Try: </span>
              {misconception.remedy}
            </p>
          </div>
        );
      })}
    </div>
  );
}
