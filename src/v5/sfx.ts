import type { Cue } from "../sfx/cue";
import { CAMPAIGNS_BEATS as CB } from "./scenes/Campaigns";
import { LAB_BEATS as LB } from "./scenes/Lab";
import { MK, MK_EXIT, MK_WHIP } from "./scenes/Making";
import { PG, PG_EXIT } from "./scenes/Playground";
import { END_AT, L, LINES, S, THREE_SPLIT, word } from "./timing";

// Video 2's sound effects, re-cued to the ad (absolute seconds). Voice + effects only, no music.
const one = S.one[0];
const two = S.two[0];
const three = S.three[0];
const pg = S.three[0] + THREE_SPLIT;
const four = S.four[0];
const payoff = S.payoff[0];
const end = S.end[0];

export const SFX5: Cue[] = [
  // HOOK: words fly out of the sky, pull back into the window, "1 person + AI" snaps in
  ["swell", 0.0, 0.45],
  ["whoosh", 0.05, 0.22], // "Most brands hire"
  ["whoosh", word(L.hire, "four") - 0.12, 0.32], // the 4 whips in with the ring
  ["whoosh", word(L.hire, "people") - 0.1, 0.18],
  ["shimmer", word(L.hire, "this") + 0.15, 0.26], // "this?" lands and wobbles
  ["whoosh", 2.12, 0.5], // pull back through the clouds
  ["hit", 2.73, 0.3], // the sky lands inside the site window
  ["click", word(L.person, "one"), 0.42], // "1"
  ["click", word(L.person, "person"), 0.3],
  ["shimmer", word(L.person, "AI"), 0.32], // "+ AI"
  ["riser", 3.95, 0.22], // into the drop

  // ONE: the drop, three live builds
  ["hit", one, 0.62],
  ["shimmer", one + 0.02, 0.3],
  ["click", word(L.products, "one"), 0.3], // 1/4
  ["click", one + 0.78, 0.28], // Biltib callout
  ["whoosh", one + 1.46, 0.42], // whip to Moolank 365
  ["click", word(L.days, "from"), 0.34], // "From an idea."
  ["whoosh", one + 2.69, 0.42], // whip to iCreateEpic
  ["click", one + 3.09, 0.4], // LIVE
  ["whoosh", one + 4.6, 0.4], // everything flies up

  // TWO: the four concept tools
  ["whoosh", two, 0.35],
  ["click", word(L.tools, "two"), 0.3], // 2/4
  ["whoosh", two + LB.c1 - 0.2, 0.36], // whip to card 1, board in
  ["click", two + LB.c1, 0.4],
  ["hit", two + LB.slam, 0.5], // the 4 slams with TOOLS
  ["whoosh", two + LB.c2 - 0.2, 0.3],
  ["click", two + LB.c2, 0.42], // routine quiz
  ["whoosh", two + LB.c2 + 0.19, 0.4], // whip-scroll down
  ["click", two + LB.c4, 0.42], // cost calculator
  ["whoosh", two + LB.c3 - 0.2, 0.3],
  ["click", two + LB.c3, 0.42], // fit finder
  ["shimmer", two + LB.c3 + 0.02, 0.3], // the 4 is full
  ["whoosh", two + LB.out, 0.48], // zoom-through exit

  // THREE: tunnel, creative work, the playground freezes on "stop"
  ["click", three + MK.three - 0.02, 0.32], // "Three." / 3/4
  ["whoosh", three + MK_WHIP - 0.32, 0.5], // the dive into the tunnel
  ["shimmer", three + MK_WHIP, 0.34], // flash into the creative work
  ["hit", three + MK.creative - 0.02, 0.55], // "Creative" slams
  ["click", three + MK.content - 0.02, 0.3],
  ["whoosh", three + MK.and + 0.1, 0.2], // the reel cards fly in
  ["whoosh", three + MK_EXIT - 0.02, 0.46], // whip left into the playground
  ["riser", pg + 0.1, 0.24], // the carousel rushes
  ["hit", pg + PG.stop - 0.01, 0.7], // "stop": the freeze
  ["shatter", pg + PG.stop, 0.18],
  ["click", pg + PG.for - 0.02, 0.28],
  ["whoosh", pg + PG_EXIT, 0.42], // zoom-through into Four

  // FOUR: campaigns, the channels, 1,999 on "pennies"
  ["whoosh", four, 0.4], // window rises in
  ["click", word(L.campaigns, "four"), 0.3], // 4/4
  ["shimmer", four + CB.under, 0.22], // underline "the first people."
  ["whoosh", four + CB.punch - 0.2, 0.42], // whip into the Meta panel
  ["hit", four + CB.punch, 0.38],
  ["click", four + CB.n112, 0.45], // 112 bracket
  ["click", four + CB.spend, 0.4], // spend bracket
  ["click", word(L.channels, "google"), 0.3],
  ["whoosh", four + CB.reddit - 0.1, 0.4], // pull back to the Reddit tab
  ["click", word(L.channels, "reddit"), 0.45],
  ["riser", four + CB.reddit + 0.2, 0.3], // under the count
  ["click", word(L.channels, "amazon"), 0.3],
  ["hit", four + CB.hit, 0.85], // 1,999 lands on "pennies"
  ["shimmer", four + CB.hit + 0.02, 0.35],
  ["click", four + CB.from, 0.5], // FROM $59.17
  ["click", four + CB.tag, 0.32], // Reddit ads · iCreateEpic
  ["whoosh", four + CB.out, 0.5], // zoom-through exit

  // PAYOFF: the graph converges into one centre
  ["whoosh", payoff, 0.4],
  ["click", payoff + 0.06, 0.3], // nodes
  ["click", payoff + 0.2, 0.26],
  ["click", payoff + 0.34, 0.26],
  ["click", payoff + 0.48, 0.26],
  ["shimmer", payoff + 0.62, 0.3], // wires hand over to the centre
  ["hit", word(L.thisAd, "made") - 0.02, 0.5], // converge on "Made"
  ["shimmer", word(L.thisAd, "same"), 0.32], // burst
  ["whoosh", S.payoff[1] - 0.32, 0.45], // dive into the orb

  // END: typed CTA, portal, end card
  ["shimmer", end, 0.3],
  ...LINES[L.see].words.map((x): Cue => ["click", x.s, 0.16]), // typing, one tick per word
  ["whoosh", end + END_AT - 0.4, 0.42], // the ring opens
  ["shimmer", end + END_AT, 0.32], // name rises
  ["click", word(L.tap, "tap"), 0.38], // "Tap the link"
  ["shimmer", end + END_AT + 0.42, 0.3], // the pill
];
