import type { Cue } from "../../sfx/cue";

// Scene-relative sound cues for Hook (v2). Times match src/v2/scenes/Hook.tsx + hook-intro/Words.tsx.
export const cues: Cue[] = [
  ["swell", 0.0, 0.45], // deep in the sky, tension under the filtered intro
  ["whoosh", 0.12, 0.3], // "Ideas" flies out of the depth
  ["whoosh", 0.5, 0.22], // "don't" whips in from the side
  ["shimmer", 1.0, 0.28], // "still." lands and wobbles
  ["whoosh", 1.42, 0.5], // pull back through the clouds
  ["hit", 2.03, 0.32], // the sky lands inside the site window
  ["click", 2.4, 0.45], // "I." snaps in
];
