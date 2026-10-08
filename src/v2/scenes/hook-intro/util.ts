import { Easing, interpolate, spring } from "remotion";
import { REC_H, REC_W } from "../../components/Rec";

// Hook and Intro share one continuous camera. Everything here takes GLOBAL video
// seconds (T), so the cut between the two Sequences at 3.3 s is invisible.
export const HOOK_AT = 0;
export const INTRO_AT = 3.3;

export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const clampOpts = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const tw = (T: number, t0: number, t1: number, a: number, b: number, ease: (x: number) => number = Easing.inOut(Easing.cubic)) =>
  interpolate(T, [t0, t1], [a, b], { ...clampOpts, easing: ease });

/** A spring that starts at global second `at`. */
export const springT = (T: number, at: number, damping = 14, mass = 0.8, stiffness = 110) =>
  T < at ? 0 : spring({ frame: (T - at) * 30, fps: 30, config: { damping, mass, stiffness } });

export const PULL = Easing.bezier(0.62, 0, 0.22, 1);
export const OUT = Easing.out(Easing.cubic);
export const OUT_EXPO = Easing.out(Easing.exp);
export const IN_OUT = Easing.inOut(Easing.cubic);

// The floating site window, as it sits when it lands at the end of the pull-back.
export const WIN_W = 960;
export const CHROME = 40;
export const C = WIN_W / REC_W; // footage px -> window px
export const CONTENT_H = (WIN_W * REC_H) / REC_W;
export const WIN_H = CHROME + CONTENT_H;
export const WIN_CX = 540;
export const WIN_CY = 760;
export const WIN_LEFT = WIN_CX - WIN_W / 2;
export const WIN_TOP = WIN_CY - WIN_H / 2;

/** Pull-back progress: the full-bleed sky collapses into the site window. */
export const pullP = (T: number) => tw(T, 1.45, 2.05, 0, 1, PULL);

export type Pose = { cx: number; cy: number; s: number; rx: number; ry: number; op: number; zoom: number };

/** The window's camera pose after it lands (identity before). */
export const winPose = (T: number): Pose => {
  const live = tw(T, 2.0, 2.6, 0, 1);
  const u = T - 2.0;
  let cx = WIN_CX + live * 6 * Math.sin(u * 1.1 + 1);
  let cy = WIN_CY + live * 9 * Math.sin(u * 1.7);
  let s = 1 + (T > 2.05 ? 0.04 * Math.sin((T - 2.05) * 11) * Math.exp(-(T - 2.05) * 5.5) : 0);
  let rx = live * 3 * Math.sin(u * 1.05 + 0.6);
  let ry = live * 5 * Math.sin(u * 1.3);
  let op = 1;
  s *= 1 + 0.04 * tw(T, 2.1, 3.3, 0, 1, (x) => x);
  // Intro: push in toward the name in the corner of the site.
  const push = tw(T, 3.2, 4.25, 0, 1);
  s *= 1 + 0.16 * push;
  cx += 70 * push;
  cy += 50 * push;
  const zoom = 1 + 0.07 * push;
  // Recede into the sky so the "what if" chip can take the stage.
  const back = tw(T, 4.3, 4.95, 0, 1, Easing.bezier(0.6, 0, 0.2, 1));
  s *= 1 - 0.44 * back;
  cx += -70 * back;
  cy += -330 * back;
  rx += 16 * back;
  op *= 1 - 0.42 * back;
  // Fall away while the chip becomes the next page.
  const gone = tw(T, 5.95, 6.5, 0, 1, Easing.in(Easing.cubic));
  s *= 1 - 0.3 * gone;
  cy += -150 * gone;
  op *= 1 - gone;
  return { cx, cy, s, rx, ry, op, zoom };
};

/** Approximate screen position of a footage pixel inside the posed window (ignores the small tilt). */
export const footToScreen = (T: number, fx: number, fy: number): [number, number] => {
  const p = winPose(T);
  return [p.cx + (fx * C - WIN_W / 2) * p.s, p.cy + (CHROME + fy * C - WIN_H / 2) * p.s];
};

// Hero footage: rec 1.9 s (headline settled) onward, slowed so it never reaches the pan at 4.45 s.
export const HERO_REC_AT = 1.9;
export const HERO_SHOW = 1.8; // global second the footage starts inside the window
export const HERO_RATE = 0.52;
