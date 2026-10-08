import React from "react";
import { AbsoluteFill, Easing, Freeze, OffthreadVideo, random, spring } from "remotion";
import { Particles } from "../../../fx/Particles";
import { REC } from "../../components/Rec";
import { Sky } from "../../components/Sky";
import { theme2 } from "../../theme";

// Shared toolkit for the Campaigns and Lab scenes: a floating 3D window onto the real recording
// with a camera inside it, the dreamy depth plate, and lilac callouts. Everything is driven by
// scene-relative seconds `t` so it can be keyframed freely and stays deterministic.

export const FPS = 30;
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
export const ease = {
  out: Easing.out(Easing.cubic),
  in: Easing.in(Easing.cubic),
  expo: Easing.out(Easing.exp),
  inOut: Easing.inOut(Easing.cubic),
  whip: Easing.inOut(Easing.poly(5)),
  back: Easing.out(Easing.back(1.7)),
};
export const prog = (t: number, a: number, b: number, e: (x: number) => number = ease.inOut) => e(clamp01((t - a) / (b - a)));
/** 0 → 1 → 0 bump between a and b (peaks in the middle). */
export const bell = (t: number, a: number, b: number) => {
  const k = clamp01((t - a) / (b - a));
  return Math.sin(k * Math.PI);
};

/** Spring that starts at `at` seconds, computed from t (no hooks, safe in loops). */
export const springAt = (t: number, at: number, damping = 14, mass = 0.6, stiffness = 140) =>
  t < at ? 0 : spring({ frame: (t - at) * FPS, fps: FPS, config: { damping, mass, stiffness } });

/** Electro Dreams beat grid after the drop (12.9 + n * 0.513), in scene-relative seconds. */
export const beatIn = (sceneFrom: number) => (n: number) => +(12.9 + n * 0.513 - sceneFrom).toFixed(3);

/** Keyframe track: [time, value, easing into this key]. */
export type Key = [t: number, v: number, e?: (x: number) => number];
export const track = (t: number, keys: Key[]) => {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [t1, v1, e] = keys[i];
    const [t0, v0] = keys[i - 1];
    if (t <= t1) return lerp(v0, v1, (e ?? ease.inOut)(clamp01((t - t0) / (t1 - t0 || 1))));
  }
  return keys[keys.length - 1][1];
};

/** One frame of the recording at time `t` (seconds), nudged by `shift` px (smooth-scroll residual). */
export const RecFrame: React.FC<{ t: number; shift?: number }> = ({ t, shift = 0 }) => (
  <div style={{ position: "absolute", left: 0, top: shift, width: 1708, height: 1080 }}>
    <Freeze frame={t * FPS}>
      <OffthreadVideo src={REC} muted style={{ width: 1708, height: 1080, display: "block" }} />
    </Freeze>
  </div>
);

export type Cam = { cx: number; cy: number; zoom: number };
/** Maps recording frame coordinates to window coordinates. */
export type MapFn = (x: number, y: number) => [number, number];

/** Directional blur filter (SVG) so whip pans smear along their direction. */
const DirBlur: React.FC<{ id: string; x: number; y: number }> = ({ id, x, y }) => (
  <svg width={0} height={0} style={{ position: "absolute" }}>
    <filter id={id} x="-10%" y="-10%" width="120%" height="120%">
      <feGaussianBlur stdDeviation={`${x.toFixed(2)} ${y.toFixed(2)}`} />
    </filter>
  </svg>
);

/**
 * A floating glass window onto the recording. The window itself moves in 3D (x, y, rx, ry, rz, s);
 * inside it a camera frames the region around (cam.cx, cam.cy) of the recording at cam.zoom.
 * `inner` draws clipped to the glass, `overlay` draws unclipped (callouts that break the frame).
 */
