import { Cue, range } from "./cue";

// Scene-relative sound cues for resume.
export const cues: Cue[] = [
  ["whoosh", 0.0, 0.35], // page flies in
  ...range(0.05, 0.47, 0.06).map((t): Cue => ["click", t, 0.12]), // terminal command
  ["riser", 0.3, 0.22], // scan beam
  ["click", 0.8, 0.45], // EXPERIENCE box snaps
  ...range(0.82, 1.14, 0.07).map((t): Cue => ["click", t, 0.1]), // key typing
  ["click", 1.18, 0.3],
  ["click", 1.28, 0.3],
  ["click", 1.38, 0.3], // bars land in the array
  ["click", 1.5, 0.6], // ✓ FOUND
  ["whoosh", 1.85, 0.28], // red re-scan
  ["whoosh", 2.48, 0.32], // regroup
  ["hit", 2.8, 0.7],
  ["hit", 4.1, 0.7],
  ["hit", 5.4, 0.8],
  ["shatter", 5.82, 0.45], // ASCII dissolve
  ["shatter", 6.5, 0.6], // glyphs blow out
  ["whoosh", 6.6, 0.5], // speed ramp into the cut
];
