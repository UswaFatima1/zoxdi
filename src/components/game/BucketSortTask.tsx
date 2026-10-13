"use client";

export interface SortBucket {
  id: string;
  label: string;
  hint?: string;
}

export interface SortItem {
  id: string;
  label: string;
}

/** Assign each item to a bucket — used for income statement / balance sheet sorting. */
export function BucketSortTask({
  buckets,
  items,
  assignments,
  onChange,
  disabled,
}: {
  buckets: SortBucket[];
  items: SortItem[];
  assignments: Record<string, string | null>;
  onChange: (itemId: string, bucketId: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-2.5">
      {items.map((item) => {
        const chosen = assignments[item.id] ?? null;
        return (
          <div
            key={item.id}
            className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-paper-card px-3.5 py-3 shadow-card"
          >
            <p className="min-w-[8rem] flex-1 text-sm font-extrabold text-ink">{item.label}</p>
            <div className="flex flex-wrap gap-1.5">
              {buckets.map((bucket) => {
                const active = chosen === bucket.id;
                return (
                  <button
                    key={bucket.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => onChange(item.id, bucket.id)}
                    className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                      active
                        ? "grad-ig text-white shadow-glow"
                        : "border border-line bg-paper text-ink-muted hover:text-ink"
                    } ${disabled ? "opacity-70" : ""}`}
                    aria-pressed={active}
                  >
                    {bucket.label}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
