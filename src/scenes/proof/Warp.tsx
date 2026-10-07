import { useLayoutEffect, useRef } from "react";
import { random, useCurrentFrame } from "remotion";
import { theme } from "../../theme";

// [time, extra distance, half-width] — bursts of forward travel at every whip / impact.
const BOOSTS: [number, number, number][] = [
  [0.5, 0.5, 0.45],
  [1.63, 0.9, 0.12],
  [2.29, 0.35, 0.08],
  [2.73, 0.35, 0.08],
  [3.12, 1.6, 0.2],
  [5.15, 0.7, 0.13],
  [7.15, 0.7, 0.13],
  [9.75, 0.7, 0.13],
  [11.1, 1.1, 0.16],
  [13.0, 0.8, 0.12],
];
const smooth = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
/** Monotonic distance travelled; its slope is the speed ramp. */
export const travel = (t: number) => 0.22 * t + BOOSTS.reduce((s, [c, d, w]) => s + d * smooth((t - c + w) / (2 * w)), 0);

const N = 230;

/** 3D starfield flying toward camera; streaks stretch with speed. */
export const Warp: React.FC<{ cy?: number; opacity?: number }> = ({ cy = 990, opacity = 1 }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const t = useCurrentFrame() / 30;
  useLayoutEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d")!;
    ctx.clearRect(0, 0, 1080, 1920);
    const d1 = travel(t);
    const d0 = travel(t - 1.5 / 30);
    ctx.lineCap = "round";
    for (let i = 0; i < N; i++) {
      const X = (random(`wx${i}`) - 0.5) * 2.6;
      const Y = (random(`wy${i}`) - 0.5) * 4.2;
      const z0 = random(`wz${i}`);
      const z1 = 1 - ((z0 + d1) % 1);
      const zp = 1 - ((z0 + d0) % 1);
      if (z1 < 0.04) continue;
      const P = 260;
      const x1 = 540 + (X / z1) * P;
      const y1 = cy + (Y / z1) * P;
      if (x1 < -50 || x1 > 1130 || y1 < -50 || y1 > 1970) continue;
      const near = 1 - z1;
      const cyan = random(`wc${i}`) < 0.1;
      ctx.strokeStyle = cyan ? "#33e1ff" : theme.fg;
      ctx.globalAlpha = opacity * Math.min(1, near * near * 1.4) * 0.9;
      ctx.lineWidth = 0.8 + near * 2.6;
      ctx.beginPath();
      if (zp > z1) {
        ctx.moveTo(540 + (X / zp) * P, cy + (Y / zp) * P);
      } else {
        ctx.moveTo(x1 - 0.5, y1);
      }
      ctx.lineTo(x1, y1);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }, [t, cy, opacity]);
  return <canvas ref={ref} width={1080} height={1920} style={{ position: "absolute", inset: 0 }} />;
};

/** Measuring rulers on both edges, scrolling with the travel (parallax). */
export const Rulers: React.FC<{ t: number }> = ({ t }) => {
  const off = (travel(t) * 900) % 100;
  const ticks = Array.from({ length: 15 }, (_, i) => i);
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {[0, 1].map((side) =>
        ticks.map((i) => {
          const y = 170 + i * 100 - off;
          if (y < 160 || y > 1420) return null;
          const x = side ? 1080 - 22 : 22;
          const dir = side ? -1 : 1;
          return (
            <g key={`${side}-${i}`} opacity={0.4}>
              <line x1={x} y1={y} x2={x + dir * 16} y2={y} stroke={theme.fg} strokeWidth={1.5} />
              {[20, 40, 60, 80].map((m) => (y + m < 1420 ? <line key={m} x1={x} y1={y + m} x2={x + dir * 7} y2={y + m} stroke={theme.fg} strokeWidth={1} /> : null))}
              <text x={x + dir * 20} y={y + 4} fill={theme.fg} fontFamily="JetBrains Mono" fontSize={11} textAnchor={side ? "end" : "start"}>
                {String(Math.floor((travel(t) * 9 + i) % 100)).padStart(2, "0")}
              </text>
            </g>
          );
        }),
      )}
    </svg>
  );
};
