import { AbsoluteFill, Freeze, Img, OffthreadVideo, random, staticFile, useCurrentFrame } from "remotion";
import { REC, REC_H, REC_W } from "../../components/Rec";
import { theme2 } from "../../theme";

// Shared toolkit for the Manifesto and Work scenes ("manifesto-work" group).

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
/** 0..1 progress of t through [a, b]. */
export const prog = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));
export const easeOutCubic = (k: number) => 1 - (1 - k) ** 3;
export const easeInCubic = (k: number) => k ** 3;
export const easeInOutCubic = (k: number) => (k < 0.5 ? 4 * k ** 3 : 1 - (-2 * k + 2) ** 3 / 2);
export const easeOutExpo = (k: number) => (k >= 1 ? 1 : 1 - 2 ** (-10 * k));
export const easeInExpo = (k: number) => (k <= 0 ? 0 : 2 ** (10 * k - 10));

/**
 * Analytic damped spring, 0 → 1 starting at tau = 0 (seconds). Smooth for fractional
 * times, so letter staggers of a few hundredths of a second stay even.
 * w: natural frequency (rad/s), z: damping ratio (< 1 overshoots).
 */
export const sp = (tau: number, w = 16, z = 0.55) => {
  if (tau <= 0) return 0;
  if (z >= 1) return 1 - Math.exp(-w * tau) * (1 + w * tau);
  const wd = w * Math.sqrt(1 - z * z);
  return 1 - Math.exp(-z * w * tau) * (Math.cos(wd * tau) + ((z * w) / wd) * Math.sin(wd * tau));
};

/** Music grid after the drop (Electro Dreams, ~117 BPM). Scene-relative for Work. */
export const BEAT = 0.513;

// ---------------------------------------------------------------------------
// Recording viewport: a camera onto public/v2/rec.mp4 in source pixels.
// ---------------------------------------------------------------------------

/** Where the camera looks, in recording pixels: centre and visible width. */
export type View = { cx: number; cy: number; w: number };
/** Zoom interpolates geometrically so pushes feel even. */
export const mixView = (a: View, b: View, k: number): View => ({
  cx: lerp(a.cx, b.cx, k),
  cy: lerp(a.cy, b.cy, k),
  w: a.w * (b.w / a.w) ** k,
});

/**
 * Shows the recording at source time `src` (any time; quantised to the 60 fps source
 * frames through <Freeze>), framed by `view`. Children are drawn in recording pixels,
 * so callouts stay locked to the UI they mark however the camera moves.
 */
export const RecView: React.FC<{
  width: number;
  height: number;
  src: number;
  view: View;
  children?: React.ReactNode;
  filter?: string;
}> = ({ width, height, src, view, children, filter }) => {
  const s = width / view.w;
  const frame = Math.max(0, Math.round(src * 60));
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width, height, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: REC_W,
          height: REC_H,
          transformOrigin: "0 0",
          transform: `translate(${width / 2}px, ${height / 2}px) scale(${s}) translate(${-view.cx}px, ${-view.cy}px)`,
          filter,
        }}
      >
        <Freeze frame={frame}>
          <OffthreadVideo
            src={REC}
            muted
            playbackRate={0.5}
            style={{ position: "absolute", left: 0, top: 0, width: REC_W, height: REC_H }}
          />
        </Freeze>
        {children}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Atmosphere
// ---------------------------------------------------------------------------

/** The site's floating-island sky as a moving plate (own transform so scenes can push it). */
export const SkyPlate: React.FC<{ opacity?: number; blur?: number; scale?: number; x?: number; y?: number; brightness?: number }> = ({
  opacity = 0.35,
  blur = 0,
  scale = 1,
  x = 0,
  y = 0,
  brightness = 1,
}) => (
  <AbsoluteFill style={{ overflow: "hidden", opacity }}>
    <Img
      src={staticFile("v2/world-sky-v2.png")}
      style={{
        position: "absolute",
        height: "100%",
        left: "50%",
        top: 0,
        transform: `translateX(-50%) translate(${x}px, ${y}px) scale(${scale})`,
        filter: `${blur ? `blur(${blur}px) ` : ""}brightness(${brightness})`,
      }}
    />
  </AbsoluteFill>
);

