import { Easing, random } from "remotion";
import { easeInOut, tween } from "../../../components/anim";
import { affineFor, apply, CARDS, FH, FW, layout, type Affine, type Cam } from "../../../scenes/hook/wall";
import { L, word } from "../../timing";

// v1's endless wall (src/scenes/hook/wall.ts: same grid, same pinhole projection), re-shot for the ad:
// ECU on one job posting → whip back → the wall creeps while four roles get counted → swing into a
// receding wall → FREEZE on "I'm" → the agent rewrites the command → everything collapses into one card.

export { affineFor, apply, CARDS, FH, FW, type Affine };

const HIRE = word(L.hire, "hire");
const FOUR = word(L.hire, "four");
export const HT = {
  whip: 0.3,
  wide: 0.62,
  /** the counter ticks 01..04, landing 04 on "four" */
  ticks: [0, 1, 2, 3].map((i) => HIRE + ((FOUR - HIRE) * i) / 3),
  wave: word(L.hire, "people"),
  swing: 1.5,
  cursorIn: 1.94,
  term: 2.02,
  click1: 2.18,
  type1: [2.22, 2.5] as const,
  freeze: word(L.person, "I'm"),
  strike: word(L.person, "one"),
  type2: [2.92, 3.28] as const,
  enter: 3.3,
  think: 3.32,
  collapse: word(L.person, "AI"),
};
/** The one card pops out of the collapse. */
export const CARD_AT = HT.collapse + 0.3;

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const logLerp = (a: number, b: number, k: number) => Math.exp(lerp(Math.log(a), Math.log(b), k));
const mix = (a: Cam, b: Cam, k: number): Cam => ({
  lx: lerp(a.lx, b.lx, k),
  ly: lerp(a.ly, b.ly, k),
  D: logLerp(a.D, b.D, k),
  yaw: lerp(a.yaw, b.yaw, k),
  pitch: lerp(a.pitch, b.pitch, k),
  roll: lerp(a.roll, b.roll, k),
});

// Close-up framing: the whole centre posting fills the frame, "Hiring: Developer" up top.
const ECU: Cam = { lx: 0, ly: -40, D: 1000 / 2.0, yaw: 0, pitch: 0, roll: -4 };
const ECU_END: Cam = { ...ECU, lx: 10, D: 1000 / 1.82, roll: -2.5 };
const WIDE: Cam = { lx: 0, ly: 40, D: 4300, yaw: 13, pitch: -6, roll: 2 };
const SWUNG: Cam = { lx: 760, ly: -160, D: 2700, yaw: 29, pitch: 4, roll: -2.5 };
const whipEase = Easing.bezier(0.75, 0, 0.18, 1);

const liveCam = (t: number): Cam => {
  if (t < HT.whip) return mix(ECU, ECU_END, tween(t, 0, HT.whip, 0, 1, Easing.linear));
  if (t < HT.wide) return mix(ECU_END, WIDE, tween(t, HT.whip, HT.wide, 0, 1, whipEase));
  const creep = tween(t, HT.wide, 2.6, 0, 1, Easing.linear);
  const crept: Cam = { ...WIDE, D: WIDE.D * (1 - 0.08 * creep), yaw: WIDE.yaw + 2 * creep, roll: WIDE.roll - 0.6 * creep };
  if (t < HT.swing) return crept;
  const k = tween(t, HT.swing, HT.swing + 0.8, 0, 1, easeInOut);
  const c = mix(crept, SWUNG, k);
  return { ...c, lx: c.lx + (t - HT.swing) * 420 * k };
};

/** Wall camera: live until the freeze, then held with a barely-there creep. */
export const camAt = (t: number): Cam => {
  if (t < HT.freeze) return liveCam(t);
  const held = liveCam(HT.freeze);
  const k = tween(t, HT.freeze, HT.collapse, 0, 1, Easing.linear);
  return { ...held, D: held.D * (1 - 0.025 * k), roll: held.roll + 0.4 * k };
};

export const ROLES = [
  "Developer",
  "Designer",
  "Content Creator",
  "Marketer",
  "Web Developer",
  "Brand Designer",
  "Video Editor",
  "Copywriter",
  "Growth Marketer",
  "Product Designer",
  "Ads Specialist",
  "Social Media Lead",
  "Frontend Developer",
  "Motion Designer",
  "Content Writer",
  "Performance Marketer",
];

const centreOf = (m: Affine) => apply(m, FW / 2, FH / 2);

/** The four postings that get counted: picked near a screen point at their tick time. */
const pick = (t: number, sx: number, sy: number, taken: number[]) => {
  const placed = layout(camAt(t)).filter((p) => p.onScreen && !taken.includes(p.card.id) && p.m.w > 90);
  let best = placed[0];
  let bd = Infinity;
  for (const p of placed) {
    const c = centreOf(p.m);
    const d = Math.hypot(c.x - sx, c.y - sy);
    if (d < bd) {
      bd = d;
      best = p;
    }
  }
  return best.card.id;
};
const AIMS: [number, number][] = [
  [300, 760],
  [790, 640],
  [330, 1190],
  [800, 1080],
];
export const TRACKED: { id: number; role: string; at: number }[] = [];
AIMS.forEach(([x, y], i) => TRACKED.push({ id: pick(HT.ticks[i], x, y, TRACKED.map((r) => r.id)), role: ROLES[i], at: HT.ticks[i] }));

export const HERO_ID = CARDS.findIndex((c) => c.X === 0 && c.Y === 0);
export const roleOf = (id: number) => {
  if (id === HERO_ID) return "Developer";
  const tr = TRACKED.find((r) => r.id === id);
  return tr ? tr.role : ROLES[Math.floor(random(`role${id}`) * ROLES.length)];
};

export { layout };
