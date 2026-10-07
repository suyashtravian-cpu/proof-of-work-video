import { Easing } from "remotion";

export type Rect = { x: number; y: number; w: number; h: number };

export const CYAN = "#33e1ff";
export const BAR = 46;
/** Main window: width, content height, screen centre y. */
export const FW = 1000;
export const FCH = (FW * 900) / 1440;
export const FCY = 990;
export const frameRect: Rect = { x: (1080 - FW) / 2, y: FCY - (FCH + BAR) / 2, w: FW, h: FCH + BAR };
/** Triptych cards. */
export const CW = 720;
export const CCY = 1000;

export const easeIn3 = Easing.in(Easing.cubic);
export const whipEase = Easing.inOut(Easing.poly(4));

export type View = { w: number; cy: number; x?: number; s?: number; zoom?: number; ox?: number; oy?: number };

/** Map a footage pixel (1440×900 capture space) to screen space for a flat browser window. */
export const footToScreen = (v: View) => (fx: number, fy: number): [number, number] => {
  const k = v.w / 1440;
  const ch = (v.w * 900) / 1440;
  const zoom = v.zoom ?? 1;
  const ox = v.ox ?? v.w / 2;
  const oy = v.oy ?? ch / 2;
  const cx = ox + (fx * k - ox) * zoom;
  const cy = oy + (fy * k - oy) * zoom;
  const s = v.s ?? 1;
  const px = -v.w / 2 + cx;
  const py = -(ch + BAR) / 2 + BAR + cy;
  return [540 + (v.x ?? 0) + px * s, v.cy + py * s];
};

export const footRect = (v: View, x0: number, y0: number, x1: number, y1: number): Rect => {
  const m = footToScreen(v);
  const [a, b] = m(x0, y0);
  const [c, d] = m(x1, y1);
  return { x: a, y: b, w: c - a, h: d - b };
};

/** Whip pan around cut time c: old shot accelerates out, new one decelerates in (a speed ramp). */
export const whip = (t: number, c: number, D: number, sign: number, outDur = 0.14, inDur = 0.32) => {
  if (t >= c - outDur && t < c) {
    const u = (t - (c - outDur)) / outDur;
    return { off: -sign * D * u * u * u, speed: u * u };
  }
  if (t >= c && t < c + inDur) {
    const v = (t - c) / inDur;
    return { off: sign * D * Math.pow(1 - v, 4), speed: Math.pow(1 - v, 3) };
  }
  return null;
};
