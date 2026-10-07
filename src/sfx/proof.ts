import { Cue, range } from "./cue";

// Scene-relative sound cues for proof. whoosh.wav peaks 0.24 s in, riser.wav 1.46 s in:
// both are placed so the peak lands on the visual impact.
const W = 0.24;
export const cues: Cue[] = [
  ["shatter", 0.03, 0.7],
  ["whoosh", 0.05, 0.5],
  ["hit", 0.95, 0.8], // window assembles
  ["click", 1.18, 0.25], // "3 live builds" box
  ["whoosh", 1.7 - W, 0.5], // hero whips out, ring flies in
  ["click", 1.98, 0.22],
  ["whoosh", 2.295 - W, 0.3], // ring step → iCreateEpic
  ["click", 2.37, 0.22],
  ["whoosh", 2.735 - W, 0.3], // ring step → Moolank 365
  ["click", 2.81, 0.22],
  ["whoosh", 3.15 - W, 0.55], // fly-through
  ["hit", 3.33, 0.35], // lab window lands
  ["click", 3.38, 0.22],
  ...[4.46, 4.56, 4.66].map((t): Cue => ["click", t, 0.18]),
  ["whoosh", 5.15 - W, 0.4],
  ...[5.36, 5.74, 5.86, 5.98].map((t): Cue => ["click", t, 0.2]),
  ["whoosh", 7.15 - W, 0.42],
  ["click", 7.45, 0.22],
  ...range(8.35, 9.03, 0.068).map((t): Cue => ["click", t, 0.12]), // footage counter ticking
  ["hit", 9.1, 0.5], // 112 lands
  ["click", 9.12, 0.2],
  ["whoosh", 9.75 - W, 0.42],
  ["riser", 11.1 - 1.46, 0.32],
  ["click", 9.98, 0.22],
  ...range(10.35, 11.04, 0.06).map((t): Cue => ["click", t, 0.12]),
  ["hit", 11.1, 1.0], // 1,999 lands
  ["shatter", 11.1, 0.45],
  ["click", 11.22, 0.25],
  ["click", 11.5, 0.22],
  ["whoosh", 13.1 - W, 0.45],
];
