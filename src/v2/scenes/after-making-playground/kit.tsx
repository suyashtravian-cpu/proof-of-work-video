import { Easing, Freeze, OffthreadVideo, interpolate, random, useCurrentFrame } from "remotion";
import type { Line } from "../../../script";
import { sec } from "../../../timing";
import { REC, REC_H, REC_W, RecSpans } from "../../components/Rec";
import { LINES2 } from "../../script";
import { theme2 } from "../../theme";
import { DROP2, SCENES2, type Scene2Name, type Span } from "../../timeline";

// Shared toolkit for After / Making / Playground ("after-making-playground").

export const T = () => useCurrentFrame() / 30;

/* ---------------------------------------------------------------- timing */

const BEAT = 0.513;
export const sceneFrom = (n: Scene2Name) => SCENES2.find((s) => s.name === n)!.from;
/** Scene-relative time of the music beat nearest to `rel`. */
export const snapBeat = (n: Scene2Name, rel: number) => {
  const abs = sceneFrom(n) + rel;
  return DROP2 + Math.round((abs - DROP2) / BEAT) * BEAT - sceneFrom(n);
};

const lineOf = (prefix: string): Line => {
  const l = LINES2.find((x) => x.text.startsWith(prefix));
  if (!l) throw new Error(`no VO line "${prefix}"`);
  return l;
};
/** Absolute start of every space-separated word: real timestamps when present, else spread by characters. */
const wordStarts = (l: Line): number[] => {
  const words = l.text.split(" ");
  if (l.words && l.words.length === words.length) return l.words.map((w) => w.s);
  let acc = 0;
  return words.map((w) => {
    const s = l.t + ((l.end - l.t) * acc) / l.text.length;
    acc += w.length + 1;
    return s;
  });
};
/** Scene-relative VO timings for a line (follows LINES2 if it is re-timed). */
export const vo = (scene: Scene2Name, prefix: string) => {
  const l = lineOf(prefix);
  const from = sceneFrom(scene);
  const ws = wordStarts(l);
  return { t: l.t - from, end: l.end - from, word: (i: number) => ws[Math.min(i, ws.length - 1)] - from };
};

/* ------------------------------------------------------------ animation */

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const eIO = Easing.inOut(Easing.cubic);
export const eOut = Easing.out(Easing.cubic);
export const eExpo = Easing.out(Easing.exp);
export const eIn = Easing.in(Easing.cubic);

/** Piecewise keyframes [[time, value], ...] with one easing per segment. */
export const keys = (t: number, pts: [number, number][], ease = eIO) => {
  if (t <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) {
    const [t1, v1] = pts[i];
    const [t0, v0] = pts[i - 1];
    if (t <= t1) return interpolate(t, [t0, t1], [v0, v1], { ...clamp, easing: ease });
  }
  return pts[pts.length - 1][1];
};
export const tw = (t: number, a: number, b: number, from = 0, to = 1, ease = eIO) =>
  interpolate(t, [a, b], [from, to], { ...clamp, easing: ease });

/** Damped spring kick that starts at `at`: 0 -> overshoot -> 1. */
export const kick = (t: number, at: number, k = 22, damp = 7) => {
  const d = t - at;
  if (d <= 0) return 0;
  return 1 - Math.exp(-damp * d) * Math.cos(k * d);
};
/** A decaying pulse (0..1..0) after `at`. */
export const pulse = (t: number, at: number, dur = 0.35) => {
  const d = t - at;
  if (d < 0 || d > dur) return 0;
  return (1 - d / dur) ** 2;
};

/* --------------------------------------------------------------- footage */

export type Cam = { x: number; y: number; s: number };

/**
 * A window onto the recording: (cam.x, cam.y) in recording pixels lands in the window's centre at
 * scale cam.s. Children are drawn in recording coordinates, so callouts stick to the UI.
 */
