import { Easing, random } from "remotion";
import { easeInOut, tween } from "../../components/anim";

// An "infinite" wall of identical job-application forms, rendered in 2.5D: every
// card is projected through a pinhole camera and drawn with a plain 2D affine
// matrix (crisp text, no 3D compositing layers).

export const FW = 560; // card size in world units (= px at scale 1)
export const FH = 630;
const PX = 640; // grid pitch
const PY = 720;
const F = 1000; // focal length: scale 1 at distance 1000

// Upload drop zone inside a card (local px).
export const DZ = { x: 40, y: 262, w: 480, h: 196 };

export const TITLES = [
  "Growth Marketer",
  "Product Analyst",
  "Brand Strategist",
  "Content Lead",
  "Marketing Associate",
  "Data Analyst",
  "UX Designer",
  "Product Manager",
  "Performance Marketer",
  "Operations Lead",
  "Account Manager",
  "Business Analyst",
  "Social Media Manager",
  "Copywriter",
  "Growth Associate",
  "Program Manager",
  "Strategy Analyst",
  "Creative Lead",
  "Community Manager",
  "Product Marketer",
  "Research Analyst",
  "AI Generalist",
  "Founder's Office",
  "Brand Manager",
];

export type Card = { id: number; X: number; Y: number; title: string };

export const CARDS: Card[] = [];
for (let j = -9; j <= 9; j++) {
  for (let i = -13; i <= 13; i++) {
    const id = CARDS.length;
    const title = i === 0 && j === 0 ? "Growth Marketer" : TITLES[Math.floor(random(`ttl${i}_${j}`) * TITLES.length)];
    CARDS.push({ id, X: i * PX, Y: j * PY, title });
  }
}

export type Cam = { lx: number; ly: number; D: number; yaw: number; pitch: number; roll: number };

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const logLerp = (a: number, b: number, k: number) => Math.exp(lerp(Math.log(a), Math.log(b), k));
const mixCam = (a: Cam, b: Cam, k: number, kD = k): Cam => ({
  lx: lerp(a.lx, b.lx, k),
  ly: lerp(a.ly, b.ly, k),
  D: logLerp(a.D, b.D, kD),
  yaw: lerp(a.yaw, b.yaw, k),
  pitch: lerp(a.pitch, b.pitch, k),
  roll: lerp(a.roll, b.roll, k),
});

// Look-at for the opening extreme close-up: the "Upload your résumé *" label of the centre card.
const ECU: Cam = { lx: 174 - FW / 2, ly: 351 - FH / 2, D: F / 3.5, yaw: 0, pitch: 0, roll: -4 };
const ECU_END: Cam = { ...ECU, lx: ECU.lx + 14, D: F / 3.15, roll: -2.5 };
const FROZEN: Cam = { lx: 0, ly: 40, D: 6100, yaw: 13, pitch: -6, roll: 2 };
const whipEase = Easing.bezier(0.75, 0, 0.18, 1);

/** Camera before the punch-through (no dependency on the punch target). */
const baseCam = (t: number): Cam => {
  if (t < 0.3) return mixCam(ECU, ECU_END, tween(t, 0, 0.3, 0, 1, Easing.linear));
  if (t < 0.58) return mixCam(ECU_END, FROZEN, tween(t, 0.3, 0.58, 0, 1, whipEase));
  // freeze, then a slow creep so nothing is ever fully static
  const creep = tween(t, 0.92, 2.0, 0, 1, Easing.linear);
  const frozen: Cam = { ...FROZEN, D: FROZEN.D * (1 - 0.07 * creep), yaw: FROZEN.yaw + 2 * creep, roll: FROZEN.roll - 0.6 * creep };
  if (t < 2.0) return frozen;
  // swing into a steep receding wall, then truck along it
  const k = tween(t, 2.0, 2.85, 0, 1, easeInOut);
  const truck = (t - 2.0) * 380;
  const swung: Cam = { lx: 900, ly: -180, D: 2700, yaw: 30, pitch: 4, roll: -2.5 };
  const c = mixCam(frozen, swung, k);
  return { ...c, lx: c.lx + truck * k, yaw: c.yaw + (t - 2.85 > 0 ? (t - 2.85) * 1.6 : 0) };
};

export const PUNCH_AT = 4.12;
export const PUNCH_END = 4.4;

export type Affine = { a: number; b: number; c: number; d: number; e: number; f: number; depth: number; w: number };

