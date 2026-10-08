import { Cue, range } from "../../sfx/cue";
import { TT } from "../scenes/one-two/beats";

// Scene-relative cues for "two" (seconds from the scene start). Palette/cut sounds live in transitions.ts.
export const cues: Cue[] = [
  ["click", TT.focusInput, 0.4], // the cursor clicks into the prompt
  ...range(TT.type[0], TT.type[1], 0.045).map((t): Cue => ["click", t, 0.1]), // the agent types
  ["click", TT.send, 0.6], // send
  ["shimmer", TT.think, 0.22], // thinking · planning 3 tools…
  ["whoosh", TT.morph, 0.45], // prompt → product
  ["shatter", TT.morph, 0.25],
  ["hit", TT.land, 0.35], // titles land
  ...TT.render.map((r): Cue => ["click", r + TT.renderDur, 0.32]), // render() ✓
  ["shimmer", TT.render[2] + TT.renderDur, 0.18],
  ["whoosh", TT.focus[0], 0.22], // the wheel brings the quiz forward
  ...TT.answers.map((a): Cue => ["click", a, 0.45]),
  ["whoosh", TT.focus[1], 0.22], // calculator
  ["click", TT.grab, 0.4],
  ...range(TT.grab + 0.08, TT.release - 0.04, 0.07).map((t): Cue => ["click", t, 0.08]), // slider ticks
  ["click", TT.release, 0.3],
  ["whoosh", TT.focus[2], 0.22], // fit finder
  ["click", TT.pickWaist, 0.45],
  ["click", TT.pickLength, 0.45],
  ["hit", TT.result, 0.4], // ✓ 32 / Regular
  ["shimmer", TT.result, 0.2],
];