export const RecView: React.FC<{
  w: number;
  h: number;
  cam: Cam;
  spans?: Span[];
  durations?: number[];
  from?: number;
  /** Show one frozen recording frame (seconds) instead of spans. */
  still?: number;
  /** Hide the site's sticky nav bar at the top of the recording. */
  hideNav?: boolean;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ w, h, cam, spans, durations, from = 0, still, hideNav = true, children, style }) => (
  <div style={{ position: "relative", width: w, height: h, overflow: "hidden", ...style }}>
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: REC_W,
        height: REC_H,
        transformOrigin: "0 0",
        transform: `translate(${w / 2 - cam.x * cam.s}px, ${h / 2 - cam.y * cam.s}px) scale(${cam.s})`,
      }}
    >
      {still !== undefined ? (
        <Freeze frame={0}>
          <OffthreadVideo src={REC} muted trimBefore={sec(still)} style={{ width: "100%", height: "100%" }} />
        </Freeze>
      ) : (
        spans && durations && <RecSpans spans={spans} durations={durations} from={from} />
      )}
      {hideNav && (
        <div style={{ position: "absolute", left: 0, top: 0, width: REC_W, height: 120, background: "linear-gradient(180deg, #0b0e22 0%, #0b0e22 62%, rgba(11,14,34,0) 100%)" }} />
      )}
      {children}
    </div>
  </div>
);

/* ------------------------------------------------------------ atmosphere */

/** Soft out-of-focus light discs (radial gradients, no CSS blur), drifting with parallax. */
export const Bokeh: React.FC<{ count?: number; seed?: string; dx?: number; dy?: number; opacity?: number }> = ({
  count = 14,
  seed = "bk",
  dx = 0,
  dy = 0,
  opacity = 1,
}) => {
  const t = T();
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", opacity }}>
      {Array.from({ length: count }, (_, i) => {
        const z = 0.25 + random(`${seed}z${i}`) * 0.9;
        const r = 40 + random(`${seed}r${i}`) * 150 * z;
        const x = random(`${seed}x${i}`) * 1240 - 80 + Math.sin(t * 0.5 + i * 1.7) * 30 * z + dx * z;
        const y = random(`${seed}y${i}`) * 2100 - 90 + Math.cos(t * 0.4 + i) * 40 * z - t * 24 * z + dy * z;
        const warm = random(`${seed}c${i}`) > 0.72;
        const c = warm ? "228,220,255" : random(`${seed}k${i}`) > 0.85 ? "150,220,255" : "188,165,238";
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x - r,
              top: y - r,
              width: r * 2,
              height: r * 2,
              borderRadius: "50%",
              background: `radial-gradient(circle, rgba(${c},${0.2 * z}) 0%, rgba(${c},${0.09 * z}) 45%, rgba(${c},0) 70%)`,
            }}
          />
        );
      })}
    </div>
  );
};

/** A diagonal band of light sweeping across its parent between a and b (seconds). */
export const Sweep: React.FC<{ a: number; b: number; angle?: number; strength?: number }> = ({ a, b, angle = 115, strength = 0.22 }) => {
  const t = T();
  if (t < a || t > b) return null;
  const p = tw(t, a, b, -40, 140, eIO);
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        mixBlendMode: "screen",
        background: `linear-gradient(${angle}deg, rgba(255,255,255,0) ${p - 18}%, rgba(228,220,255,${strength}) ${p}%, rgba(255,255,255,0) ${p + 18}%)`,
      }}
    />
  );
};

/** Radial speed lines bursting out of a point. */
export const Streaks: React.FC<{ cx?: number; cy?: number; amount: number; seed?: string; color?: string }> = ({
  cx = 540,
  cy = 960,
  amount,
  seed = "st",
  color = "228,220,255",
}) => {
  const t = T();
  if (amount <= 0.01) return null;
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {Array.from({ length: 44 }, (_, i) => {
        const a = random(`${seed}a${i}`) * Math.PI * 2;
        const ph = (random(`${seed}p${i}`) + t * (1.6 + random(`${seed}v${i}`) * 1.8)) % 1;
        const r0 = 120 + ph * 1300;
        const len = (80 + random(`${seed}l${i}`) * 260) * amount;
        const x0 = cx + Math.cos(a) * r0;
        const y0 = cy + Math.sin(a) * r0;
        const x1 = cx + Math.cos(a) * (r0 + len);
        const y1 = cy + Math.sin(a) * (r0 + len);
        return <line key={i} x1={x0} y1={y0} x2={x1} y2={y1} stroke={`rgba(${color},${0.55 * amount * (0.4 + ph * 0.6)})`} strokeWidth={1.5 + random(`${seed}w${i}`) * 3} strokeLinecap="round" />;
      })}
    </svg>
  );
};

