import { Easing, random } from "remotion";
import type { CursorKey } from "../../kit/AiCursor";
import { clamp01, easeExpo, lerp, prog } from "../../kit/util";
import { TT } from "./beats";

// Geometry for 2/4 TOOLS (screen px, 1080×1920). The prompt's letters fly from the prompt panel into
// the three card titles, so both are laid out in JetBrains Mono (advance = 0.6 em) and every glyph's
// centre is computable.

// ---------- the prompt panel ----------
export const PROMPT = ["build a quiz, a calculator", "and a fit finder"];
export const P = { x: 70, y: 560, w: 940, h: 238, head: 58, left: 114, top: 640, fs: 46, lh: 66 };
export const P_CW = P.fs * 0.6;
export const SEND = { x: 934, y: P.top + P.lh * 1.5, r: 32 };
export const promptChar = (row: number, col: number) => ({ x: P.left + (col + 0.5) * P_CW, y: P.top + row * P.lh + P.lh / 2 });
export const PROMPT_LEN = PROMPT[0].length + PROMPT[1].length;

// ---------- the three tool cards (local px inside a 900×260 card) ----------
export const CARD = { w: 900, h: 260, pad: 40, titleTop: 30, titleFs: 44 };
export const T_CW = CARD.titleFs * 0.6;
export const TOOLS = [
  { title: "quiz", arg: "quiz", span: { row: 0, from: 8 } },
  { title: "calculator", arg: "calculator", span: { row: 0, from: 16 } },
  { title: "fit finder", arg: "fit_finder", span: { row: 1, from: 6 } },
] as const;

/** The wheel: which card is in focus (float index) and how much (0 = all three equal, as born). */
export const wheel = (t: number) => {
  const q = prog(t, TT.focus[0], TT.focus[0] + 0.32, easeExpo);
  const c = prog(t, TT.focus[1], TT.focus[1] + 0.32, easeExpo);
  const g = prog(t, TT.focus[2], TT.focus[2] + 0.32, easeExpo);
  return { f: 1 - q + c + g, a: q };
};

/** Scale of the card in focus (the hero); its neighbours sit at 0.8, dimmed and blurred. */
export const FOCUS_S = 1.12;
const focusScale = (ad: number) => (ad < 1 ? lerp(FOCUS_S, 0.8, ad) : Math.max(0.4, 0.8 - 0.2 * (ad - 1)));

/** Card i's pose: centre y, scale, opacity, blur, tilt. Born as a trio (f = 1, a = 0): centres 430 / 700 / 970 at 0.8. */
export const cardPose = (i: number, t: number) => {
  const { f, a } = wheel(t);
  const d = i - f;
  const ad = Math.abs(d);
  // a slow float once born; the card in focus holds still so the cursor's clicks stay on target
  const float = 5 * Math.sin(t * 2.1 + i * 1.7) * prog(t, TT.land, TT.land + 0.4) * (1 - a * clamp01(1 - ad));
  return {
    cy: 700 + d * lerp(270, 305, a) + float,
    s: lerp(0.8, focusScale(ad), a),
    op: lerp(1, clamp01(1 - 0.72 * ad), a),
    blur: 4 * ad * a,
    rx: -14 * d * a,
    d,
  };
};
/** Born (trio) rect of card i on screen. */
export const trioRect = (i: number) => ({ x: 540 - CARD.w * 0.4, y: 700 + (i - 1) * 270 - CARD.h * 0.4, w: CARD.w * 0.8, h: CARD.h * 0.8 });
/** Local card px → screen px for a settled, focused card (scale FOCUS_S, centre y 700). */
export const focused = (lx: number, ly: number) => ({ x: 540 + (lx - CARD.w / 2) * FOCUS_S, y: 700 + (ly - CARD.h / 2) * FOCUS_S });

// ---------- prompt → product: one flyer per prompt glyph ----------
export type Flyer = { ch: string; from: { x: number; y: number }; to: { x: number; y: number }; delay: number; title: boolean; spin: number; arc: number };
const titleTarget = (tool: number, j: number) => {
  const r = trioRect(tool);
  return { x: r.x + (CARD.pad + (j + 0.5) * T_CW) * 0.8, y: r.y + (CARD.titleTop + CARD.titleFs / 2) * 0.8 };
};
const FLY = 0.26;
export const FLYERS: Flyer[] = (() => {
  const out: Flyer[] = [];
  let order = 0;
  let loose = 0;
  PROMPT.forEach((line, row) => {
    [...line].forEach((ch, col) => {
      if (ch === " ") return;
      const tool = TOOLS.findIndex((x) => x.span.row === row && col >= x.span.from && col < x.span.from + x.title.length);
      const from = promptChar(row, col);
      if (tool >= 0) {
        const j = col - TOOLS[tool].span.from;
        out.push({ ch, from, to: titleTarget(tool, j), delay: 0.06 + order++ * 0.0045, title: true, spin: (random(`fs${row}${col}`) - 0.5) * 70, arc: -60 - 70 * random(`fa${row}${col}`) });
      } else {
        // the rest of the prompt dissolves into the card bodies (it becomes the UI)
        const r = trioRect(Math.floor(random(`fc${row}${col}`) * 3));
        const to = { x: r.x + r.w * (0.1 + 0.8 * random(`fx${row}${col}`)), y: r.y + r.h * (0.45 + 0.45 * random(`fy${row}${col}`)) };
        out.push({ ch, from, to, delay: loose++ * 0.006, title: false, spin: (random(`fs${row}${col}`) - 0.5) * 240, arc: -40 - 80 * random(`fa${row}${col}`) });
      }
    });
  });
  return out;
})();
/** Every title glyph has landed (Sequence seconds). */
export const LAND = TT.morph + Math.max(...FLYERS.filter((f) => f.title).map((f) => f.delay)) + FLY;
export const flyerAt = (fl: Flyer, t: number) => {
  const p = prog(t, TT.morph + fl.delay, TT.morph + fl.delay + FLY, Easing.inOut(Easing.cubic));
  const lift = Math.sin(Math.PI * p) * fl.arc;
  return { p, x: lerp(fl.from.x, fl.to.x, p), y: lerp(fl.from.y, fl.to.y, p) + lift, rot: Math.sin(Math.PI * p) * fl.spin };
};

