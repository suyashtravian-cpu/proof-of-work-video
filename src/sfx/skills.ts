import { Cue, range } from "./cue";

// Scene-relative sound cues for skills (times match src/scenes/Skills.tsx).
export const cues: Cue[] = [
  ["whoosh", 0.0, 0.35], // editor flies in from depth
  ...range(0.55, 1.15, 0.1).map((t): Cue => ["click", t, 0.4]), // one strike per skill line
  ["whoosh", 1.22, 0.18], // deleted lines collapse
  ["whoosh", 1.46, 0.5], // editor punched away, page rises
  ["hit", 1.68, 0.85], // "Proof" slam
  ["click", 1.8, 0.3], // tracking box: Biltib
  ["click", 2.12, 0.45], // "of them." slam
  ["whoosh", 2.2, 0.22], // speed-ramp whip
  ["click", 2.26, 0.3], // tracking box: conversion lab
  ["whoosh", 2.62, 0.22], // speed-ramp whip
  ["click", 2.7, 0.3], // tracking box: 112
];
