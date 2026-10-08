import { Easing } from "remotion";

// Shared helpers for the OneMind / Cta / End scenes (v2).

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
export const prog = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));

export const eIO = Easing.inOut(Easing.cubic);
export const eOut = Easing.out(Easing.cubic);
export const eOutExpo = Easing.out(Easing.exp);
export const eIn = Easing.in(Easing.cubic);
export const eInQuint = Easing.in(Easing.poly(5));
export const eOutBack = Easing.out(Easing.back(1.7));
/** Fast whip: almost all of the travel happens in the middle third. */
export const eWhip = Easing.bezier(0.7, 0, 0.2, 1);

/** Damped spring 0 -> 1 (overshoots), `at` and t in seconds. */
export const springAt = (t: number, at: number, freq = 9, damp = 7) => {
  const x = t - at;
  if (x <= 0) return 0;
  return 1 - Math.exp(-damp * x) * Math.cos(freq * x);
};

/** Music grid (Electro Dreams): drop at 12.9 s, a beat every 0.513 s. */
export const beatsBetween = (from: number, to: number, sceneFrom: number) => {
  const out: number[] = [];
  for (let n = 0; n < 200; n++) {
    const b = 12.9 + n * 0.513;
    if (b >= from && b < to) out.push(+(b - sceneFrom).toFixed(3));
  }
  return out;
};

/** 0..1 bump that decays after `at` (for beat pulses). */
export const bump = (t: number, at: number, dur = 0.35) => {
  const x = t - at;
  if (x < 0 || x > dur) return 0;
  return (1 - x / dur) ** 2;
};

// ---- Camera over the 1708x1080 recording -------------------------------------------------

export type Cam = { cx: number; cy: number; s: number; r: number; fx: number; fy: number; ry: number; rx: number };
export type CamKey = Partial<Cam> & { t: number; cx: number; cy: number; s: number; ease?: (x: number) => number };

const full = (k: CamKey): Cam => ({ cx: k.cx, cy: k.cy, s: k.s, r: k.r ?? 0, fx: k.fx ?? 540, fy: k.fy ?? 960, ry: k.ry ?? 0, rx: k.rx ?? 0 });

/** Keyframed camera. Each key's `ease` shapes the move that arrives at it. Zoom interpolates in log space. */
export const camAt = (t: number, keys: CamKey[]): Cam => {
  if (t <= keys[0].t) return full(keys[0]);
  for (let i = 0; i < keys.length - 1; i++) {
    const a = full(keys[i]);
    const b = full(keys[i + 1]);
    if (t <= keys[i + 1].t) {
      const p = (keys[i + 1].ease ?? eIO)(prog(t, keys[i].t, keys[i + 1].t));
      return {
        cx: lerp(a.cx, b.cx, p),
        cy: lerp(a.cy, b.cy, p),
        s: Math.exp(lerp(Math.log(a.s), Math.log(b.s), p)),
        r: lerp(a.r, b.r, p),
        fx: lerp(a.fx, b.fx, p),
        fy: lerp(a.fy, b.fy, p),
        ry: lerp(a.ry, b.ry, p),
        rx: lerp(a.rx, b.rx, p),
      };
    }
  }
  return full(keys[keys.length - 1]);
};

/** CSS transform placing recording point (cx, cy) at screen (fx, fy); apply with transformOrigin "0 0". */
export const camCss = (c: Cam) =>
  `translate(${c.fx}px, ${c.fy}px) rotateX(${c.rx}deg) rotateY(${c.ry}deg) rotate(${c.r}deg) scale(${c.s}) translate(${-c.cx}px, ${-c.cy}px)`;

/** Recording point -> screen point (2D part of the camera only; ignores rx / ry). */
export const toScreen = (c: Cam, x: number, y: number): [number, number] => {
  const a = (c.r * Math.PI) / 180;
  const dx = (x - c.cx) * c.s;
  const dy = (y - c.cy) * c.s;
  return [c.fx + dx * Math.cos(a) - dy * Math.sin(a), c.fy + dx * Math.sin(a) + dy * Math.cos(a)];
};

/** How far (screen px) the image under the screen centre moved in the last frame: drives motion blur. */
export const camSpeed = (t: number, keys: CamKey[]) => {
  const now = camAt(t, keys);
  const prev = camAt(t - 1 / 30, keys);
  // A point at the screen centre now, in recording space:
  const a = (-now.r * Math.PI) / 180;
  const sx = (540 - now.fx) / now.s;
  const sy = (960 - now.fy) / now.s;
  const px = now.cx + sx * Math.cos(a) - sy * Math.sin(a);
  const py = now.cy + sx * Math.sin(a) + sy * Math.cos(a);
  const [qx, qy] = toScreen(prev, px, py);
  return Math.hypot(qx - 540, qy - 960);
};
