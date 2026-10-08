import { Cue, range } from "../../sfx/cue";
import { T3 } from "../scenes/three-four/beats";

// Scene-relative cues for "three" (beats from src/v4/scenes/three-four/beats.ts). Palette/cut sounds live in transitions.ts.
export const cues: Cue[] = [
  ["click", T3.grab1, 0.5], // the AI cursor grabs the creative on "Creative"
  ["whoosh", T3.grab1 + 0.02, 0.28], // drag
  ["hit", T3.drop1, 0.32], // drop on the stack
  ["click", T3.drop1 + 0.16, 0.22], // stack(creative) ✓
  ["whoosh", T3.archIn, 0.22], // the archive slides in
  ["click", T3.grab2, 0.5], // grabs it on "content"
  ["whoosh", T3.grab2 + 0.02, 0.28],
  ["hit", T3.drop2, 0.3], // into the stack, behind
  ["click", T3.drop2 + 0.16, 0.22], // stack(archive) ✓
  ["riser", T3.punch - 1.6, 0.22], // builds into "stop"
  ...range(T3.count[0], T3.count[1], (T3.count[1] - T3.count[0]) / 9).map((t): Cue => ["click", t, 0.14]), // 01 → 10
  ["shimmer", T3.count[1], 0.3], // 10
  ["click", T3.stop, 0.6], // the cursor taps the reel on "stop"
  ["hit", T3.punch, 1.0], // punch-in
  ["shatter", T3.punch, 0.3],
];
