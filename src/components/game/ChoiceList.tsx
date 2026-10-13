"use client";

export interface ChoiceOption {
  id: string;
  label: string;
}

/** A single-answer list of options, shared by the effect, quiz and balance tasks. */
export function ChoiceList({
  options,
  value,
  onChange,
  disabled = false,
}: {
  options: ChoiceOption[];
  value: string | null;
  onChange: (id: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-2">
      {options.map((option) => {
        const selected = value === option.id;
        return (
          <button
            key={option.id}
            type="button"
            disabled={disabled}
            onClick={() => onChange(option.id)}
            className={`flex w-full items-center gap-3 rounded-xl border-2 bg-paper-card px-4 py-3 text-left text-sm font-semibold text-ink transition ${
              selected
                ? "border-credit ring-2 ring-credit/30"
                : "border-line hover:border-credit/50"
            } ${disabled ? "opacity-70" : ""}`}
          >
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                selected ? "border-credit bg-credit" : "border-ink/20"
              }`}
            >
              {selected && <span className="h-2 w-2 rounded-full bg-white" />}
            </span>
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
