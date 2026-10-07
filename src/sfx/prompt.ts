import { Cue, range } from "./cue";

// Scene-relative sound cues for prompt.
export const cues: Cue[] = [
  ...range(0.25, 1.6, 0.085).map((t): Cue => ["click", t, 0.16]),
  // the joke: slow, heavy keystrokes, then silence, then send
  ...range(1.95, 2.75, 0.05).map((t): Cue => ["click", t, 0.32]),
  ["click", 3.03, 0.55],
];
