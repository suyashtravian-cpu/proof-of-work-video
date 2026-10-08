import type { Cue } from "../../sfx/cue";

// Scene-relative sound cues for OneMind (v2). Scene starts at 47.8 s, on the beat.
export const cues: Cue[] = [
  ["whoosh", 0.0, 0.4], // whip in onto the graph
  ["click", 0.2, 0.45], // "Products" node
  ["whoosh", 0.74, 0.2],
  ["click", 0.86, 0.45], // "Stories"
  ["whoosh", 1.4, 0.2],
  ["click", 1.52, 0.45], // "Campaigns"
  ["whoosh", 1.98, 0.2],
  ["click", 2.1, 0.45], // "Experiments"
  ["shimmer", 2.55, 0.35], // wires connect into the centre
  ["hit", 3.06, 0.45], // "One mind." converge
  ["whoosh", 4.0, 0.4],
  ["shimmer", 4.09, 0.3], // "Many directions." burst
  ["whoosh", 5.02, 0.45], // dive into the orb
];