const project = (cam: Cam, X: number, Y: number) => {
  const yaw = (cam.yaw * Math.PI) / 180;
  const pit = (cam.pitch * Math.PI) / 180;
  const dx = X - cam.lx;
  const dy = Y - cam.ly;
  const x1 = dx * Math.cos(yaw);
  const z1 = dx * Math.sin(yaw);
  const y2 = dy * Math.cos(pit) - z1 * Math.sin(pit);
  const z2 = dy * Math.sin(pit) + z1 * Math.cos(pit);
  const depth = cam.D + z2;
  const s = F / Math.max(1, depth);
  return { x: 540 + x1 * s, y: 960 + y2 * s, depth };
};

/** 2D affine fit of a card's projection (maps card-local px to screen px). Null when behind the camera. */
export const affineFor = (cam: Cam, X: number, Y: number, lift = 0): Affine | null => {
  const hx = FW / 2;
  const hy = FH / 2;
  const p0 = project(cam, X, Y);
  const r = project(cam, X + hx, Y);
  const l = project(cam, X - hx, Y);
  const dn = project(cam, X, Y + hy);
  const up = project(cam, X, Y - hy);
  const near = 40;
  if (p0.depth < near || r.depth < near || l.depth < near || dn.depth < near || up.depth < near) return null;
  const g = 1 + lift;
  const a = ((r.x - l.x) / FW) * g;
  const b = ((r.y - l.y) / FW) * g;
  const c = ((dn.x - up.x) / FH) * g;
  const d = ((dn.y - up.y) / FH) * g;
  return { a, b, c, d, e: p0.x - a * hx - c * hy, f: p0.y - b * hx - d * hy, depth: p0.depth, w: Math.hypot(a, b) * FW };
};

export const apply = (m: Affine, u: number, v: number) => ({ x: m.a * u + m.c * v + m.e, y: m.b * u + m.d * v + m.f });

const bbox = (m: Affine, rect = { x: 0, y: 0, w: FW, h: FH }) => {
  const pts = [apply(m, rect.x, rect.y), apply(m, rect.x + rect.w, rect.y), apply(m, rect.x, rect.y + rect.h), apply(m, rect.x + rect.w, rect.y + rect.h)];
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
};

export type Placed = { card: Card; m: Affine; onScreen: boolean };

export const layout = (cam: Cam): Placed[] => {
  const out: Placed[] = [];
  for (const card of CARDS) {
    const m = affineFor(cam, card.X, card.Y);
    if (!m || m.depth < cam.D * 0.32) continue;
    const bb = bbox(m);
    if (bb.x1 < -260 || bb.x0 > 1340 || bb.y1 < -260 || bb.y0 > 2180) continue;
    out.push({ card, m, onScreen: bb.x1 > 0 && bb.x0 < 1080 && bb.y1 > 0 && bb.y0 < 1920 });
  }
  return out;
};

/** The card nearest a screen point at a given time, among cards drawn at least `minW` px wide. */
export const pickCard = (at: number, sx: number, sy: number, minW = 0): Card => {
  const placed = layout(baseCam(at));
  let best = placed[0].card;
  let bd = Infinity;
  for (const p of placed) {
    if (p.m.w < minW) continue;
    const c = apply(p.m, DZ.x + DZ.w / 2, DZ.y + DZ.h / 2);
    const dd = Math.hypot(c.x - sx, c.y - sy);
    if (dd < bd) {
      bd = dd;
      best = p.card;
    }
  }
  return best;
};

export const PUNCH_TARGET = pickCard(PUNCH_AT, 470, 1080, 120);

/** Full camera path for the wall part of the hook (0 → PUNCH_END). */
export const camAt = (t: number): Cam => {
  if (t < PUNCH_AT) return baseCam(t);
  const from = baseCam(PUNCH_AT);
  const to: Cam = {
    lx: PUNCH_TARGET.X + (DZ.x + DZ.w / 2 - FW / 2),
    ly: PUNCH_TARGET.Y + (DZ.y + DZ.h / 2 - FH / 2),
    D: 120,
    yaw: 0,
    pitch: 0,
    roll: 6,
  };
  const k = tween(t, PUNCH_AT, PUNCH_END, 0, 1, Easing.inOut(Easing.quad));
  const kD = tween(t, PUNCH_AT, PUNCH_END, 0, 1, Easing.in(Easing.cubic));
  return mixCam(from, to, k, kD);
};

