import { Cue } from "./cue";

// Scene-relative sound cues for proof.
export const cues: Cue[] = [
  ["shatter", 0.03, 0.7],
  ["whoosh", 0.05, 0.5],
  ["hit", 0.95, 0.8],
  ...[1.7, 2.15, 2.6, 3.15, 5.15, 7.15, 9.75].map((t): Cue => ["whoosh", t, 0.28]),
  ["click", 8.35, 0.35],
  ["click", 10.35, 0.35],
  ["hit", 11.1, 0.7],
];
