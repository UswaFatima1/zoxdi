"use client";

import { formatMoney } from "@/lib/accounting/engine";
import type { Side } from "@/lib/accounting/types";

export interface BalanceScaleProps {
  debitTotal: number;
  creditTotal: number;
  /**
   * Phase of the game. In "play" the scale gives calm live feedback; in
   * "correct" it beams green; in "wrong" it dips gently — never violently,
   * because beginners should feel supported, not punished.
   */
  status?: "play" | "correct" | "wrong";
  maxAmount?: number;
  className?: string;
}

function Pan({ side, total }: { side: Side; total: number }) {
  const debit = side === "debit";
  return (
    <div className="flex flex-col items-center">
      <div className="flex h-2.5 w-12 justify-between">
        <span className="w-[2px] bg-ink/30" />
        <span className="w-[2px] bg-ink/30" />
      </div>
      <div
        className={`w-24 rounded-b-2xl rounded-t-md border-2 px-2 pb-1.5 pt-1.5 text-center shadow-sm ${
          debit ? "border-debit bg-debit-soft" : "border-credit bg-credit-soft"
        }`}
      >
        <div
          className={`text-[11px] font-extrabold uppercase tracking-wide ${
            debit ? "text-debit-deep" : "text-credit-deep"
          }`}
        >
          {side}
        </div>
        <div className="font-mono text-sm font-bold text-ink">
          {formatMoney(total)}
        </div>
      </div>
    </div>
  );
}

export function BalanceScale({
  debitTotal,
  creditTotal,
  status = "play",
  maxAmount = 1,
  className = "",
}: BalanceScaleProps) {
  const table = Math.max(maxAmount, Math.abs(debitTotal), Math.abs(creditTotal), 1);
  const angle = ((creditTotal - debitTotal) / table) * 7;
  const clampedAngle = Math.max(-7, Math.min(7, angle));
  const different = Math.abs(debitTotal - creditTotal);
  const balanced = status === "correct" || different < 0.005;

  return (
    <div className={`relative mx-auto h-44 w-full max-w-xl select-none ${className}`}>
      {/* Stand */}
      <div className="absolute left-1/2 top-1 h-8 w-[3px] -translate-x-1/2 rounded bg-ink/20" />
      <div className="absolute left-1/2 top-0 h-4 w-10 -translate-x-1/2 rounded-b-md bg-ink/10" />
      <div className="absolute left-1/2 top-[32px] h-3 w-3 -translate-x-1/2 rounded-full border-[3px] border-gold bg-paper shadow" />

      {/* Tilting beam and pans */}
      <div
        className="absolute left-[6%] right-[6%] top-[32px]"
        style={{
          transform: `rotate(${clampedAngle}deg)`,
          transformOrigin: "50% 0",
          transition: "transform 0.25s ease",
        }}
      >
        <div
          className={`relative h-[7px] rounded-full transition-colors duration-200 ${
            status === "correct"
              ? "bg-good"
              : status === "wrong"
                ? "bg-bad"
                : "bg-ink/60"
          }`}
        >
          <div className="absolute -left-3 -top-1">
            <Pan side="debit" total={debitTotal} />
          </div>
          <div className="absolute -right-3 -top-1">
            <Pan side="credit" total={creditTotal} />
          </div>
        </div>
      </div>

      {/* Status line */}
      <div className="absolute inset-x-0 bottom-0 text-center text-sm font-semibold">
        {status === "correct" ? (
          <span className="text-good">● In balance</span>
        ) : status === "wrong" ? (
          <span className="text-bad">● Out by {formatMoney(Math.abs(different))}</span>
        ) : balanced ? (
          <span className="text-good/80">● In balance</span>
        ) : (
          <span className="text-ink-muted">● Out by {formatMoney(Math.abs(different))}</span>
        )}
      </div>
    </div>
  );
}
