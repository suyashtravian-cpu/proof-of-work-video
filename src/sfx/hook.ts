import { Cue } from "./cue";

// Scene-relative sound cues for hook.
export const cues: Cue[] = [
  ["whoosh", 0.0, 0.35],
  ["hit", 0.88, 0.35],
  ...[2.25, 2.7, 3.15, 3.6].map((t): Cue => ["whoosh", t, 0.3]),
  ["click", 4.45, 0.4],
  ["click", 5.45, 0.4],
  ["whoosh", 5.6, 0.45],
];