export const FloatWin: React.FC<{
  id: string;
  w: number;
  h: number;
  x?: number;
  y?: number;
  rx?: number;
  ry?: number;
  rz?: number;
  s?: number;
  cam: Cam;
  recT: number;
  shift?: number;
  opacity?: number;
  dim?: number;
  blur?: number;
  mblur?: [number, number];
  sheen?: number;
  glow?: number;
  inner?: (map: MapFn, zoom: number) => React.ReactNode;
  overlay?: (map: MapFn, zoom: number) => React.ReactNode;
}> = ({ id, w, h, x = 0, y = 0, rx = 0, ry = 0, rz = 0, s = 1, cam, recT, shift = 0, opacity = 1, dim = 0, blur = 0, mblur = [0, 0], sheen = -1, glow = 1, inner, overlay }) => {
  const map: MapFn = (px, py) => [w / 2 + (px - cam.cx) * cam.zoom, h / 2 + (py - cam.cy) * cam.zoom];
  const useMb = mblur[0] > 0.4 || mblur[1] > 0.4;
  return (
    <div
      style={{
        position: "absolute",
        left: 540 - w / 2 + x,
        top: 960 - h / 2 + y,
        width: w,
        height: h,
        opacity,
        transform: `perspective(2400px) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg) scale(${s})`,
        filter: blur > 0.3 ? `blur(${blur.toFixed(2)}px)` : undefined,
      }}
    >
      {useMb && <DirBlur id={`mb-${id}`} x={mblur[0] / cam.zoom} y={mblur[1] / cam.zoom} />}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 28,
          overflow: "hidden",
          background: theme2.bg,
          boxShadow: `0 60px 140px rgba(3,4,18,.8), 0 0 ${100 * glow}px rgba(188,165,238,${0.38 * glow})`,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: 1708,
            height: 1080,
            transformOrigin: "0 0",
            transform: `translate(${w / 2 - cam.cx * cam.zoom}px, ${h / 2 - cam.cy * cam.zoom}px) scale(${cam.zoom})`,
            filter: useMb ? `url(#mb-${id})` : undefined,
          }}
        >
          <RecFrame t={recT} shift={shift} />
        </div>
        {dim > 0.01 && <div style={{ position: "absolute", inset: 0, background: `rgba(9,13,37,${dim})` }} />}
        {inner?.(map, cam.zoom)}
        {sheen > -0.5 && (
          <div
            style={{
              position: "absolute",
              top: -h,
              left: lerp(-w, w * 1.6, sheen),
              width: w * 0.35,
              height: h * 3,
              transform: "rotate(22deg)",
              background: "linear-gradient(90deg, rgba(255,255,255,0), rgba(244,240,255,.22), rgba(255,255,255,0))",
              mixBlendMode: "screen",
            }}
          />
        )}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 28,
            border: "1.5px solid rgba(228,220,255,.34)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,.25), inset 0 0 60px rgba(188,165,238,.12)",
          }}
        />
      </div>
      {overlay?.(map, cam.zoom)}
    </div>
  );
};

