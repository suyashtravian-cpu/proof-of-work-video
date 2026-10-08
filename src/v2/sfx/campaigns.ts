import type { Cue } from "../../sfx/cue";

// Scene-relative sound cues for Campaigns (v2). Beats: 12.9 + n * 0.513 - 24.3.
export const cues: Cue[] = [
  ["whoosh", 0.0, 0.4], // window rises in
  ["shimmer", 0.91, 0.22], // underline on "the first people."
  ["whoosh", 1.74, 0.45], // whip into the Moolank panel
  ["hit", 1.938, 0.4],
  ["click", 2.451, 0.5], // 112 bracket
  ["click", 2.964, 0.5], // spend bracket
  ["click", 3.477, 0.35], // date tag
  ["whoosh", 3.86, 0.42], // pull back to the tabs
  ["click", 4.15, 0.5], // Reddit tab ring
  ["riser", 3.42, 0.3], // under the count
  ["hit", 5.016, 0.85], // 1,999 lands
  ["shimmer", 5.03, 0.35],
  ["click", 6.042, 0.55], // FROM $59.17
  ["click", 6.555, 0.35], // iCreateEpic tag
  ["whoosh", 6.98, 0.5], // zoom-through exit
];
