"use client";

import { CONCEPTS, CONCEPT_ORDER, type ConceptId } from "@/lib/learning/concepts";
import {
  emptyMastery,
  MASTERY_BAND_LABEL,
  masteryBand,
  masteryPercent,
  type ConceptMastery,
} from "@/lib/learning/mastery";

export interface MasteryMapProps {
  mastery: Partial<Record<ConceptId, ConceptMastery>>;
  /** Highlight the single weakest practised concept. */
  focusWeakest?: boolean;
}

const BAND_BAR: Record<string, string> = {
  beginning: "bg-ink-muted/50",
  developing: "bg-credit",
  proficient: "bg-debit",
  mastered: "bg-good",
};

export function MasteryMap({ mastery, focusWeakest = false }: MasteryMapProps) {
  const practised = CONCEPT_ORDER.filter((id) => (mastery[id]?.attempts ?? 0) > 0);
  const weakestId = practised.length > 0
    ? practised.reduce((lowest, id) =>
        (mastery[id]?.score ?? 0) < (mastery[lowest]?.score ?? 0) ? id : lowest,
      )
    : null;

  return (
    <div className="space-y-3">
      {CONCEPT_ORDER.map((conceptId) => {
        const record = mastery[conceptId] ?? emptyMastery(conceptId);
        const practisedCount = record.attempts;
        const percent = masteryPercent(record.score);
        const band = masteryBand(record.score);
        const isWeakest = focusWeakest && weakestId === conceptId;

        return (
          <div key={conceptId} className="rounded-xl border border-line bg-paper-card p-3.5 shadow-card">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-bold text-ink">
                {CONCEPTS[conceptId].name}
                {isWeakest && (
                  <span className="ml-2 rounded-full bg-bad-soft px-2 py-0.5 text-[11px] font-extrabold uppercase text-bad">
                    Focus
                  </span>
                )}
              </p>
              <div className="flex items-center gap-2 text-xs">
                <span className={`rounded-full px-2 py-0.5 font-bold ${BAND_BAR[band]} text-white`}>
                  {MASTERY_BAND_LABEL[band]}
                </span>
                <span className="w-10 text-right font-mono font-bold text-ink">{percent}%</span>
              </div>
            </div>
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-paper-sunken">
              <div
                className={`h-full rounded-full transition-all duration-500 ${BAND_BAR[band]}`}
                style={{ width: `${percent}%` }}
              />
            </div>
            <p className="mt-1.5 text-xs text-ink-muted">
              {practisedCount === 0
                ? "Not practised yet"
                : `${practisedCount} attempt${practisedCount === 1 ? "" : "s"} · ${record.firstTryCorrect} first-try · ${record.streak} streak`}
            </p>
          </div>
        );
      })}
    </div>
  );
}
