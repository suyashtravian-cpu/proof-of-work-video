import type { CaptionLine } from "./kit/TokenCaptions";
import { L, LINES } from "./timing";

// Token-stream captions for every voice line. Override per line here (hide a line when the same
// words are already the hero on screen; red = word indices drawn in the accent).
const OVERRIDES: Partial<Record<number, Partial<CaptionLine>>> = {
  [L.person]: { red: [4] }, // "AI."
  [L.see]: { hide: true }, // the end card's button streams these words
  [L.tap]: { hide: true }, // "Tap the link ↓" is on the end card
};

export const CAPTIONS: CaptionLine[] = LINES.map((l) => ({ t: l.t, end: l.end, words: l.words, ...OVERRIDES[l.i] }));
