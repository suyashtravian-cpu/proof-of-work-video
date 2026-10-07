import { Cue, range } from "./cue";

// Scene-relative sound cues for hook (times match src/scenes/Hook.tsx + hook/UploadHero.tsx).
export const cues: Cue[] = [
  ["whoosh", 0.0, 0.35], // file dragged into the field (ECU)
  ["whoosh", 0.28, 0.6], // whip back through the wall
  ["hit", 0.58, 0.95], // FREEZE on "stopped"
  ...range(0.86, 1.26, 0.08).map((t): Cue => ["click", t, 0.16]), // typing `rm resume_final_v7.pdf`
  ["click", 1.34, 0.55], // enter
  ["shatter", 1.38, 0.65], // the PDF glitches out of existence
  ["whoosh", 2.0, 0.45], // wall swings + subliminal site flash
  ["hit", 2.42, 0.3], // first red ripple
  ["riser", 2.62, 0.4], // builds into the punch-through
  ["hit", 3.52, 0.5], // "same" ripple
  ["whoosh", 4.1, 0.6], // punch through the wall
  ["hit", 4.4, 0.9], // impact: "Upload your résumé."
  ["click", 4.62, 0.6], // file drops into the field
  ["hit", 4.62, 0.25],
  ["click", 5.33, 0.5], // upload complete
  ["whoosh", 5.48, 0.55], // push into the PDF
];
