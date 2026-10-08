import { random } from "remotion";
import { C } from "./util";

// v1's hit effects (src/scenes/twist-ship/ShipFx, hook/bits SpeedLines) in black, white and red only.

/** Radial particle + shard burst from (cx, cy) at `at`; decelerates, then drifts. */
export const Burst: React.FC<{ t: number; at: number; cx: number; cy: number; count?: number; seed?: string; reach?: number }> = ({ t, at, cx, cy, count = 110, seed = "b4", reach = 1 }) => {
  const d = t - at;
  if (d < 0 || d > 1.8) return null;
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {Array.from({ length: count }, (_, i) => {
        const a = random(`${seed}a${i}`) * Math.PI * 2;
        const v = (500 + random(`${seed}v${i}`) ** 1.6 * 2400) * reach;
        const k = 3.4;
        const dist = (v / k) * (1 - Math.exp(-k * d)) + d * 30;
        const x = cx + Math.cos(a) * dist;
        const y = cy + Math.sin(a) * dist * 1.1 + d * d * 60;
        const o = Math.max(0, 1 - d / (0.8 + random(`${seed}l${i}`) * 1.0));
        const color = random(`${seed}c${i}`) < 0.25 ? C.red : C.white;
        const r = 1.5 + random(`${seed}r${i}`) * 4;
        if (i % 4 === 0) {
          const len = 10 + (v / 2600) * 60 * Math.exp(-k * d);
          return <line key={i} x1={x} y1={y} x2={x - Math.cos(a) * len} y2={y - Math.sin(a) * len} stroke={color} strokeWidth={r * 0.8} opacity={o} strokeLinecap="round" />;
        }
        return <circle key={i} cx={x} cy={y} r={r} fill={color} opacity={o} />;
      })}
    </svg>
  );
};

/** Expanding white + red rings and speed rays at `at`. */
export const Shockwave: React.FC<{ t: number; at: number; cx: number; cy: number; size?: number }> = ({ t, at, cx, cy, size = 1 }) => {
  const d = t - at;
  if (d < 0 || d > 0.8) return null;
  const ring = (delay: number, color: string, max: number) => {
    const p = Math.max(0, Math.min(1, (d - delay) / 0.55));
    if (p <= 0 || p >= 1) return null;
    const e = 1 - (1 - p) ** 3;
    return <circle cx={cx} cy={cy} r={20 + e * max * size} fill="none" stroke={color} strokeWidth={(1 - p) * 40 * size} opacity={(1 - p) * 0.85} />;
  };
  const rays = Math.max(0, 1 - d / 0.45);
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {rays > 0 &&
        Array.from({ length: 48 }, (_, i) => {
          const a = (i / 48) * Math.PI * 2 + random(`sw${i}`) * 0.08;
          const r0 = 110 * size + d * 1700 * (0.6 + random(`swr${i}`) * 0.6);
          const r1 = r0 + (180 + random(`swl${i}`) * 420) * size;
          return <line key={i} x1={cx + Math.cos(a) * r0} y1={cy + Math.sin(a) * r0} x2={cx + Math.cos(a) * r1} y2={cy + Math.sin(a) * r1} stroke="#fff" strokeWidth={2 + random(`sww${i}`) * 4} opacity={rays * 0.5} />;
        })}
      {ring(0, C.white, 1200)}
      {ring(0.08, C.red, 950)}
    </svg>
  );
};

/** Radial streaks; dir 1 = pushing in (streaks fly outward), -1 = pulling back. `amount` 0..1. */
export const SpeedLines: React.FC<{ t: number; amount: number; dir?: number; seed?: string; cx?: number; cy?: number }> = ({ t, amount, dir = 1, seed = "sl4", cx = 540, cy = 960 }) => {
  if (amount <= 0.02) return null;
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {Array.from({ length: 52 }, (_, i) => {
        const ang = random(`${seed}a${i}`) * Math.PI * 2;
        const sp = 0.5 + random(`${seed}s${i}`);
        const phase = (((t * 3.2 * sp + random(`${seed}p${i}`)) % 1) + 1) % 1;
        const r = 160 + (dir > 0 ? phase : 1 - phase) * 1200;
        const len = (60 + 520 * random(`${seed}l${i}`)) * amount;
        return (
          <line
            key={i}
            x1={cx + Math.cos(ang) * r}
            y1={cy + Math.sin(ang) * r}
            x2={cx + Math.cos(ang) * (r + len)}
            y2={cy + Math.sin(ang) * (r + len)}
            stroke={i % 13 === 0 ? C.red : C.white}
            strokeWidth={1.5 + 2.5 * random(`${seed}w${i}`)}
            opacity={0.6 * amount}
          />
        );
      })}
    </svg>
  );
};
