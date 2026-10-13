"use client";

import { useEffect, useState } from "react";

interface Piece {
  id: number;
  left: number;
  delay: number;
  duration: number;
  size: number;
  color: string;
  emoji?: string;
}

const COLORS = ["#FFD93D", "#F58529", "#E1306C", "#9B30BF", "#405DE6", "#06C167"];
const EMOJI = ["🎉", "✨", "💰", "⭐", "🎊"];

function makePieces(count: number): Piece[] {
  return Array.from({ length: count }, (_, id) => {
    const useEmoji = Math.random() < 0.22;
    return {
      id,
      left: Math.random() * 100,
      delay: Math.random() * 0.5,
      duration: 2 + Math.random() * 1.4,
      size: 8 + Math.random() * 10,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      emoji: useEmoji ? EMOJI[Math.floor(Math.random() * EMOJI.length)] : undefined,
    };
  });
}

/**
 * A one-shot confetti burst. Give it a changing `burstKey` (a counter) and a
 * fresh shower fires each time the number changes; key 0 renders nothing, so it
 * stays completely out of the way until the first success.
 */
export function Confetti({ burstKey, count = 48 }: { burstKey: number; count?: number }) {
  const [pieces, setPieces] = useState<Piece[]>([]);

  useEffect(() => {
    if (burstKey === 0) return;
    setPieces(makePieces(count));
    const timer = window.setTimeout(() => setPieces([]), 3800);
    return () => window.clearTimeout(timer);
  }, [burstKey, count]);

  if (pieces.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[70] overflow-hidden" aria-hidden="true">
      {pieces.map((piece) => (
        <span
          key={piece.id}
          className="absolute top-[-12vh] block animate-confetti will-change-transform"
          style={{
            left: `${piece.left}%`,
            animationDelay: `${piece.delay}s`,
            animationDuration: `${piece.duration}s`,
            fontSize: piece.emoji ? `${piece.size + 8}px` : undefined,
            width: piece.emoji ? undefined : piece.size,
            height: piece.emoji ? undefined : piece.size,
            backgroundColor: piece.emoji ? undefined : piece.color,
            borderRadius: piece.emoji ? undefined : 2,
          }}
        >
          {piece.emoji}
        </span>
      ))}
    </div>
  );
}
