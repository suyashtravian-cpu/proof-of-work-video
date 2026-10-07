import { Cue, range } from "./cue";

// Scene-relative sound cues for bet (times match src/scenes/Bet.tsx).
export const cues: Cue[] = [
  ["whoosh", 0.0, 0.45], // phone + orbit fling in
  ...[0.25, 0.4, 0.55, 0.7].map((t): Cue => ["click", t + 0.55, 0.3]), // stat counters land
  ["whoosh", 2.55, 0.28], // orbit recedes, phone slides
  ["click", 2.88, 0.45], // PDF drops in
  ["whoosh", 3.55, 0.32], // PDF shrinks
  ...range(3.95, 4.25, 0.05).map((t): Cue => ["click", t, 0.25]), // typing rm resume.pdf
  ["hit", 4.32, 0.85], // glitch-delete
  ["shatter", 4.32, 0.7],
  ["whoosh", 4.62, 0.42], // orbit whip into the cut
];
