import type { Cue } from "../../sfx/cue";
import { COUNT, PG_BAR, PG_ENTER, PG_EXIT, TYPE_TICKS } from "../scenes/Playground";

// Scene-relative sound cues for Playground (v2). Times come from src/v2/scenes/Playground.tsx.
export const cues: Cue[] = [
  ["whoosh", 0.58, 0.26], // the page scrolls to the carousel
  ...COUNT.slice(0, 9).map((c): Cue => ["click", c - 0.01, 0.2]), // one tick per experiment
  ["hit", COUNT[9] - 0.01, 0.5], // 10
  ["shimmer", COUNT[9], 0.34],
  ["whoosh", PG_BAR, 0.22], // the URL bar rises
  ...TYPE_TICKS.map((c): Cue => ["click", c, 0.11]), // typing
  ["click", PG_ENTER - 0.04, 0.4], // enter
  ["hit", PG_ENTER, 0.42],
  ["shimmer", PG_ENTER + 0.02, 0.36],
  ["whoosh", PG_EXIT, 0.42], // zoom through into One mind
];
