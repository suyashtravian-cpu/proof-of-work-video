import type { Cue } from "../../sfx/cue";

// Scene-relative sound cues for Intro (v2), scene starts at 3.3 s.
// Times match src/v2/scenes/Intro.tsx + hook-intro/NameCard.tsx + hook-intro/WhatIf.tsx.
export const cues: Cue[] = [
  ["whoosh", 0.0, 0.25], // "Neither do I." whips off, push toward the name
  ["shimmer", 0.22, 0.22], // name card drops in
  ["whoosh", 1.0, 0.35], // card flips away, window recedes
  ["shimmer", 1.28, 0.3], // "what if?" chip springs in
  ["click", 2.65, 0.6], // pointer clicks the chip
  ["whoosh", 2.7, 0.38], // chip morphs into the page
  ["shimmer", 3.45, 0.2], // tracking bracket finds "Curiosity."
  ["click", 5.15, 0.6], // pointer clicks "Step into my work"
  ["whoosh", 5.45, 0.5], // whip into the manifesto
];