// ---------- mini-UI geometry (local card px) ----------
export const QUIZ_UI = { optY: 186, optH: 52, optW: 262, optGap: 17 };
export const optCenter = (k: number) => ({ x: CARD.pad + k * (QUIZ_UI.optW + QUIZ_UI.optGap) + QUIZ_UI.optW / 2, y: QUIZ_UI.optY + QUIZ_UI.optH / 2 });
export const CALC_UI = { x0: 40, x1: 470, y: 200 };
export const sliderX = (v: number) => CALC_UI.x0 + v * (CALC_UI.x1 - CALC_UI.x0);
export const V0 = 0.25;
export const V1 = 0.83;
export const FIT_UI = { chipH: 48, rows: [104, 172], x0: 170 };
export const WAISTS = [
  { label: "30", w: 92 },
  { label: "32", w: 92 },
  { label: "34", w: 92 },
];
export const LENGTHS = [
  { label: "Short", w: 128 },
  { label: "Regular", w: 160 },
  { label: "Long", w: 112 },
];
export const chipX = (list: { w: number }[], k: number) => FIT_UI.x0 + list.slice(0, k).reduce((s, c) => s + c.w + 12, 0);
const chipCenter = (list: { w: number }[], k: number, row: number) => ({ x: chipX(list, k) + list[k].w / 2, y: FIT_UI.rows[row] + FIT_UI.chipH / 2 });

// ---------- the AI cursor ----------
const typingKeys = (): CursorKey[] => {
  const [a, b] = TT.type;
  const keys: CursorKey[] = [];
  let k = 0;
  PROMPT.forEach((line, row) => {
    for (let col = 0; col < line.length; col++) {
      k++;
      const c = promptChar(row, col);
      keys.push({ t: a + ((b - a) * k) / PROMPT_LEN, x: c.x + P_CW / 2 + 10, y: c.y + 26, ease: (x: number) => x, type: k === 1 ? b - a + 0.04 : undefined });
    }
  });
  return keys;
};
const tip = (p: { x: number; y: number }, dx = -8, dy = 6) => ({ x: p.x + dx, y: p.y + dy });
const q0 = tip(focused(optCenter(0).x, optCenter(0).y), -40);
const q1 = tip(focused(optCenter(1).x, optCenter(1).y), -30);
const grab = tip(focused(sliderX(V0), CALC_UI.y), 0, 4);
const drop = tip(focused(sliderX(V1), CALC_UI.y), 0, 4);
const w32 = tip(focused(chipCenter(WAISTS, 1, 0).x, chipCenter(WAISTS, 1, 0).y));
const reg = tip(focused(chipCenter(LENGTHS, 1, 1).x, chipCenter(LENGTHS, 1, 1).y), -20);
export const SLIDER_GRAB_X = grab.x;
export const SLIDER_DROP_X = drop.x;

export const TOOLS_CURSOR: CursorKey[] = [
  { t: TT.cursorIn, x: 1130, y: 1080 },
  { t: TT.focusInput, x: P.left + 4, y: P.top + 58, arc: -120, click: true },
  ...typingKeys(),
  { t: TT.send, x: SEND.x - 4, y: SEND.y + 6, click: true },
  { t: TT.morph, x: SEND.x + 30, y: SEND.y + 70 },
  { t: TT.focus[0], x: 990, y: 890, ease: (x: number) => x },
  { t: TT.answers[0], ...q0, arc: 90, click: true },
  { t: TT.answers[1], ...q1, click: true },
  { t: TT.grab, ...grab, arc: -60, click: true, down: true },
  { t: TT.release, ...drop, ease: Easing.inOut(Easing.cubic) },
  { t: TT.release + 0.03, ...drop, down: false },
  { t: TT.pickWaist, ...w32, arc: 60, click: true },
  { t: TT.pickLength, ...reg, click: true },
  { t: TT.pickLength + 0.6, x: reg.x + 300, y: reg.y - 40 },
];
