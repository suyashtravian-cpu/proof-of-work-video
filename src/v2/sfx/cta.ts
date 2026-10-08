import type { Cue } from "../../sfx/cue";

// Scene-relative sound cues for Cta (v2). Scene starts at 53.2 s.
export const cues: Cue[] = [
  ["shimmer", 0.0, 0.3], // out of the flash, through the ring
  ["click", 0.2, 0.22], // typing "So..."
  ["click", 0.42, 0.18],
  ["click", 0.55, 0.18],
  ["click", 0.68, 0.18],
  ["click", 0.92, 0.2], // "got a"
  ["click", 1.1, 0.18],
  ["click", 1.28, 0.2], // "what if?"
  ["click", 1.5, 0.18],
  ["click", 1.8, 0.25],
  ["whoosh", 2.14, 0.45], // whip to the real headline
  ["click", 3.25, 0.5], // pointer clicks the button
  ["hit", 3.305, 0.55], // "real." on the beat
  ["whoosh", 3.74, 0.4], // portal opens
];
