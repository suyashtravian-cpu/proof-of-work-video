import { random, useCurrentFrame } from "remotion";
import { easeOut, tween } from "../../components/anim";
import { theme } from "../../theme";
import { CYAN, Rect } from "./geom";

/** Motion streaks across a band while something whips past. */
export const Streaks: React.FC<{ speed: number; axis: "x" | "y"; sign: number; band: Rect; seed: string }> = ({ speed, axis, sign, band, seed }) => {
  const f = useCurrentFrame();
  if (speed < 0.04) return null;
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {Array.from({ length: 34 }, (_, i) => {
        const r = (k: string) => random(`${seed}${k}${i}`);
        const len = (160 + r("l") * 760) * speed;
        const thick = 1 + r("t") * 3.5;
        const col = r("c") < 0.12 ? CYAN : r("c") > 0.94 ? theme.red : theme.fg;
        const op = speed * (0.25 + r("o") * 0.6);
        if (axis === "x") {
          const y = band.y + r("y") * band.h;
          const x = ((r("x") * 1600 + f * 260 * -sign) % 1600 + 1600) % 1600 - 260;
          return <rect key={i} x={x} y={y} width={len} height={thick} fill={col} opacity={op} />;
        }
        const x = band.x + r("y") * band.w;
        const y = ((r("x") * 2400 + f * 300 * -sign) % 2400 + 2400) % 2400 - 240;
        return <rect key={i} x={x} y={y} width={thick} height={len} fill={col} opacity={op} />;
      })}
    </svg>
  );
};

/** Torn horizontal slices + chroma bars over a rect for a few frames around a cut. */
export const Slices: React.FC<{ cut: number; r: Rect; seed: string }> = ({ cut, r, seed }) => {
  const f = useCurrentFrame();
  const c = Math.round(cut * 30);
  if (f < c - 1 || f > c + 3) return null;
  const k = 1 - Math.abs(f - c) / 4;
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {Array.from({ length: 7 }, (_, i) => {
        const y = r.y + random(`${seed}y${f}${i}`) * r.h;
        const h = 4 + random(`${seed}h${f}${i}`) * 46;
        const x = r.x + (random(`${seed}x${f}${i}`) - 0.5) * 160;
        const col = [theme.fg, theme.red, CYAN, "#000"][Math.floor(random(`${seed}c${f}${i}`) * 4)];
        return <rect key={i} x={x} y={y} width={r.w} height={h} fill={col} opacity={0.5 * k} style={{ mixBlendMode: i % 2 ? "difference" : "normal" }} />;
      })}
    </svg>
  );
};

/** Shockwave rings + radial shards from an impact point. */
export const Impact: React.FC<{ at: number; cx: number; cy: number; power?: number; seed: string }> = ({ at, cx, cy, power = 1, seed }) => {
  const t = useCurrentFrame() / 30;
  const d = t - at;
  if (d < 0 || d > 0.8) return null;
  const k = tween(d, 0, 0.7, 0, 1, easeOut);
  const fade = 1 - tween(d, 0.1, 0.8, 0, 1);
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "visible" }}>
      <circle cx={cx} cy={cy} r={60 + k * 900 * power} fill="none" stroke={theme.red} strokeWidth={10 * (1 - k) + 1} opacity={fade} />
      <circle cx={cx} cy={cy} r={40 + tween(d, 0.06, 0.8, 0, 1, easeOut) * 620 * power} fill="none" stroke={CYAN} strokeWidth={4 * (1 - k) + 1} opacity={fade * 0.8} />
      <circle cx={cx} cy={cy} r={30 + k * 380 * power} fill="none" stroke={theme.fg} strokeWidth={2} opacity={fade * 0.6} strokeDasharray="4 10" />
      {Array.from({ length: Math.round(46 * power) }, (_, i) => {
        const a = random(`${seed}a${i}`) * Math.PI * 2;
        const sp = 0.4 + random(`${seed}s${i}`) * 0.9;
        const r0 = 80 + k * 760 * sp * power;
        const len = (30 + random(`${seed}l${i}`) * 110) * (1 - k * 0.6);
        const col = random(`${seed}c${i}`) < 0.3 ? theme.red : random(`${seed}c${i}`) > 0.85 ? CYAN : theme.fg;
        return (
          <line
            key={i}
            x1={cx + Math.cos(a) * r0}
            y1={cy + Math.sin(a) * r0 * 0.8}
            x2={cx + Math.cos(a) * (r0 + len)}
            y2={cy + Math.sin(a) * (r0 + len) * 0.8}
            stroke={col}
            strokeWidth={2 + random(`${seed}w${i}`) * 3}
            opacity={fade}
          />
        );
      })}
    </svg>
  );
};
