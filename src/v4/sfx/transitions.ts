import { Cue, range } from "../../sfx/cue";
import { CUTS, PALETTE } from "../timing";

// Absolute-time cues for the composition-level pieces: the fly-through at every cut and the ⌘K palettes.
export const cues: Cue[] = [
  ...CUTS.map((c): Cue => ["whoosh", c - 0.16, 0.4]),
  ...PALETTE.flatMap((p): Cue[] => [
    ["click", p.at + 0.02, 0.3], // palette opens
    ...range(p.at + 0.08, p.select - 0.1, 0.06).map((t): Cue => ["click", t, 0.1]), // the agent types
    ["click", p.select, 0.6], // ↵
    ["whoosh", p.select + 0.04, 0.45], // fly through into the scene
  ]),
];
