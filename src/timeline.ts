// Master edit: scene placement in seconds.
export const JOKE = 1.2; // the "make no mistakes" beat pushes everything after 15s
const J = (t: number) => t + JOKE;

export const SCENES = [
  { name: "Hook", from: 0, to: 6.0 },
  { name: "Résumé", from: 6.0, to: 13.0 },
  { name: "Prompt", from: 13.0, to: J(15.05) },
  { name: "Proof", from: J(15.0), to: J(28.1) },
  { name: "Skills", from: J(28.1), to: J(31.4) },
  { name: "Bet", from: J(31.4), to: J(36.5) },
  { name: "Twist", from: J(36.5), to: J(42.0) },
  { name: "Ship", from: J(42.0), to: J(47.5) },
] as const;

// Voiceover file in public/, or null until the ElevenLabs take arrives.
export const VOICEOVER: string | null = null;
// Music is supplied by the user (generated in ElevenLabs or similar); the edit never generates it.
export const MUSIC: string | null = null;
export const MUSIC_VOLUME = 0.22;

type Cue = [file: "whoosh" | "hit" | "click" | "riser" | "shatter", at: number, volume: number];
const range = (from: number, to: number, step: number) => Array.from({ length: Math.floor((to - from) / step) + 1 }, (_, i) => from + i * step);

export const SFX: Cue[] = [
  ["whoosh", 0.0, 0.35],
  ["hit", 0.88, 0.35],
  ...[2.25, 2.7, 3.15, 3.6].map((t): Cue => ["whoosh", t, 0.3]),
  ["click", 4.45, 0.4],
  ["click", 5.45, 0.4],
  ["whoosh", 5.6, 0.45],
  ["hit", 8.8, 0.65],
  ["hit", 10.1, 0.65],
  ["hit", 11.4, 0.75],
  ...range(13.25, 14.6, 0.085).map((t): Cue => ["click", t, 0.16]),
  ["click", 16.03, 0.55],
  // the joke: slow, heavy keystrokes, then silence, then send
  ...range(14.95, 15.75, 0.05).map((t): Cue => ["click", t, 0.32]),
  ["shatter", J(15.03), 0.7],
  ["whoosh", J(15.05), 0.5],
  ["hit", J(15.95), 0.8],
  ...[16.7, 17.15, 17.6, 18.15, 20.15, 22.15, 24.75].map((t): Cue => ["whoosh", J(t), 0.28]),
  ["click", J(23.35), 0.35],
  ["click", J(25.35), 0.35],
  ["hit", J(26.1), 0.7],
  ["whoosh", J(28.1), 0.3],
  ...range(28.65, 29.25, 0.1).map((t): Cue => ["click", J(t), 0.3]),
  ["whoosh", J(29.7), 0.5],
  ["hit", J(29.8), 0.8],
  ["whoosh", J(31.4), 0.4],
  ["whoosh", J(34.95), 0.3],
  ["hit", J(36.5), 0.5],
  ["whoosh", J(38.0), 0.3],
  ["whoosh", J(42.0), 0.35],
  ["hit", J(43.7), 0.85],
  ["whoosh", J(44.9), 0.35],
];
