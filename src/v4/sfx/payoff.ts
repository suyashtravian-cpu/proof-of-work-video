import { Cue, range } from "../../sfx/cue";
import { TP } from "../scenes/three-four/beats";

// Scene-relative cues for "payoff" (beats from src/v4/scenes/three-four/beats.ts). Palette/cut sounds live in transitions.ts.
export const cues: Cue[] = [
  ["whoosh", TP.rewind[0], 0.35], // the strip starts rewinding
  ...range(TP.rewind[0] + 0.04, TP.rewind[1] - 0.04, 0.04).map((t): Cue => ["click", t, 0.1]), // frames ticking past
  ["click", TP.rewind[1], 0.35], // lands on 00:00:00
  ["hit", TP.stamp, 1.0], // NEVER OPENED
  ["shatter", TP.stamp, 0.4],
  ["whoosh", TP.flip[0], 0.4], // the strip flips into code
  ["click", TP.made, 0.6], // the AI cursor clicks into the file on "Made"
  ...range(TP.type[0], TP.type[1], 0.04).map((t): Cue => ["click", t, 0.12]), // types this scene's line
  ["click", TP.chip + 0.16, 0.3], // write(payoff) ✓
  ["shimmer", TP.chip + 0.16, 0.25],
];
