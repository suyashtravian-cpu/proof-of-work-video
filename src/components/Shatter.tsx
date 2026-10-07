import { useLayoutEffect, useRef } from "react";
import { random, useCurrentFrame } from "remotion";
import { easeInOut, tween } from "./anim";

type Rect = { x: number; y: number; w: number; h: number };

const COLS = 48;
const ROWS = 64;
const CYAN = [51, 225, 255];

// The résumé breaks into particles that fly apart with motion streaks, swirl,
// and re-form as the browser window while a wireframe of that window draws in.
// Deterministic: every particle's path is seeded.
export const Shatter: React.FC<{ from: Rect; to: Rect; at: number; wire?: boolean }> = ({ from, to, at, wire = true }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const t = useCurrentFrame() / 30 - at;
  useLayoutEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d")!;
    ctx.clearRect(0, 0, 1080, 1920);
    if (t < 0 || t > 1.3) return;
    const explodeE = (k: number) => 1 - Math.pow(1 - k, 3);
    const pos = (id: number, i: number, j: number, tt: number): [number, number, number] => {
      const explode = tween(tt, 0, 0.45, 0, 1, explodeE);
      const gather = tween(tt, 0.4, 1.05, 0, 1, easeInOut);
      const sx = from.x + (i + 0.5) * (from.w / COLS);
      const sy = from.y + (j + 0.5) * (from.h / ROWS);
      const tx = to.x + (i + 0.5) * (to.w / COLS);
      const ty = to.y + (j + 0.5) * (to.h / ROWS);
      const ang = random(`a${id}`) * Math.PI * 2;
      const dist = 180 + random(`d${id}`) * 620;
      const ex = sx + Math.cos(ang) * dist * explode;
      const ey = sy + Math.sin(ang) * dist * explode - 120 * explode;
      const swirl = Math.sin(gather * Math.PI) * 140 * (random(`s${id}`) - 0.5);
      return [ex + (tx - ex) * gather + swirl, ey + (ty - ey) * gather - swirl * 0.6, gather];
    };
    const fade = tween(t, 1.0, 1.25, 1, 0);
    ctx.lineCap = "round";
    for (let i = 0; i < COLS; i++)
      for (let j = 0; j < ROWS; j++) {
        const id = i * ROWS + j;
        const [x, y, gather] = pos(id, i, j, t);
        const [px, py] = pos(id, i, j, t - 1.6 / 30);
        const spark = random(`c${id}`) < 0.12;
        const lum = Math.round(243 - gather * (200 - random(`l${id}`) * 60));
        const mid = Math.sin(Math.min(1, t / 1.05) * Math.PI); // in flight
        const rgb = spark && mid > 0.2 ? CYAN.map((v) => Math.round(v * mid + lum * (1 - mid))) : [lum, lum, Math.max(0, lum - 6)];
        const size = 9 - gather * 3.5 + random(`z${id}`) * 3;
        const a = fade * (0.55 + random(`o${id}`) * 0.45);
        const v = Math.hypot(x - px, y - py);
        ctx.globalAlpha = a;
        if (v > 6) {
          ctx.strokeStyle = `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;
          ctx.lineWidth = Math.max(1.5, size * 0.6);
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(x, y);
          ctx.stroke();
        }
        ctx.fillStyle = `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;
        ctx.fillRect(x - size / 2, y - size / 2, size, size);
      }
    ctx.globalAlpha = 1;
    if (!wire) return;
    // Wireframe of the destination window, drawn while the particles converge.
    const w = tween(t, 0.45, 0.92, 0, 1, easeInOut);
    const wf = tween(t, 0.92, 1.15, 1, 0);
    if (w <= 0 || wf <= 0) return;
    const perim = 2 * (to.w + to.h);
    ctx.globalAlpha = 0.9 * wf;
    ctx.strokeStyle = "#33e1ff";
    ctx.lineWidth = 2;
    ctx.setLineDash([perim * w, perim]);
    ctx.strokeRect(to.x, to.y, to.w, to.h);
    ctx.setLineDash([]);
    // title bar + scan line
    ctx.globalAlpha = 0.7 * wf * w;
    ctx.beginPath();
    ctx.moveTo(to.x, to.y + 46);
    ctx.lineTo(to.x + to.w * w, to.y + 46);
    ctx.stroke();
    const sy = to.y + to.h * tween(t, 0.55, 1.0, 0, 1, easeInOut);
    const g = ctx.createLinearGradient(0, sy - 60, 0, sy);
    g.addColorStop(0, "rgba(51,225,255,0)");
    g.addColorStop(1, "rgba(51,225,255,0.35)");
    ctx.globalAlpha = wf;
    ctx.fillStyle = g;
    ctx.fillRect(to.x, sy - 60, to.w, 60);
    // corner ticks
    ctx.globalAlpha = wf;
    ctx.lineWidth = 4;
    const L = 30 * w;
    for (const [cx, cy, sx, syy] of [
      [to.x, to.y, 1, 1],
      [to.x + to.w, to.y, -1, 1],
      [to.x, to.y + to.h, 1, -1],
      [to.x + to.w, to.y + to.h, -1, -1],
    ]) {
      ctx.beginPath();
      ctx.moveTo(cx + sx * L, cy - syy * 10);
      ctx.lineTo(cx - sx * 10, cy - syy * 10);
      ctx.lineTo(cx - sx * 10, cy + syy * L);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }, [t, from, to, wire]);
  return <canvas ref={ref} width={1080} height={1920} style={{ position: "absolute", inset: 0 }} />;
};
