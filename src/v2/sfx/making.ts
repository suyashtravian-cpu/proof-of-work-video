import type { Cue } from "../../sfx/cue";
import { MK, MK_EXIT, MK_WHIP } from "../scenes/Making";

// Scene-relative sound cues for Making (v2). Times come from src/v2/scenes/Making.tsx.
export const cues: Cue[] = [
  ["click", MK.little - 0.02, 0.28], // "A little" flips up
  ["hit", MK.strategy - 0.02, 0.38], // "strategy." lands
  ["whoosh", MK_WHIP - 0.32, 0.5], // the dive into the tunnel
  ["shimmer", MK_WHIP, 0.34], // flash into the creative work
  ["hit", MK.making - 0.02, 0.58], // "making." slams
  ["whoosh", MK.making + 0.06, 0.2], // the reel cards fly in
  ["whoosh", MK_EXIT - 0.02, 0.48], // whip left into Playground
];