/** Expanding click ripples at (x, y) from time `at`. */
export const Ripple: React.FC<{ x: number; y: number; at: number; rings?: number; max?: number; color?: string; dur?: number }> = ({
  x,
  y,
  at,
  rings = 3,
  max = 900,
  color = theme2.lilac,
  dur = 0.75,
}) => {
  const t = T();
  if (t < at || t > at + dur + rings * 0.08) return null;
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "visible" }}>
      {Array.from({ length: rings }, (_, i) => {
        const d = t - at - i * 0.08;
        if (d < 0 || d > dur) return null;
        const p = eExpo(d / dur);
        return <circle key={i} cx={x} cy={y} r={20 + p * max * (1 - i * 0.18)} fill="none" stroke={color} strokeWidth={(1 - p) * 10 + 1.5} opacity={(1 - d / dur) * 0.9} />;
      })}
      {t - at < 0.25 && <circle cx={x} cy={y} r={30 + (t - at) * 500} fill={`rgba(244,242,255,${0.55 * (1 - (t - at) / 0.25)})`} />}
    </svg>
  );
};

/** The pointer cursor. */
export const Cursor: React.FC<{ x: number; y: number; press?: number; opacity?: number; scale?: number }> = ({ x, y, press = 0, opacity = 1, scale = 1 }) => (
  <svg
    width={70}
    height={90}
    viewBox="0 0 28 36"
    style={{
      position: "absolute",
      left: x - 6 * scale,
      top: y - 3 * scale,
      opacity,
      transformOrigin: "6px 3px",
      transform: `scale(${scale * (1 - press * 0.18)})`,
      filter: "drop-shadow(0 6px 14px rgba(3,4,18,.7)) drop-shadow(0 0 12px rgba(188,165,238,.8))",
      overflow: "visible",
    }}
  >
    <path d="M2 1 L2 27 L8.5 21 L13 31.5 L17.2 29.7 L12.8 19.6 L21.5 19.6 Z" fill="#f8f7f3" stroke="#25243b" strokeWidth={1.6} strokeLinejoin="round" />
  </svg>
);

/** A small lilac label pill. */
export const Tag: React.FC<{ children: React.ReactNode; style?: React.CSSProperties; dot?: boolean }> = ({ children, style, dot = true }) => (
  <div
    style={{
      position: "absolute",
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "10px 20px",
      borderRadius: 40,
      background: "rgba(20,20,54,.72)",
      border: "1.5px solid rgba(188,165,238,.55)",
      color: theme2.lilacSoft,
      fontFamily: theme2.mono,
      fontSize: 22,
      letterSpacing: "0.14em",
      textTransform: "uppercase",
      whiteSpace: "nowrap",
      boxShadow: "0 0 30px rgba(188,165,238,.25)",
      ...style,
    }}
  >
    {dot && <div style={{ width: 10, height: 10, borderRadius: 5, background: theme2.lilac, boxShadow: `0 0 12px ${theme2.lilac}` }} />}
    {children}
  </div>
);

/** Directional motion-blur filters for whips (use sparingly: one element at a time). */
export const WhipDefs: React.FC<{ id: string; x: number; y: number }> = ({ id, x, y }) => (
  <svg width={0} height={0} style={{ position: "absolute" }}>
    <filter id={id} x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation={`${Math.max(0.01, x)} ${Math.max(0.01, y)}`} />
    </filter>
  </svg>
);

/** Floating glass rim used on every footage window. */
export const rim = (glow = 1): React.CSSProperties => ({
  borderRadius: 30,
  border: "2px solid rgba(228,220,255,.34)",
  boxShadow: `0 60px 140px rgba(3,4,18,.8), 0 0 ${110 * glow}px rgba(188,165,238,${0.32 * glow}), inset 0 0 0 1px rgba(255,255,255,.06)`,
  background: theme2.bg,
});
