import { Cue, range } from "./cue";

// Scene-relative sound cues for ship (beats from src/scenes/Ship.tsx).
export const cues: Cue[] = [
  ["whoosh", 0.0, 0.3], // "I"
  ["click", 0.14, 0.3], // "don't"
  ["click", 0.36, 0.3], // "just"
  ["hit", 0.55, 0.35], // "talk" slams (hollow)
  ["click", 0.85, 0.3], // "about"
  ["hit", 1.02, 0.25], // "AI."
  ["riser", 0.1, 0.3], // deploy builds toward the hit (1.6 s riser ends at 1.7)
  ["hit", 1.7, 1.0], // "I ship with it." + ✓ shipped
  ["shatter", 1.7, 0.7],
  ["whoosh", 2.82, 0.45], // glitch out to the end card
  ...range(2.95, 3.45, 0.05).map((t): Cue => ["click", t, 0.1]), // name decodes
  ["hit", 3.6, 0.3], // URL pill pops
  ["click", 4.55, 0.5], // cursor clicks the link
];
