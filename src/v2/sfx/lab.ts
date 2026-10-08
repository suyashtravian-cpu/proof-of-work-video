import type { Cue } from "../../sfx/cue";

// Scene-relative sound cues for Lab (v2). Beats: 12.9 + n * 0.513 - 31.6.
export const cues: Cue[] = [
  ["whoosh", 0.0, 0.35], // window settles out of the zoom-through
  ["click", 0.794, 0.3], // chapter tag
  ["click", 1.307, 0.55], // ripple on "click"
  ["shimmer", 1.31, 0.18],
  ["whoosh", 1.64, 0.4], // whip to card 1
  ["click", 1.82, 0.45], // 01 The Whole Truth
  ["hit", 2.333, 0.55], // the 4 slams
  ["whoosh", 2.66, 0.28],
  ["click", 2.846, 0.45], // 02 Fix My Curls
  ["whoosh", 3.06, 0.42], // whip-scroll down
  ["click", 3.872, 0.45], // 03 The Pant Project
  ["whoosh", 4.2, 0.28],
  ["click", 4.385, 0.45], // 04 DrinkPrime
  ["shimmer", 4.4, 0.32], // the 4 is full
  ["hit", 4.898, 0.38], // pull back, self-initiated
  ["whoosh", 5.32, 0.5], // zoom-through exit
];
