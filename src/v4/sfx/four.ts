import { Cue, range } from "../../sfx/cue";
import { T4 } from "../scenes/three-four/beats";

// Scene-relative cues for "four" (beats from src/v4/scenes/three-four/beats.ts). Palette/cut sounds live in transitions.ts.
const CLICKS = [T4.clicks.meta, T4.clicks.google, T4.clicks.reddit, T4.clicks.amazon];
export const cues: Cue[] = [
  ["whoosh", T4.pan[0], 0.22], // the camera drops from the headline to the tabs
  ["shimmer", T4.think, 0.22], // thinking
  ...CLICKS.flatMap((c): Cue[] => [
    ["click", c, 0.6], // the AI cursor clicks the real tab
    ["hit", c, 0.18],
    ["click", c + 0.16, 0.2], // click(tab) ✓
  ]),
  ["riser", T4.land - 1.6, 0.26], // builds into "Clicks"
  ["whoosh", T4.recede, 0.35], // the browser steps back
  ...range(T4.recede, T4.land - 0.04, 0.05).map((t): Cue => ["click", t, 0.1]), // 1,999 decodes
  ["hit", T4.land, 1.0], // 1,999 lands
  ["shatter", T4.land, 0.45],
  ["click", T4.snap, 0.45], // ✓ snapshot stamp
  ["hit", T4.pennies, 0.65], // $0.03 / click
  ["shimmer", T4.real, 0.5], // the sign-up notification
  ["click", T4.real, 0.3],
];