/** Soft out-of-focus light orbs, drawn as radial gradients (no CSS blur). */
export const Bokeh: React.FC<{ count?: number; seed?: string; opacity?: number; drift?: number; pulse?: number }> = ({
  count = 9,
  seed = "bk",
  opacity = 1,
  drift = 1,
  pulse = 0,
}) => {
  const t = useCurrentFrame() / 30;
  return (
    <AbsoluteFill style={{ pointerEvents: "none", opacity }}>
      {Array.from({ length: count }, (_, i) => {
        const z = 0.3 + random(`${seed}z${i}`) * 0.7;
        const size = 90 + z * 260;
        const x = random(`${seed}x${i}`) * 1180 - 50 + Math.sin(t * 0.35 * drift + i * 1.7) * 40 * z;
        const y = ((random(`${seed}y${i}`) * 2100 - t * 26 * z * drift) % 2100 + 2100) % 2100 - 100;
        const hue = random(`${seed}h${i}`);
        const c = hue < 0.6 ? "188,165,238" : hue < 0.85 ? "228,220,255" : "160,220,235";
        const a = (0.08 + 0.14 * z) * (1 + pulse * 0.8);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x - size / 2,
              top: y - size / 2,
              width: size,
              height: size,
              borderRadius: "50%",
              background: `radial-gradient(circle, rgba(${c},${a}) 0%, rgba(${c},${a * 0.55}) 38%, rgba(${c},0) 70%)`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

/** Drifting lilac dust with depth. */
export const Dust: React.FC<{ count?: number; seed?: string; opacity?: number; speed?: number; color?: string }> = ({
  count = 70,
  seed = "du",
  opacity = 0.6,
  speed = 1,
  color = theme2.lilacSoft,
}) => {
  const t = useCurrentFrame() / 30;
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {Array.from({ length: count }, (_, i) => {
        const z = 0.25 + random(`${seed}z${i}`) * 0.75;
        const x = (((random(`${seed}x${i}`) * 1080 + Math.sin(t * 0.7 + i) * 18 * z) % 1080) + 1080) % 1080;
        const y = (((random(`${seed}y${i}`) * 1920 - t * 55 * z * speed) % 1920) + 1920) % 1920;
        const tw = 0.6 + 0.4 * Math.sin(t * 3 + i * 2.1);
        return <circle key={i} cx={x} cy={y} r={0.8 + z * 2.4} fill={color} opacity={opacity * z * tw} />;
      })}
    </svg>
  );
};

/** A broad diagonal light band sweeping across the frame during [at, at + dur]. */
export const LightSweep: React.FC<{ at: number; dur?: number; angle?: number; opacity?: number; color?: string }> = ({
  at,
  dur = 0.7,
  angle = 18,
  opacity = 0.22,
  color = "228,220,255",
}) => {
  const t = useCurrentFrame() / 30;
  const k = (t - at) / dur;
  if (k < 0 || k > 1) return null;
  const x = lerp(-900, 1500, easeInOutCubic(k));
  return (
    <AbsoluteFill style={{ pointerEvents: "none", overflow: "hidden", mixBlendMode: "screen" }}>
      <div
        style={{
          position: "absolute",
          left: x - 260,
          top: -400,
          width: 520,
          height: 2800,
          transform: `rotate(${angle}deg)`,
          background: `linear-gradient(90deg, rgba(${color},0) 0%, rgba(${color},${opacity}) 50%, rgba(${color},0) 100%)`,
        }}
      />
    </AbsoluteFill>
  );
};

/** Iridescent chrome palette (the site's ring): lilac, rose, soft cyan accent. */
export const IRI = ["#e4dcff", "#bca5ee", "#f1c3e6", "#a6e3ee", "#e4dcff"];
const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
/** Sample the iridescent palette at u (wraps). */
export const iri = (u: number) => {
  const n = IRI.length - 1;
  const x = (((u % 1) + 1) % 1) * n;
  const i = Math.floor(x);
  const f = x - i;
  const a = hex(IRI[i]);
  const b = hex(IRI[i + 1]);
  return `rgb(${a.map((v, j) => Math.round(v + (b[j] - v) * f)).join(",")})`;
};

/** An iridescent chrome ring (conic gradient masked to a band). */
export const IriRing: React.FC<{ size: number; thickness: number; rotate?: number; opacity?: number; style?: React.CSSProperties }> = ({
  size,
  thickness,
  rotate = 0,
  opacity = 1,
  style,
}) => {
  const inner = Math.max(0, 50 - (thickness / size) * 100);
  const mask = `radial-gradient(circle, transparent ${inner - 0.6}%, #000 ${inner}%, #000 49.4%, transparent 50%)`;
  return (
    <div
      style={{
        position: "absolute",
        width: size,
        height: size,
        borderRadius: "50%",
        opacity,
        background: `conic-gradient(from ${rotate}deg, ${IRI.join(", ")})`,
        WebkitMaskImage: mask,
        maskImage: mask,
        ...style,
      }}
    />
  );
};

/** Per-letter kinetic type: each glyph springs up out of a 3D flip. */
export const Letters: React.FC<{
  text: string;
  at: number;
  stagger?: number;
  w?: number;
  z?: number;
  rise?: number;
  colorAt?: (i: number, n: number) => string;
  style?: React.CSSProperties;
}> = ({ text, at, stagger = 0.03, w = 17, z = 0.52, rise = 0.55, colorAt, style }) => {
  const t = useCurrentFrame() / 30;
  const chars = [...text];
  return (
    <span style={{ display: "inline-block", whiteSpace: "pre", ...style }}>
      {chars.map((ch, i) => {
        const p = sp(t - at - i * stagger, w, z);
        const q = clamp01(p);
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              transform: `translateY(${(1 - p) * rise}em) rotateX(${(1 - q) * -85}deg) scale(${0.7 + 0.3 * p})`,
              transformOrigin: "50% 80%",
              opacity: clamp01(p * 2.2),
              filter: q < 0.98 ? `blur(${(1 - q) * 9}px)` : undefined,
              color: colorAt ? colorAt(i, chars.length) : undefined,
            }}
          >
            {ch}
          </span>
        );
      })}
    </span>
  );
};

/** Eight-spoke asterisk (the site's ✳ marquee separator) as SVG, so no glyph fallback. */
export const Asterisk: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="-10 -10 20 20" style={{ display: "inline-block", verticalAlign: "middle" }}>
    {[0, 45, 90, 135].map((a) => (
      <rect key={a} x={-1.2} y={-9} width={2.4} height={18} rx={1.2} fill={color} transform={`rotate(${a})`} />
    ))}
  </svg>
);
