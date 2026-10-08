import { Easing, useCurrentFrame } from "remotion";
import { C, clamp01, lerp } from "./util";

/**
 * One keyframe of the AI cursor's path (Sequence seconds, screen px of the cursor TIP).
 * The segment that ARRIVES at a key uses that key's `ease` and `arc`.
 */
export type CursorKey = {
  t: number;
  x: number;
  y: number;
  /** Easing of the move into this key. Default: fast start, soft landing (an agent, not a hand). */
  ease?: (x: number) => number;
  /** Bow of the move into this key, px perpendicular to travel (+ bends right of the direction of travel). */
  arc?: number;
  /** Click on arrival: press + red ripple. */
  click?: boolean;
  /** Button state from this key on: true = held (drag), false = released. */
  down?: boolean;
  /** Seconds of "typing" from this key: the label shows a live dot pulse and the cursor ticks with each key. */
  type?: number;
};

const AGENT_EASE = Easing.bezier(0.55, 0, 0.12, 1);

export type CursorPose = { x: number; y: number; down: boolean; speed: number; typing: boolean; clickAge: number };

/** Position and state of the cursor at Sequence time `t` (use it to attach dragged things to the cursor). */
export const cursorAt = (path: CursorKey[], t: number): CursorPose => {
  const pos = (tt: number) => {
    if (tt <= path[0].t) return { x: path[0].x, y: path[0].y };
    for (let i = 1; i < path.length; i++) {
      const b = path[i];
      if (tt <= b.t) {
        const a = path[i - 1];
        const p = (b.ease ?? AGENT_EASE)(clamp01((tt - a.t) / Math.max(1e-6, b.t - a.t)));
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const len = Math.hypot(dx, dy) || 1;
        const bow = (b.arc ?? 0) * Math.sin(Math.PI * p);
        return { x: lerp(a.x, b.x, p) - (dy / len) * bow, y: lerp(a.y, b.y, p) + (dx / len) * bow };
      }
    }
    const z = path[path.length - 1];
    return { x: z.x, y: z.y };
  };
  const p = pos(t);
  const q = pos(t - 1 / 60);
  let down = false;
  let typing = false;
  let clickAge = Infinity;
  for (const k of path) {
    if (k.t > t) break;
    if (k.down !== undefined) down = k.down;
    if (k.type && t < k.t + k.type) typing = true;
    if (k.click) clickAge = t - k.t;
  }
  return { ...p, down, typing, clickAge, speed: Math.hypot(p.x - q.x, p.y - q.y) * 60 };
};

const Arrow: React.FC<{ s: number; glow: number }> = ({ s, glow }) => (
  <svg
    width={30 * s}
    height={42 * s}
    viewBox="0 0 30 42"
    style={{ position: "absolute", left: -2 * s, top: -2 * s, overflow: "visible", filter: `drop-shadow(0 0 ${6 + 10 * glow}px rgba(255,59,47,${0.55 + 0.35 * glow})) drop-shadow(0 6px 10px rgba(0,0,0,.5))` }}
  >
    <path d="M2,2 L2,34 L10,27 L16,40 L22,37 L16,24.5 L27,24.5 Z" fill={C.red} stroke="#fff" strokeWidth={2.2} strokeLinejoin="round" />
  </svg>
);

/**
 * The agent's own cursor: a glowing red arrow with an "AI" tag, moving along a keyframed path.
 * Appears at `from` (default: first key − 0.15 s) with a pop, leaves at `until`.
 */
export const AiCursor: React.FC<{
  path: CursorKey[];
  from?: number;
  until?: number;
  label?: string;
  size?: number;
}> = ({ path, from, until = Infinity, label = "AI", size = 1.25 }) => {
  const f = useCurrentFrame();
  const t = f / 30;
  const start = from ?? path[0].t - 0.15;
  if (t < start || t > until + 0.15) return null;
  const inK = clamp01((t - start) / 0.18);
  const outK = until === Infinity ? 0 : clamp01((t - until) / 0.15);
  const pose = cursorAt(path, t);
  const press = pose.down ? 1 : pose.clickAge < 0.12 ? Math.sin((pose.clickAge / 0.12) * Math.PI) : 0;
  const tick = pose.typing ? (f % 3 === 0 ? 1 : 0) : 0;
  const s = size * (0.4 + 0.6 * Easing.out(Easing.back(2))(inK)) * (1 - 0.14 * press - 0.05 * tick) * (1 - outK);
  const fast = clamp01((pose.speed - 900) / 2600);
  const ghosts = fast > 0.02 ? [1, 2, 3].map((k) => ({ k, ...cursorAt(path, t - k * 0.014) })) : [];
  const dots = Math.floor(t * 8) % 4;
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: Math.min(1, inK * 2) * (1 - outK) }}>
      {/* click ripple */}
      {pose.clickAge < 0.4 && (
        <div
          style={{
            position: "absolute",
            left: pose.x - 14 - pose.clickAge * 160,
            top: pose.y - 14 - pose.clickAge * 160,
            width: 28 + pose.clickAge * 320,
            height: 28 + pose.clickAge * 320,
            borderRadius: "50%",
            border: `3px solid ${C.red}`,
            opacity: 1 - pose.clickAge / 0.4,
          }}
        />
      )}
      {ghosts.map((g) => (
        <div key={g.k} style={{ position: "absolute", left: g.x, top: g.y, opacity: fast * (0.32 - g.k * 0.08) }}>
          <Arrow s={s} glow={0} />
        </div>
      ))}
      <div style={{ position: "absolute", left: pose.x, top: pose.y }}>
        <Arrow s={s} glow={press || tick ? 1 : 0.4} />
        <div
          style={{
            position: "absolute",
            left: 24 * s,
            top: 34 * s,
            display: "flex",
            alignItems: "center",
            gap: 6 * s,
            padding: `${3 * s}px ${8 * s}px`,
            borderRadius: 6 * s,
            background: C.red,
            color: "#fff",
            fontFamily: C.mono,
            fontSize: 16 * s,
            letterSpacing: "0.08em",
            whiteSpace: "nowrap",
            boxShadow: `0 0 ${14 * s}px rgba(255,59,47,.6)`,
          }}
        >
          {label}
          {pose.typing && (
            <span style={{ display: "inline-flex", gap: 3 * s }}>
              {[0, 1, 2].map((i) => (
                <span key={i} style={{ width: 4 * s, height: 4 * s, borderRadius: 2 * s, background: "#fff", opacity: i <= dots - 1 || dots === 0 ? 1 : 0.35 }} />
              ))}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