/** The deep night plate: indigo, the site's sky, drifting bokeh and dust, all with parallax. */
export const Atmos: React.FC<{ t: number; px?: number; py?: number; seed: string; sky?: number }> = ({ t, px = 0, py = 0, seed, sky = 0.3 }) => {
  const bokeh = Array.from({ length: 13 }, (_, i) => {
    const z = 0.25 + random(`${seed}bz${i}`) * 0.75;
    const size = 70 + z * 280;
    const bx = random(`${seed}bx${i}`) * 1180 - 50 + Math.sin(t * 0.35 + i * 1.7) * 30 + px * z * 0.7;
    const by = ((random(`${seed}by${i}`) * 2100 - t * 16 * z + py * z * 0.7) % 2100 + 2100) % 2100 - 90;
    const cyan = i === 4;
    const c = cyan ? "143,220,255" : i % 3 === 0 ? "228,220,255" : "188,165,238";
    const a = (cyan ? 0.1 : 0.09 + 0.14 * random(`${seed}ba${i}`)) * (0.85 + 0.15 * Math.sin(t * 1.3 + i));
    return { bx, by, size, c, a, key: i };
  });
  return (
    <AbsoluteFill style={{ background: theme2.bg, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: -120, transform: `translate(${px * 0.22}px, ${py * 0.22}px)` }}>
        <Sky opacity={sky} blur={3} zoom={1.12} />
      </div>
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse 90% 55% at 50% 8%, rgba(188,165,238,.20), rgba(188,165,238,0) 70%), radial-gradient(ellipse 80% 50% at 50% 100%, rgba(20,20,54,.9), rgba(9,13,37,0) 70%), linear-gradient(180deg, rgba(9,13,37,.35), rgba(9,13,37,.15) 40%, rgba(9,13,37,.6))",
        }}
      />
      {bokeh.map((b) => (
        <div
          key={b.key}
          style={{
            position: "absolute",
            left: b.bx - b.size / 2,
            top: b.by - b.size / 2,
            width: b.size,
            height: b.size,
            borderRadius: "50%",
            background: `radial-gradient(circle, rgba(${b.c},${b.a}) 0%, rgba(${b.c},${b.a * 0.55}) 35%, rgba(${b.c},0) 70%)`,
          }}
        />
      ))}
      <div style={{ position: "absolute", inset: 0, transform: `translate(${px * 0.5}px, ${py * 0.5}px)` }}>
        <Particles count={48} color={theme2.lilacSoft} opacity={0.42} seed={`${seed}p`} />
      </div>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 75% 60% at 50% 48%, rgba(9,13,37,0) 55%, rgba(4,5,18,.72))" }} />
    </AbsoluteFill>
  );
};

/** A diagonal band of soft light that crosses the frame. */
export const Sweep: React.FC<{ t: number; at: number; dur?: number; angle?: number; strength?: number; width?: number }> = ({ t, at, dur = 0.55, angle = 20, strength = 0.28, width = 320 }) => {
  const k = (t - at) / dur;
  if (k < 0 || k > 1) return null;
  const e = ease.inOut(k);
  return (
    <AbsoluteFill style={{ pointerEvents: "none", overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          top: -600,
          left: lerp(-900, 1500, e),
          width,
          height: 3200,
          transform: `rotate(${angle}deg)`,
          background: `linear-gradient(90deg, rgba(228,220,255,0), rgba(228,220,255,${strength * Math.sin(k * Math.PI)}), rgba(228,220,255,0))`,
          mixBlendMode: "screen",
        }}
      />
    </AbsoluteFill>
  );
};

export const Flash: React.FC<{ t: number; at: number; dur?: number; peak?: number; color?: string }> = ({ t, at, dur = 0.3, peak = 0.35, color = "228,220,255" }) => {
  const k = (t - at) / dur;
  if (k < 0 || k > 1) return null;
  return <AbsoluteFill style={{ background: `rgba(${color},${peak * (1 - k) ** 2})`, pointerEvents: "none" }} />;
};

/** Four lilac corner brackets that snap onto a rect (window coordinates). */
export const Bracket: React.FC<{
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  t: number;
  at: number;
  out?: number;
  arm?: number;
  thick?: number;
  color?: string;
  fill?: boolean;
}> = ({ x0, y0, x1, y1, t, at, out = 1e9, arm = 34, thick = 5, color = theme2.lilac, fill = true }) => {
  if (t < at) return null;
  const k = springAt(t, at, 11, 0.5, 170);
  const ko = prog(t, out, out + 0.22, ease.in);
  const off = (1 - k) * 46 + ko * 30;
  const op = clamp01(k * 2.2) * (1 - ko);
  if (op <= 0.001) return null;
  const flash = 1 - clamp01((t - at) / 0.45);
  const corner = (cx: number, cy: number, sx: number, sy: number, key: string) => (
    <div
      key={key}
      style={{
        position: "absolute",
        left: (sx < 0 ? cx - off : cx + off - arm) as number,
        top: (sy < 0 ? cy - off : cy + off - arm) as number,
        width: arm,
        height: arm,
        borderTop: sy < 0 ? `${thick}px solid ${color}` : undefined,
        borderBottom: sy > 0 ? `${thick}px solid ${color}` : undefined,
        borderLeft: sx < 0 ? `${thick}px solid ${color}` : undefined,
        borderRight: sx > 0 ? `${thick}px solid ${color}` : undefined,
        borderRadius: 6,
        filter: `drop-shadow(0 0 10px ${theme2.glow})`,
      }}
    />
  );
  return (
    <div style={{ position: "absolute", inset: 0, opacity: op, pointerEvents: "none" }}>
      {fill && flash > 0 && (
        <div
          style={{
            position: "absolute",
            left: x0,
            top: y0,
            width: x1 - x0,
            height: y1 - y0,
            borderRadius: 10,
            background: `rgba(188,165,238,${0.32 * flash})`,
            boxShadow: `0 0 ${60 * flash}px rgba(188,165,238,${0.5 * flash})`,
          }}
        />
      )}
      {corner(x0, y0, -1, -1, "tl")}
      {corner(x1, y0, 1, -1, "tr")}
      {corner(x0, y1, -1, 1, "bl")}
      {corner(x1, y1, 1, 1, "br")}
    </div>
  );
};

