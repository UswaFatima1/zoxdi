/**
 * Tiny synthesised sound effects.
 *
 * There are no audio files: every cue is generated with the Web Audio API, so
 * the game ships as one static bundle. Sound is a pure *reward* channel — it
 * never carries information the interface does not already show — and it can be
 * muted for good, with the preference stored next to the theme.
 */

export type SfxKind =
  | "click"
  | "select"
  | "correct"
  | "wrong"
  | "levelup"
  | "coin"
  | "tick"
  | "start";

let context: AudioContext | null = null;
let enabled = true;

export function setSfxEnabled(value: boolean): void {
  enabled = value;
}

export function isSfxEnabled(): boolean {
  return enabled;
}

type WindowWithWebkitAudio = Window & { webkitAudioContext?: typeof AudioContext };

function audioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    const Ctor =
      window.AudioContext ?? (window as WindowWithWebkitAudio).webkitAudioContext;
    if (!Ctor) return null;
    if (!context) context = new Ctor();
    if (context.state === "suspended") void context.resume();
    return context;
  } catch {
    return null;
  }
}

interface Note {
  freq: number;
  /** Seconds from now. */
  at: number;
  duration: number;
  type?: OscillatorType;
  gain?: number;
  /** Optional glide target frequency. */
  to?: number;
}

function play(notes: Note[]): void {
  const ctx = audioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  for (const note of notes) {
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    const start = now + note.at;
    osc.type = note.type ?? "triangle";
    osc.frequency.setValueAtTime(note.freq, start);
    if (note.to !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, note.to), start + note.duration);
    }
    const peak = note.gain ?? 0.16;
    amp.gain.setValueAtTime(0.0001, start);
    amp.gain.exponentialRampToValueAtTime(peak, start + 0.012);
    amp.gain.exponentialRampToValueAtTime(0.0001, start + note.duration);
    osc.connect(amp).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + note.duration + 0.04);
  }
}

const CUES: Record<SfxKind, () => Note[]> = {
  click: () => [{ freq: 420, at: 0, duration: 0.06, type: "sine", gain: 0.09 }],
  select: () => [{ freq: 620, at: 0, duration: 0.08, type: "sine", gain: 0.1 }],
  tick: () => [{ freq: 880, at: 0, duration: 0.04, type: "square", gain: 0.05 }],
  wrong: () => [
    { freq: 240, to: 150, at: 0, duration: 0.22, type: "sawtooth", gain: 0.12 },
    { freq: 180, to: 110, at: 0.04, duration: 0.24, type: "sawtooth", gain: 0.09 },
  ],
  correct: () => [
    { freq: 523.25, at: 0, duration: 0.12, gain: 0.14 },
    { freq: 659.25, at: 0.08, duration: 0.12, gain: 0.14 },
    { freq: 783.99, at: 0.16, duration: 0.18, gain: 0.15 },
  ],
  levelup: () => [
    { freq: 523.25, at: 0, duration: 0.12, gain: 0.15 },
    { freq: 659.25, at: 0.1, duration: 0.12, gain: 0.15 },
    { freq: 783.99, at: 0.2, duration: 0.12, gain: 0.15 },
    { freq: 1046.5, at: 0.3, duration: 0.32, gain: 0.17 },
  ],
  coin: () => [
    { freq: 987.77, at: 0, duration: 0.09, type: "square", gain: 0.09 },
    { freq: 1318.51, at: 0.07, duration: 0.2, type: "square", gain: 0.09 },
  ],
  start: () => [
    { freq: 392, at: 0, duration: 0.12, gain: 0.12 },
    { freq: 587.33, at: 0.09, duration: 0.2, gain: 0.13 },
  ],
};

export function playSfx(kind: SfxKind): void {
  if (!enabled) return;
  try {
    play(CUES[kind]());
  } catch {
    // Audio is a bonus; it must never break the game.
  }
}
