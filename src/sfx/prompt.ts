import { Cue, range } from "./cue";

// Scene-relative sound cues for prompt.
export const cues: Cue[] = [
  ...range(0.25, 1.6, 0.085).map((t): Cue => ["click", t, 0.16]),
  // the joke: punch-in, slow heavy keystrokes, then silence, then send
  ["whoosh", 1.88, 0.2],
  ...range(1.95, 2.75, 0.05).map((t): Cue => ["click", t, 0.32]),
  ["click", 3.03, 0.55],
  ["whoosh", 3.05, 0.55], // token burst rushes past camera
];
