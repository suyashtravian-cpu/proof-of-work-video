// AdFrontier master clock. Everything is in seconds of the video unless a name says "rel".
// Voice: public/v3/vo-fast.wav (approved take). Word times come from src/v3/vo-fast.json,
// corrected where the aligner was clearly off: every FIX below was measured on the waveform
// (20 ms RMS; the aligner placed several words that follow a pause 0.1-0.4 s late and merged
// "Fit finders" into "calculators").
import VO from "../v3/vo-fast.json";

export const FPS = 30;
export const sec = (s: number) => Math.round(s * FPS);
export const LENGTH = 33.2;
export const VOICE_END = 30.96;

/** Scene placement (video seconds). Each boundary sits in the pause just before its line. */
export const S = {
  hook: [0, 4.8],
  one: [4.8, 9.75],
  two: [9.75, 15.45],
  three: [15.45, 19.22],
  four: [19.22, 26.6],
  payoff: [26.6, 28.95],
  end: [28.95, LENGTH],
} as const;
export type SceneId = keyof typeof S;
export const SCENE_IDS = Object.keys(S) as SceneId[];
/** HUD / palette names for each scene. */
export const SCENE_LABEL: Record<SceneId, string> = {
  hook: "HOOK",
  one: "BUILD PRODUCT",
  two: "DESIGN TOOL",
  three: "CREATE CONTENT",
  four: "LAUNCH CAMPAIGN",
  payoff: "THIS AD",
  end: "SHIP",
};
/** Every scene boundary after 0 (glitch, whoosh and camera fly-through happen here). */
export const CUTS: number[] = SCENE_IDS.slice(1).map((id) => S[id][0]);
export const sceneLen = (id: SceneId) => S[id][1] - S[id][0];
export const sceneAt = (t: number): SceneId => SCENE_IDS.find((id) => t >= S[id][0] && t < S[id][1]) ?? "end";
/** Video seconds → seconds relative to a scene's Sequence. */
export const rel = (id: SceneId, t: number) => t - S[id][0];

// ---------- voice lines ----------
export type VWord = { w: string; s: number; e: number };
export type VLine = { i: number; text: string; t: number; end: number; words: VWord[] };

/** Line indices by a memorable key. */
export const L = {
  hire: 0, // Most brands hire four people for this.
  person: 1, // I'm one person, with AI.
  products: 2, // One. I build products.
  days: 3, // From idea to live in days, not months.
  tools: 4, // Two. Interactive tools that help people decide.
  quizzes: 5, // Quizzes. Calculators. Fit finders.
  creative: 6, // Three. Creative and content people actually stop for.
  campaigns: 7, // Four. Campaigns that bring them in.
  channels: 8, // Meta, Google, Reddit, Amazon.
  pennies: 9, // Clicks for pennies. Real sign-ups.
  thisAd: 10, // And this ad? Made the same way.
  see: 11, // See what I can build for you.
  tap: 12, // Tap the link.
} as const;

const norm = (w: string) => w.toLowerCase().replace(/[^a-z0-9']/g, "");

/** Measured word onsets (line → word index → seconds) and line ends. */
const FIX: Record<number, Record<number, number>> = {
  0: { 2: 0.76, 3: 1.08, 4: 1.47, 5: 1.72, 6: 1.88 }, // hire, four, people, for, this
  1: { 2: 3.08, 4: 3.74 }, // person, AI
  2: { 0: 4.99, 1: 5.75 }, // One, I
  3: { 0: 6.96, 1: 7.16, 2: 7.62, 3: 7.84, 4: 8.19, 5: 8.36, 6: 9.04, 7: 9.25 }, // from … months
  4: { 0: 9.96, 1: 10.6, 2: 11.2, 5: 11.97 }, // Two, Interactive, tools, people
  6: { 1: 16.3, 2: 16.78 }, // Creative, and
  7: { 1: 20.02 }, // Campaigns
  8: { 0: 21.69, 2: 22.91 }, // Meta, Reddit
  9: { 0: 24.42, 2: 24.9, 3: 25.6 }, // Clicks, pennies, Real
  10: { 3: 27.97 }, // Made
  12: { 0: 30.49, 1: 30.64 }, // Tap, the
};
const END_FIX: Record<number, number> = { 0: 2.2, 1: 4.43, 2: 6.68, 3: 9.64, 4: 12.68, 5: 15.32, 6: 19.04, 7: 21.4, 8: 24.01, 9: 26.3, 10: 28.79, 11: 30.28, 12: VOICE_END };
/** "Fit finders" has no timestamp in the take; measured: Fit 14.62, finders 14.8. */
const QUIZ_WORDS = [
  { w: "Quizzes.", s: 13.04, e: 13.52 },
  { w: "Calculators.", s: 13.71, e: 14.42 },
  { w: "Fit", s: 14.62, e: 14.77 },
  { w: "finders.", s: 14.8, e: 15.32 },
];

export const LINES: VLine[] = VO.map((l, i) => {
  const shown = l.text.split(" "); // script spelling and punctuation for display
  const raw = i === L.quizzes ? QUIZ_WORDS : l.words.map((w, k) => ({ ...w, s: FIX[i]?.[k] ?? w.s }));
  if (raw.length !== shown.length) throw new Error(`vo-fast line ${i}: ${raw.length} timed words for "${l.text}"`);
  const end = END_FIX[i] ?? l.end;
  const words = raw.map((w, k) => {
    const next = raw[k + 1]?.s ?? end;
    const e = Math.min(next, Math.max(w.e, w.s + 0.12));
    return { w: shown[k], s: w.s, e: k === raw.length - 1 ? Math.max(e, end) : e };
  });
  return { i, text: l.text, t: words[0].s, end, words };
});

export const line = (i: number) => LINES[i];

const find = (i: number, w: string, nth: number) => {
  const hits = LINES[i].words.filter((x) => norm(x.w).startsWith(norm(w)));
  const hit = hits[nth];
  if (!hit) throw new Error(`word "${w}" (#${nth}) not in line ${i}: "${LINES[i].text}"`);
  return hit;
};
/** Start of a word (video seconds). `w` is a case-insensitive prefix: word(L.channels, "reddit"). */
export const word = (i: number, w: string, nth = 0) => find(i, w, nth).s;
export const wordEnd = (i: number, w: string, nth = 0) => find(i, w, nth).e;
/** Start of a word relative to a scene: at("four", L.channels, "reddit"). */
export const at = (id: SceneId, i: number, w: string, nth = 0) => word(i, w, nth) - S[id][0];

// ---------- ⌘K palette transitions (composition level, see AdFrontier.tsx) ----------
/** Opens on the cut, the agent types the command, ↵ on `select`; the scene arrives from depth right after. */
export const PALETTE: { scene: SceneId; item: number; at: number; select: number }[] = [
  { scene: "one", item: 0, at: S.one[0], select: S.one[0] + 0.52 },
  { scene: "two", item: 1, at: S.two[0], select: S.two[0] + 0.5 },
  { scene: "three", item: 2, at: S.three[0], select: S.three[0] + 0.54 },
  { scene: "four", item: 3, at: S.four[0], select: S.four[0] + 0.54 },
];
/** Sequence seconds at which a scene's own content starts arriving (after the palette's ↵; 0 for scenes without one). */
export const enterAt = (id: SceneId) => {
  const p = PALETTE.find((x) => x.scene === id);
  return p ? +(p.select - S[id][0] + 0.04).toFixed(3) : 0;
};
