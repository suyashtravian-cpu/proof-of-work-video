// AdIdeas master clock: video 2's look ("Ideas don't sit still") re-texted into the paid Meta ad.
// Voice: public/v3/vo-fast.wav. Scene slots and corrected word onsets come from src/v4/timing.ts.
import type { Line } from "../script";
import { L, LINES, LENGTH, S, VOICE_END, at, sec, word, type SceneId } from "../v4/timing";

export { L, LINES, LENGTH, S, VOICE_END, at, sec, word };
export type { SceneId };

/** The "three" slot holds two of video 2's scenes: Making, then Playground from here (slot seconds). */
export const THREE_SPLIT = 2.0;
/** Inside the "end" slot: Cta until the portal has opened, then the End card (slot seconds). */
export const END_AT = 1.4;

/** Lines the scenes typeset themselves, so the caption track skips them. */
const KINETIC = new Set<number>([L.hire, L.person, L.creative, L.channels, L.thisAd, L.see, L.tap]);

/** Caption lines in the shape src/components/Captions expects (real word onsets). */
export const LINES5: Line[] = LINES.map((l) => ({
  t: l.t,
  end: l.end,
  text: l.text,
  words: l.words.map((w) => ({ w: w.w, s: w.s, e: w.e })),
  ...(KINETIC.has(l.i) ? { kinetic: true } : {}),
}));
