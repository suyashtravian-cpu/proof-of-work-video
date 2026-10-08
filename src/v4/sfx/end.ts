import { Cue, range } from "../../sfx/cue";
import { at, L } from "../timing";

// Scene-relative cues for the end card (beats from src/v4/scenes/End.tsx).
const TAP = at("end", L.tap, "tap");
export const cues: Cue[] = [
  ["hit", 0.02, 1.0], // ✓ shipped
  ["shatter", 0.02, 0.55],
  ["whoosh", 0.24, 0.3], // pill flies up into the badge
  ["swell", 0.1, 0.3], // orb rises into the button
  ...range(0.3, 0.72, 0.06).map((t): Cue => ["click", t, 0.08]), // name decodes
  ["shimmer", 0.46, 0.4], // button opens
  ...range(0.95, 1.38, 0.06).map((t): Cue => ["click", t, 0.1]), // URL types
  ["click", TAP, 0.6], // the AI cursor taps the button on "Tap"
  ["hit", TAP, 0.5],
  ["shimmer", TAP + 0.05, 0.3],
];
