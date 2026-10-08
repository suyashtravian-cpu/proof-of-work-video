import { Cue, range } from "../../sfx/cue";
import { CARD_AT, HT } from "../scenes/hook/wall";

// Scene-relative cues for the hook (times from src/v4/scenes/hook/wall.ts HT).
export const cues: Cue[] = [
  ["whoosh", 0.0, 0.3], // ECU on the posting
  ["whoosh", HT.whip - 0.04, 0.6], // whip back through the wall
  ["hit", HT.wide, 0.4], // the wall lands
  ...HT.ticks.slice(0, 3).map((t): Cue => ["click", t, 0.4]), // counter 01..03
  ["hit", HT.ticks[3], 0.55], // 04 on "four"
  ["hit", HT.wave, 0.22], // red wave across every posting
  ["whoosh", HT.swing, 0.35], // swing along the wall
  ["whoosh", HT.cursorIn, 0.22], // AI cursor + terminal
  ["click", HT.click1, 0.5],
  ...range(HT.type1[0], HT.type1[1], 0.05).map((t): Cue => ["click", t, 0.12]), // $ hire --team 4
  ["riser", HT.collapse - 1.6, 0.3], // builds into the collapse
  ["hit", HT.freeze, 0.9], // FREEZE on "I'm"
  ["shatter", HT.freeze, 0.3],
  ["click", HT.strike, 0.55], // strike-through on "one"
  ...range(HT.type2[0], HT.type2[1], 0.05).map((t): Cue => ["click", t, 0.12]), // $ suyash --with ai
  ["click", HT.enter, 0.6], // ↵
  ["shimmer", HT.think, 0.22], // thinking
  ["hit", HT.collapse, 1.0], // "AI." the wall collapses
  ["shatter", HT.collapse, 0.6],
  ["whoosh", HT.collapse + 0.02, 0.45],
  ["hit", CARD_AT, 0.45], // the one card
  ["shimmer", CARD_AT, 0.4],
  ...[0, 1, 2, 3].map((i): Cue => ["click", CARD_AT + 0.14 + i * 0.07, 0.25]), // four checks
];
