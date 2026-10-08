import { AbsoluteFill, Easing, random, useCurrentFrame } from "remotion";
import { CUTS } from "../timing";
import { C, clamp01, easeExpo, prog } from "./util";

// One continuous 3D world. The camera always drifts forward and flies ~2600 units through the
// world at every cut, so scene changes read as one move through one space, not flat cuts.

const DRIFT = 140; // world units / s
const JUMP = 2600; // world units per cut
const FOCAL = 900;
const DEPTH = 6000;
const NEAR = 60;

/** Camera depth at a video time (seconds). */
export const camZ = (t: number) => t * DRIFT + CUTS.reduce((z, c) => z + JUMP * Easing.inOut(Easing.cubic)(clamp01((t - c + 0.22) / 0.54)), 0);
/** Camera speed (world units / s) at a video time; > ~1000 means "mid fly-through". */
export const camSpeed = (t: number) => (camZ(t + 1 / 60) - camZ(t - 1 / 60)) * 30;

const project = (x: number, y: number, d: number) => ({ x: 540 + (x * FOCAL) / d, y: 960 + (y * FOCAL) / d });

/** The world itself (composition level, behind every scene): deep dust that streaks on fly-throughs, and a portal frame at each cut. */
export const Space: React.FC<{ count?: number; opacity?: number }> = ({ count = 120, opacity = 1 }) => {
  const f = useCurrentFrame();
  const t = f / 30;
  const z = camZ(t);
  const dz = z - camZ(t - 1 / 30);
  return (
    <AbsoluteFill style={{ pointerEvents: "none", opacity }}>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        {Array.from({ length: count }, (_, i) => {
          const x = (random(`spx${i}`) - 0.5) * 3000;
          const y = (random(`spy${i}`) - 0.5) * 5200;
          const z0 = random(`spz${i}`) * DEPTH;
          const d = ((((z0 - z) % DEPTH) + DEPTH) % DEPTH) + NEAR;
          const fog = clamp01((DEPTH - d) / 2500) * clamp01((d - NEAR) / 160);
          if (fog <= 0.01) return null;
          const p = project(x, y, d);
          const r = Math.min(4, 0.7 + (2.2 * FOCAL) / d);
          const o = (0.18 + 0.4 * random(`spo${i}`)) * fog;
          const red = i % 17 === 0;
          const pd = d + dz;
          if (dz > 40 && pd < DEPTH + NEAR) {
            const q = project(x, y, pd);
            return <line key={i} x1={q.x} y1={q.y} x2={p.x} y2={p.y} stroke={red ? C.red : C.white} strokeWidth={r * 0.9} strokeLinecap="round" opacity={Math.min(0.85, o * 1.6)} />;
          }
          return <circle key={i} cx={p.x} cy={p.y} r={r} fill={red ? C.red : C.white} opacity={o} />;
        })}
        {CUTS.map((c) => {
          if (t < c - 0.3 || t > c + 0.12) return null;
          const gz = camZ(c + 0.05) + 260; // the camera passes through just after the cut
          const d = gz - z;
          if (d < NEAR + 20) return null;
          const fog = clamp01((t - (c - 0.3)) / 0.12) * clamp01((d - NEAR - 20) / 140);
          const W = 980;
          const H = 1740;
          const a = project(-W / 2, -H / 2, d);
          const b = project(W / 2, H / 2, d);
          const tick = Math.min(60, (b.x - a.x) * 0.08);
          return (
            <g key={c} opacity={fog * 0.55}>
              <rect x={a.x} y={a.y} width={b.x - a.x} height={b.y - a.y} fill="none" stroke={C.white} strokeWidth={1.5} />
              {[
                [a.x, a.y, 1, 1],
                [b.x, a.y, -1, 1],
                [a.x, b.y, 1, -1],
                [b.x, b.y, -1, -1],
              ].map(([x, y, sx, sy], k) => (
                <path key={k} d={`M${x + sx * tick},${y} L${x},${y} L${x},${y + sy * tick}`} fill="none" stroke={C.red} strokeWidth={4} />
              ))}
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};

/**
 * Wraps one scene inside the world. Enters from depth at `enterAt` (Sequence seconds), keeps a tiny
 * handheld drift, and flies past the camera in its last 0.2 s. Before `enterAt` nothing renders.
 */
export const Shot: React.FC<{ dur: number; enter?: boolean; exit?: boolean; enterAt?: number; seed?: number; children: React.ReactNode }> = ({
  dur,
  enter = true,
  exit = true,
  enterAt = 0,
  seed = 0,
  children,
}) => {
  const t = useCurrentFrame() / 30;
  if (enter && t < enterAt) return null;
  const ein = enter ? 1 - prog(t, enterAt, enterAt + 0.32, easeExpo) : 0;
  const eout = exit ? prog(t, dur - 0.2, dur, Easing.in(Easing.cubic)) : 0;
  const z = -1100 * ein + 900 * eout;
  const blur = 12 * ein + 12 * eout;
  const x = 5 * Math.sin(t * 1.3 + seed);
  const y = 4 * Math.cos(t * 1.1 + seed * 2);
  const r = 0.22 * Math.sin(t * 0.9 + seed);
  return (
    <AbsoluteFill
      style={{
        transformOrigin: "540px 860px",
        transform: `perspective(1000px) translate3d(${x}px, ${y}px, ${z}px) rotate(${r}deg)`,
        opacity: clamp01((1 - ein) * 2.2) * (1 - eout),
        filter: blur > 0.4 ? `blur(${blur.toFixed(1)}px)` : undefined,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};