/** A pill label that springs in (scale + wipe) at `at` and flies out at `out`. */
export const Tag: React.FC<{
  x: number;
  y: number;
  t: number;
  at: number;
  out?: number;
  children: React.ReactNode;
  anchor?: "l" | "c" | "r";
  variant?: "lilac" | "glass" | "paper";
  size?: number;
  style?: React.CSSProperties;
}> = ({ x, y, t, at, out = 1e9, children, anchor = "l", variant = "lilac", size = 30, style }) => {
  if (t < at) return null;
  const k = springAt(t, at, 10, 0.5, 170);
  const kw = prog(t, at, at + 0.28, ease.expo);
  const ko = prog(t, out, out + 0.22, ease.in);
  if (ko >= 1) return null;
  const tx = anchor === "l" ? "0%" : anchor === "c" ? "-50%" : "-100%";
  const pal =
    variant === "lilac"
      ? { bg: theme2.lilac, fg: theme2.ink, bd: "rgba(255,255,255,.35)" }
      : variant === "paper"
        ? { bg: theme2.paper, fg: theme2.ink, bd: "rgba(188,165,238,.6)" }
        : { bg: "rgba(20,20,54,.78)", fg: theme2.lilacSoft, bd: "rgba(188,165,238,.55)" };
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translate(${tx}, -50%) translateY(${(1 - k) * 26 - ko * 40}px) scale(${0.6 + 0.4 * k})`,
        transformOrigin: anchor === "l" ? "0% 50%" : anchor === "c" ? "50% 50%" : "100% 50%",
        opacity: clamp01(k * 2) * (1 - ko),
        clipPath: `inset(-20px ${(1 - kw) * 100}% -20px -20px round 999px)`,
        whiteSpace: "nowrap",
        fontFamily: theme2.sans,
        fontWeight: 800,
        fontSize: size,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        padding: `${size * 0.36}px ${size * 0.72}px ${size * 0.32}px`,
        borderRadius: 999,
        color: pal.fg,
        background: pal.bg,
        border: `1.5px solid ${pal.bd}`,
        boxShadow: `0 18px 40px rgba(3,4,18,.55), 0 0 30px ${theme2.glow}`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/** Springy per-letter kinetic type. */
export const SpringLetters: React.FC<{
  text: string;
  t: number;
  at: number;
  size: number;
  color?: string;
  font?: string;
  weight?: number;
  stagger?: number;
  tracking?: string;
  out?: number;
  style?: React.CSSProperties;
}> = ({ text, t, at, size, color = theme2.fg, font = theme2.display, weight = 800, stagger = 0.025, tracking = "-0.04em", out = 1e9, style }) => {
  if (t < at) return null;
  const chars = [...text];
  return (
    <div
      style={{
        fontFamily: font,
        fontWeight: weight,
        fontSize: size,
        lineHeight: 1,
        letterSpacing: tracking,
        color,
        whiteSpace: "nowrap",
        perspective: 800,
        ...style,
      }}
    >
      {chars.map((ch, i) => {
        const k = springAt(t, at + i * stagger, 12, 0.55, 170);
        const ko = prog(t, out + i * 0.012, out + 0.22 + i * 0.012, ease.in);
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              whiteSpace: "pre",
              transform: `translateY(${(1 - k) * 0.6 - ko * 0.7}em) rotateX(${(1 - k) * -80}deg) scale(${0.7 + 0.3 * k})`,
              opacity: clamp01(k * 1.8) * (1 - ko),
            }}
          >
            {ch}
          </span>
        );
      })}
    </div>
  );
};

/** The site's iridescent chrome ring. */
export const ChromeRing: React.FC<{ size: number; thick: number; rot: number; opacity?: number; style?: React.CSSProperties }> = ({ size, thick, rot, opacity = 1, style }) => (
  <div
    style={{
      position: "absolute",
      width: size,
      height: size,
      borderRadius: "50%",
      opacity,
      background: `conic-gradient(from ${rot}deg, #f4f2ff, #bca5ee, #8fd3ff, #f6c8ff, #fff3d6, #bca5ee, #e4dcff, #f4f2ff)`,
      WebkitMaskImage: `radial-gradient(closest-side, transparent calc(100% - ${thick}px), #000 calc(100% - ${thick - 1}px), #000 calc(100% - 1px), transparent 100%)`,
      maskImage: `radial-gradient(closest-side, transparent calc(100% - ${thick}px), #000 calc(100% - ${thick - 1}px), #000 calc(100% - 1px), transparent 100%)`,
      ...style,
    }}
  />
);

