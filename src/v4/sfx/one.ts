import { Cue } from "../../sfx/cue";
import { OT } from "../scenes/one-two/beats";

// Scene-relative cues for "one" (seconds from the scene start). Palette/cut sounds live in transitions.ts.
export const cues: Cue[] = [
  ["shimmer", OT.think, 0.2], // thinking · planning 3 deploys…
  ...OT.slams.flatMap((s, i): Cue[] => [
    ["whoosh", s - 0.1, 0.28], // the site flies in
    ["hit", s, i === 0 ? 0.6 : 0.5], // slam, brackets lock
    ["click", s + 0.16, 0.35], // deploy() ✓
  ]),
  ["shimmer", OT.live, 0.3], // 3 / 3 LIVE
  ["click", OT.live, 0.35],
  ["whoosh", OT.away, 0.35], // the deck flies back into depth
  ["hit", OT.days, 0.75], // "days"
  ["click", OT.not, 0.3], // "not months"
  ["click", OT.strike[0], 0.5], // the cursor grabs "months"
  ["whoosh", OT.strike[0] + 0.02, 0.22], // the strike
  ["click", OT.strike[1] + 0.04, 0.3], // release
];
