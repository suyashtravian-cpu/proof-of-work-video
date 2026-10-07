import { useLayoutEffect, useRef } from "react";
import { random, useCurrentFrame } from "remotion";
import { PAPER_H, PAPER_LAYOUT, PAPER_W } from "../../components/Paper";
import { theme } from "../../theme";

export type Pose = { cx: number; cy: number; s: number; rx: number; ry: number; rz: number };

const CELL = 24;
const COLS = Math.ceil(PAPER_W / CELL);
const ROWS = Math.ceil(PAPER_H / CELL);
const INK = "#@%&8$B";
const DOT = ".:-',`";
const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&*+<>/\\=_{}[]";
const CYAN = "#33e1ff";

const coverage = (x: number, y: number) => {
  let a = 0;
  for (const r of PAPER_LAYOUT.ink) {
    const w = Math.min(x + CELL, r.x + r.w) - Math.max(x, r.x);
    const h = Math.min(y + CELL, r.y + r.h) - Math.max(y, r.y);
    if (w > 0 && h > 0) a += (w * h) / (CELL * CELL);
  }
  return Math.min(1, a * 2.2);
};

const CELLS = Array.from({ length: COLS * ROWS }, (_, id) => {
  const i = id % COLS;
  const j = Math.floor(id / COLS);
  const ink = coverage(i * CELL, j * CELL);
  const r = random(`ac${id}`);
  const ch = ink > 0.2 ? INK[Math.floor(r * INK.length)] : r < 0.6 ? DOT[Math.floor(random(`ad${id}`) * DOT.length)] : "";
  return {
    px: (i + 0.5) * CELL,
    py: (j + 0.5) * CELL,
    ink,
    ch,
    // dissolve sweeps up from the bottom with noise
    th: 0.62 * (1 - j / (ROWS - 1)) + 0.38 * random(`at${id}`),
    vx: (i / (COLS - 1) - 0.5) * 2 + (random(`avx${id}`) - 0.5) * 1.2,
    vy: (j / (ROWS - 1) - 0.5) * 2 + (random(`avy${id}`) - 0.5) * 1.2 - 0.3,
    sp: 0.4 + random(`asp${id}`),
    grow: 1 + random(`agr${id}`) * 6,
  };
});

/**
 * The résumé turns into ASCII of itself (paper -> dark cell with a glyph), then the glyphs blow
 * toward the camera. Screen-space canvas; `pose` must be flat (no rotation) while active.
 */
export const AsciiPaper: React.FC<{ pose: Pose; dissolve: number; blow: number }> = ({ pose, dissolve, blow }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const f = useCurrentFrame();
  useLayoutEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d")!;
    ctx.clearRect(0, 0, 1080, 1920);
    if (dissolve <= 0) return;
    const { cx, cy, s } = pose;
    const cw = CELL * s;
    const fs = cw * 1.05;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `500 ${fs}px 'JetBrains Mono'`;
    const e = blow * blow;
    CELLS.forEach((cell, id) => {
      if (dissolve < cell.th) return;
      const sx = cx + (cell.px - PAPER_W / 2) * s;
      const sy = cy + (cell.py - PAPER_H / 2) * s;
      if (blow <= 0) {
        ctx.globalAlpha = 1;
        ctx.fillStyle = "#0b0b0b";
        ctx.fillRect(sx - cw / 2, sy - cw / 2, cw + 0.6, cw + 0.6);
        const front = dissolve - cell.th < 0.09;
        const ch = front ? GLYPHS[Math.floor(random(`ag${id}${Math.floor(f / 2)}`) * GLYPHS.length)] : cell.ch;
        if (!ch) return;
        ctx.fillStyle = front ? CYAN : theme.fg;
        ctx.globalAlpha = front ? 1 : cell.ink > 0.2 ? 1 : 0.42;
        ctx.fillText(ch, sx, sy);
        return;
      }
      if (!cell.ch) return;
      const dist = e * (420 + cell.sp * 1100);
      const x = sx + cell.vx * dist;
      const y = sy + cell.vy * dist * 1.3;
      const k = 1 + e * cell.grow;
      ctx.globalAlpha = (cell.ink > 0.2 ? 1 : 0.45) * (1 - blow * 0.55);
      ctx.fillStyle = cell.ink > 0.2 && id % 7 === 0 ? theme.red : theme.fg;
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(k, k);
      ctx.fillText(cell.ch, 0, 0);
      ctx.restore();
    });
    ctx.globalAlpha = 1;
  }, [f, pose, dissolve, blow]);
  return <canvas ref={ref} width={1080} height={1920} style={{ position: "absolute", inset: 0, pointerEvents: "none" }} />;
};
