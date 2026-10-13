"use client";

import { useProgressContext } from "@/lib/storage/ProgressContext";

/** Mute / unmute the game's sound cues. The choice is stored with the theme. */
export function SoundToggle() {
  const { sound, toggleSound } = useProgressContext();
  return (
    <button
      type="button"
      onClick={toggleSound}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-paper-card text-lg transition hover:border-credit/50"
      aria-label={sound ? "Mute sound effects" : "Turn sound effects on"}
      title={sound ? "Sound on" : "Sound off"}
    >
      {sound ? "🔊" : "🔇"}
    </button>
  );
}
