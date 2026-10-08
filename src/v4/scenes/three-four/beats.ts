import { at, enterAt, L, S } from "../../timing";

// Beat times for scenes three, four and payoff (Sequence seconds), shared by the scenes and their SFX.

/**
 * "stop": the aligner puts it at 18.31. Measured on the waveform (4-11 kHz band): the "s" runs
 * 18.38-18.52, the vowel lands at 18.58, "for" at 18.78.
 */
const STOP_S = 18.38;

/** 3/4 CREATIVE (15.45-19.22) "Three. Creative and content people actually stop for." */
export const T3 = {
  enter: enterAt("three"), // 0.58
  /** the AI cursor grabs the creative window on "Creative" */
  grab1: at("three", L.creative, "creative"),
  drop1: 1.22,
  /** the experiment archive slides in from the right */
  archIn: 1.1,
  /** grabs the archive on "content" */
  grab2: at("three", L.creative, "content"),
  drop2: 1.92,
  /** experiment counter ticks 01 → 10 */
  count: [2.3, 2.74] as const,
  /** the cursor clicks the reel on the "s" of "stop"; the camera punches in on the vowel */
  stop: STOP_S - S.three[0],
  punch: STOP_S - S.three[0] + 0.05,
  end: S.three[1] - S.three[0],
};

/** 4/4 CAMPAIGNS (19.22-26.6) "Four. Campaigns that bring them in. | Meta, Google, Reddit, Amazon. | Clicks for pennies. Real sign-ups." */
const meta = at("four", L.channels, "meta");
const google = at("four", L.channels, "google");
const reddit = at("four", L.channels, "reddit");
const amazon = at("four", L.channels, "amazon");
const clicks = at("four", L.pennies, "clicks");
export const T4 = {
  enter: enterAt("four"), // 0.58
  campaigns: at("four", L.campaigns, "campaigns"),
  /** inner camera pans from the "Then I put it in front of people." headline down to the tabs */
  pan: [1.86, 2.32] as const,
  cursorIn: 1.86,
  think: 1.98,
  /** the AI cursor clicks each real tab as the channel is spoken */
  clicks: { meta, google, reddit, amazon },
  /** the browser steps back; 1,999 decodes and lands on "Clicks" */
  recede: clicks - 0.36,
  land: clicks,
  snap: clicks + 0.1,
  pennies: at("four", L.pennies, "pennies"),
  real: at("four", L.pennies, "real"),
  end: S.four[1] - S.four[0],
};

/** PAYOFF (26.6-28.95) "And this ad? Made the same way." */
export const TP = {
  rewind: [0.04, 0.6] as const,
  ad: at("payoff", L.thisAd, "ad"),
  stamp: 0.76,
  flip: [1.1, 1.36] as const,
  made: at("payoff", L.thisAd, "made"),
  type: [1.43, 1.8] as const,
  chip: 1.84,
  end: S.payoff[1] - S.payoff[0],
};
