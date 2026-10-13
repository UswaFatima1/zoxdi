"use client";

import { useEffect, useRef, useState } from "react";
import { entryTotals, formatMoney } from "@/lib/accounting/engine";
import type { Account, EntryLine, Side } from "@/lib/accounting/types";
import { t, type Lang } from "@/lib/i18n";
import { AccountCard } from "./AccountCard";
import { BalanceScale } from "./BalanceScale";

export interface ForgeBuilderProps {
  accounts: Account[];
  transactionAmount: number;
  lines: EntryLine[];
  onLinesChange: (lines: EntryLine[]) => void;
  disabled?: boolean;
  lang: Lang;
}

interface DragState {
  accountId: string;
  x: number;
  y: number;
}

const ZONE_LABEL: Record<Side, string> = { debit: "Debit", credit: "Credit" };

export function ForgeBuilder({
  accounts,
  transactionAmount,
  lines,
  onLinesChange,
  disabled = false,
  lang,
}: ForgeBuilderProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [hoverZone, setHoverZone] = useState<Side | null>(null);
  const dragRef = useRef<DragState | null>(null);

  const totals = entryTotals(lines);

  const place = (accountId: string, side: Side) => {
    const existingIndex = lines.findIndex(
      (line) => line.accountId === accountId && line.side === side,
    );
    if (existingIndex >= 0) {
      // Already there; just keep focus on it.
      setSelectedId(null);
      return;
    }
    // Move the account if it is already on the opposite side.
    const moved = lines.filter((line) => line.accountId !== accountId);
    onLinesChange([
      ...moved,
      { accountId, side, amount: transactionAmount },
    ]);
    setSelectedId(null);
  };

  const removeLine = (index: number) => {
    onLinesChange(lines.filter((_, i) => i !== index));
  };

  const changeAmount = (index: number, value: string) => {
    const amount = Math.max(0, Number(value) || 0);
    onLinesChange(
      lines.map((line, i) => (i === index ? { ...line, amount } : line)),
    );
  };

  const clearAll = () => {
    onLinesChange([]);
    setSelectedId(null);
  };

  // Pointer-drag lifecycle: listen on window while dragging so the drag keeps
  // working even when the pointer leaves the card.
  useEffect(() => {
    if (!drag) return;

    const handleMove = (event: PointerEvent) => {
      setDrag({ ...dragRef.current!, x: event.clientX, y: event.clientY });
      const element = document.elementFromPoint(event.clientX, event.clientY);
      const zone = element?.closest("[data-drop]")?.getAttribute("data-drop") as Side | null;
      setHoverZone(zone);
    };

    const handleUp = (event: PointerEvent) => {
      const accountId = dragRef.current?.accountId;
      const element = document.elementFromPoint(event.clientX, event.clientY);
      const zone = element?.closest("[data-drop]")?.getAttribute("data-drop") as Side | null;
      if (accountId && zone) place(accountId, zone);
      dragRef.current = null;
      setDrag(null);
      setHoverZone(null);
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    window.addEventListener("pointercancel", handleUp);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      window.removeEventListener("pointercancel", handleUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drag !== null]);

  const startDrag = (event: React.PointerEvent, accountId: string) => {
    if (disabled) return;
    event.preventDefault();
    dragRef.current = { accountId, x: event.clientX, y: event.clientY };
    setDrag({ accountId, x: event.clientX, y: event.clientY });
  };

  const renderZone = (side: Side) => {
    const zoneLines = lines.filter((line) => line.side === side);
    const active = hoverZone === side;
    return (
      <div
        data-drop={side}
        role="button"
        tabIndex={selectedId ? 0 : undefined}
        aria-label={`Place selected account on ${side} side`}
        onKeyDown={(event) => {
          if (event.key === "Enter" && selectedId) {
            place(selectedId, side);
          }
        }}
        onClick={() => {
          if (selectedId) place(selectedId, side);
        }}
        className={`flex min-h-40 min-w-0 flex-1 flex-col rounded-xl2 border-2 p-3 transition
          ${
            side === "debit"
              ? active
                ? "border-debit bg-debit-soft shadow-lift"
                : "border-debit/40 bg-debit-soft/30"
              : active
                ? "border-credit bg-credit-soft shadow-lift"
                : "border-credit/40 bg-credit-soft/30"
          }`}
      >
        <div
          className={`mb-2 flex items-center justify-between text-xs font-extrabold uppercase tracking-wide ${
            side === "debit" ? "text-debit-deep" : "text-credit-deep"
          }`}
        >
          <span>Dr — {ZONE_LABEL[side]}</span>
          <span className="font-mono normal-case tracking-normal">
            {formatMoney(zoneLines.reduce((sum, line) => sum + line.amount, 0))}
          </span>
        </div>

        <div className="flex-1 space-y-2">
          {zoneLines.map((line, index) => {
            const account = accounts.find((candidate) => candidate.id === line.accountId);
            const lineIndex = lines.indexOf(line);
            return (
              <div
                key={`${line.accountId}-${side}`}
                className="flex items-center gap-2 rounded-lg border border-line bg-paper-card px-2.5 py-2 shadow-sm"
              >
                <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">
                  {account ? (lang === "ur" && account.nameUr ? account.nameUr : account.name) : line.accountId}
                </span>
                <div className="flex shrink-0 items-center gap-1.5">
                  <span className="text-xs font-semibold text-ink-muted">$</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={line.amount}
                    disabled={disabled}
                    onChange={(event) => changeAmount(lineIndex, event.target.value)}
                    className="w-24 rounded-md border border-line bg-paper px-2 py-1 text-right font-mono text-sm font-bold text-ink outline-none focus:border-gold disabled:opacity-60"
                    aria-label={`Amount for ${ZONE_LABEL[side]} line ${index + 1}`}
                  />
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => removeLine(lineIndex)}
                    className="rounded-md px-1.5 text-ink-muted transition hover:bg-bad-soft hover:text-bad disabled:opacity-40"
                    aria-label={`Remove ${ZONE_LABEL[side]} line ${index + 1}`}
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          })}
          {zoneLines.length === 0 && (
            <div className="flex h-24 items-center justify-center rounded-lg border-2 border-dashed border-ink/15 text-sm text-ink-muted">
              {side === "debit" ? "What increases?" : "What gives?"}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Tray */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-extrabold uppercase tracking-wide text-ink-muted">
            {t("forge.tray", lang)}
          </p>
          {lines.length > 0 && (
            <button
              type="button"
              onClick={clearAll}
              disabled={disabled}
              className="text-xs font-bold text-ink-muted underline-offset-2 transition hover:text-bad hover:underline"
            >
              {t("action.reset", lang)}
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
          {accounts.map((account) => {
            const placed = lines.find((line) => line.accountId === account.id)?.side ?? null;
            return (
              <AccountCard
                key={account.id}
                account={account}
                lang={lang}
                selected={selectedId === account.id}
                placed={disabled ? placed : null}
                disabled={disabled}
                onSelect={() => setSelectedId((current) => (current === account.id ? null : account.id))}
                onPointerDown={(event) => startDrag(event, account.id)}
              />
            );
          })}
        </div>
        <p className="mt-2 text-xs text-ink-muted">{t("forge.key", lang)}</p>
      </div>

      {/* Zones */}
      <div className="flex flex-col gap-3 sm:flex-row">
        {renderZone("debit")}
        {renderZone("credit")}
      </div>

      {/* Live scale */}
      <div className="rounded-xl2 border border-line bg-paper-card p-4 shadow-card">
        <BalanceScale
          debitTotal={totals.debitTotal}
          creditTotal={totals.creditTotal}
          maxAmount={transactionAmount * 2}
        />
      </div>

      {/* Drag ghost */}
      {drag && (
        <div
          className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-1/2"
          style={{ left: drag.x, top: drag.y }}
        >
          {(() => {
            const account = accounts.find((candidate) => candidate.id === drag.accountId);
            return account ? (
              <div className="w-40 rounded-xl border-2 border-gold bg-paper-card p-2 shadow-lift">
                <p className="truncate text-sm font-bold text-ink">{account.name}</p>
                <p className="text-xs text-ink-muted">{account.type}</p>
              </div>
            ) : null;
          })()}
        </div>
      )}
    </div>
  );
}
