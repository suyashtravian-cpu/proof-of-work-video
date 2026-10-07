import { useLayoutEffect, useRef } from "react";
import { random, useCurrentFrame } from "remotion";
import { easeInOut, tween } from "./anim";

type Rect = { x: number; y: number; w: number; h: number };

// The résumé breaks into particles that fly apart, swirl, and re-form as the
// browser window. Deterministic: every particle's path is seeded.
export const Shatter: React.FC<{ from: Rect; to: Rect; at: number }> = ({ from, to, at }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const t = useCurrentFrame() / 30 - at;
  useLayoutEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d")!;
    ctx.clearRect(0, 0, 1080, 1920);
    if (t < 0 || t > 1.25) return;
    const cols = 48;
    const rows = 64;
    const explode = tween(t, 0, 0.45, 0, 1, (k) => 1 - Math.pow(1 - k, 3));
    const gather = tween(t, 0.4, 1.05, 0, 1, easeInOut);
    const fade = tween(t, 1.0, 1.25, 1, 0);
    for (let i = 0; i < cols; i++)
      for (let j = 0; j < rows; j++) {
        const id = i * rows + j;
        const sx = from.x + (i + 0.5) * (from.w / cols);
        const sy = from.y + (j + 0.5) * (from.h / rows);
        const tx = to.x + (i + 0.5) * (to.w / cols);
        const ty = to.y + (j + 0.5) * (to.h / rows);
        const ang = random(`a${id}`) * Math.PI * 2;
        const dist = 180 + random(`d${id}`) * 620;
        const ex = sx + Math.cos(ang) * dist * explode;
        const ey = sy + Math.sin(ang) * dist * explode - 120 * explode;
        const swirl = Math.sin(gather * Math.PI) * 90 * (random(`s${id}`) - 0.5);
        const x = ex + (tx - ex) * gather + swirl;
        const y = ey + (ty - ey) * gather - swirl * 0.6;
        // paper white -> screen glow
        const lum = Math.round(243 - gather * (200 - random(`l${id}`) * 60));
        const size = 9 - gather * 3.5 + random(`z${id}`) * 3;
        ctx.globalAlpha = fade * (0.55 + random(`o${id}`) * 0.45);
        ctx.fillStyle = `rgb(${lum},${lum},${Math.max(0, lum - 6)})`;
        ctx.fillRect(x - size / 2, y - size / 2, size, size);
      }
    ctx.globalAlpha = 1;
  }, [t, from, to]);
  return <canvas ref={ref} width={1080} height={1920} style={{ position: "absolute", inset: 0 }} />;
};
