import type { Cue } from "../../sfx/cue";
import { AFTER_CLICK, AFTER_EXIT, AFTER_PAN } from "../scenes/After";

// Scene-relative sound cues for After (v2). Times come from src/v2/scenes/After.tsx.
export const cues: Cue[] = [
  ["whoosh", 0.0, 0.26], // the cursor glides in
  ["click", AFTER_CLICK - 0.02, 0.75], // the click
  ["shimmer", AFTER_CLICK, 0.34], // the portal opens onto the page
  ["whoosh", AFTER_PAN, 0.26], // the camera follows "after" into the case cards
  ["whoosh", AFTER_EXIT - 0.04, 0.48], // whip up into Making
];
