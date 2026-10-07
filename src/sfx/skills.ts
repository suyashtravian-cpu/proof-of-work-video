import { Cue, range } from "./cue";

// Scene-relative sound cues for skills.
export const cues: Cue[] = [
  ["whoosh", 0.0, 0.3],
  ...range(0.55, 1.15, 0.1).map((t): Cue => ["click", t, 0.3]),
  ["whoosh", 1.6, 0.5],
  ["hit", 1.7, 0.8],
];
