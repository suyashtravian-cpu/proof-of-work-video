import { at, enterAt, L } from "../../timing";

// Beat times for scenes "one" and "two" (Sequence seconds, 0 = the scene's cut).
// Word times come from timing.ts (waveform-corrected); the scenes and their SFX both read these.

// ---------- 1/4 PRODUCTS (4.8–9.75): "One. I build products. | From idea to live in days, not months." ----------
const I_AT = at("one", L.products, "I"); // 0.95
const IDEA = at("one", L.days, "idea"); // 2.36
export const OT = {
  think: enterAt("one") + 0.04, // 0.6: thinking line while the ⌘K palette flies out (0.36 s, gone as Biltib slams)
  /** each live site slams in (deploy() ✓ lands on the slam): "I", between "products" and "From", "idea" */
  slams: [I_AT, I_AT + 0.66, IDEA],
  /** "live": the brackets open around all three builds */
  live: at("one", L.days, "live"), // 3.04
  /** "in": the deck flies back into depth */
  away: at("one", L.days, "in") - 0.06, // 3.33
  days: at("one", L.days, "days"), // 3.56
  not: at("one", L.days, "not"), // 4.24
  months: at("one", L.days, "months"), // 4.45
  /** the AI cursor drags across "months" */
  strike: [at("one", L.days, "months"), at("one", L.days, "months") + 0.24] as const,
};

// ---------- 2/4 TOOLS (9.75–15.45): "Two. Interactive tools that help people decide. | Quizzes. Calculators. Fit finders." ----------
const QUIZ = at("two", L.quizzes, "quizzes"); // 3.29
const CALC = at("two", L.quizzes, "calculators"); // 3.96
const FIT = at("two", L.quizzes, "fit"); // 4.87
export const TT = {
  enter: enterAt("two"), // 0.54
  cursorIn: enterAt("two") + 0.02,
  /** the agent clicks into the prompt and types it */
  focusInput: 0.76,
  type: [0.8, 1.42] as const,
  send: 1.48,
  think: 1.52,
  /** prompt → product: letters fly, the panel splits into three cards */
  morph: 1.94,
  /** last title letter lands */
  land: 2.36,
  /** each card's body renders (scanline) from these times, `renderDur` long; render() ✓ lands at the end */
  render: [2.16, 2.28, 2.4],
  renderDur: 0.26,
  chipsOut: 3.06,
  /** the wheel focuses each tool as it is named */
  focus: [QUIZ - 0.09, CALC - 0.08, FIT - 0.08],
  quiz: QUIZ,
  calc: CALC,
  fit: FIT,
  /** quiz: two answers */
  answers: [QUIZ + 0.16, QUIZ + 0.43],
  /** calculator: grab, drag, release */
  grab: CALC + 0.09,
  release: CALC + 0.56,
  /** fit finder: waist, length, result */
  pickWaist: FIT + 0.11,
  pickLength: FIT + 0.29,
  result: FIT + 0.36,
};