/** Radial burst of light streaks from (cx, cy) at `at`. */
export const Sparks: React.FC<{ cx: number; cy: number; t: number; at: number; n?: number; seed: string; reach?: number; color?: string }> = ({ cx, cy, t, at, n = 26, seed, reach = 520, color = theme2.lilacSoft }) => {
  const p = (t - at) / 0.75;
  if (p < 0 || p > 1) return null;
  const e = ease.expo(p);
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {Array.from({ length: n }, (_, i) => {
        const a = (i / n) * Math.PI * 2 + random(`${seed}a${i}`) * 0.3;
        const sp = 0.45 + random(`${seed}s${i}`) * 0.75;
        const d1 = e * reach * sp;
        const d0 = d1 * (0.55 + 0.25 * p);
        return (
          <line
            key={i}
            x1={cx + Math.cos(a) * d0}
            y1={cy + Math.sin(a) * d0}
            x2={cx + Math.cos(a) * d1}
            y2={cy + Math.sin(a) * d1}
            stroke={i % 5 === 0 ? "#8fd3ff" : color}
            strokeWidth={2 + 3 * (1 - p) * sp}
            strokeLinecap="round"
            opacity={(1 - p) * 0.9}
          />
        );
      })}
    </svg>
  );
};

/** Concentric ripple rings (a "click" without a cursor). Window or frame coordinates. */
export const Ripple: React.FC<{ x: number; y: number; t: number; at: number; size?: number; color?: string }> = ({ x, y, t, at, size = 220, color = "188,165,238" }) => (
  <>
    {[0, 0.12, 0.24].map((d, i) => {
      const p = (t - at - d) / 0.7;
      if (p < 0 || p > 1) return null;
      const r = ease.expo(p) * size;
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
            border: `${Math.max(1, 5 * (1 - p))}px solid rgba(${color},${(1 - p) * 0.9})`,
            boxShadow: `0 0 24px rgba(${color},${(1 - p) * 0.6})`,
          }}
        />
      );
    })}
    {t >= at && t < at + 0.35 && (
      <div
        style={{
          position: "absolute",
          left: x - 22,
          top: y - 22,
          width: 44,
          height: 44,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(255,255,255,${0.9 * (1 - (t - at) / 0.35)}), rgba(${color},0) 70%)`,
        }}
      />
    )}
  </>
);
