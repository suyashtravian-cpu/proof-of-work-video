import { random } from "remotion";
import { theme } from "../../theme";

const CYAN = "#33e1ff";

/** Radial particle + shard burst from (cx, cy) at time `at`; decelerates, then drifts. One SVG. */
export const Burst: React.FC<{ t: number; at: number; cx: number; cy: number; count?: number; seed?: string }> = ({ t, at, cx, cy, count = 130, seed = "burst" }) => {
  const d = t - at;
  if (d < 0 || d > 2.2) return null;
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {Array.from({ length: count }, (_, i) => {
        const a = random(`${seed}a${i}`) * Math.PI * 2;
        const v = 500 + random(`${seed}v${i}`) ** 1.6 * 2600;
        const k = 3.2; // drag
        const dist = (v / k) * (1 - Math.exp(-k * d)) + d * 30;
        const x = cx + Math.cos(a) * dist;
        const y = cy + Math.sin(a) * dist * 1.1 + d * d * 60;
        const life = 0.9 + random(`${seed}l${i}`) * 1.3;
        const o = Math.max(0, 1 - d / life);
        const c = random(`${seed}c${i}`);
        const color = c < 0.18 ? theme.red : c < 0.3 ? CYAN : theme.fg;
        const r = 1.5 + random(`${seed}r${i}`) * 4.5;
        if (i % 4 === 0) {
          // shards: short streaks along the direction of travel
          const len = 10 + (v / 2600) * 60 * Math.exp(-k * d);
          return <line key={i} x1={x} y1={y} x2={x - Math.cos(a) * len} y2={y - Math.sin(a) * len} stroke={color} strokeWidth={r * 0.8} opacity={o} strokeLinecap="round" />;
        }
        return <circle key={i} cx={x} cy={y} r={r} fill={color} opacity={o} />;
      })}
    </svg>
  );
};

/** Expanding shockwave rings + speed rays. */
export const Shockwave: React.FC<{ t: number; at: number; cx: number; cy: number }> = ({ t, at, cx, cy }) => {
  const d = t - at;
  if (d < 0 || d > 0.9) return null;
  const ring = (delay: number, color: string, max: number) => {
    const p = Math.max(0, Math.min(1, (d - delay) / 0.6));
    if (p <= 0 || p >= 1) return null;
    const e = 1 - (1 - p) ** 3;
    return <circle cx={cx} cy={cy} r={20 + e * max} fill="none" stroke={color} strokeWidth={(1 - p) * 46} opacity={(1 - p) * 0.9} />;
  };
  const rays = Math.max(0, 1 - d / 0.5);
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {rays > 0 &&
        Array.from({ length: 56 }, (_, i) => {
          const a = (i / 56) * Math.PI * 2 + random(`ray${i}`) * 0.08;
          const r0 = 120 + d * 1800 * (0.6 + random(`rr${i}`) * 0.6);
          const r1 = r0 + 200 + random(`rl${i}`) * 500;
          return <line key={i} x1={cx + Math.cos(a) * r0} y1={cy + Math.sin(a) * r0} x2={cx + Math.cos(a) * r1} y2={cy + Math.sin(a) * r1} stroke="#fff" strokeWidth={2 + random(`rw${i}`) * 5} opacity={rays * 0.55} />;
        })}
      {ring(0, "#ffffff", 1300)}
      {ring(0.07, theme.red, 1100)}
      {ring(0.16, CYAN, 900)}
    </svg>
  );
};
