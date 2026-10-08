import { AbsoluteFill, Img, random, staticFile } from "remotion";
import { theme2 } from "../../theme";
import { clamp01, lerp } from "./util";

export const SKY = staticFile("v2/world-sky-v2.png");
const SKY_AR = 1672 / 941;

/** The site's floating-island sky as a deep plate. Driven by global time so it never jumps at a cut. */
export const SkyPlate: React.FC<{ T: number; zoom?: number; y?: number; opacity?: number; blur?: number }> = ({ T, zoom = 1, y = 0, opacity = 1, blur = 0 }) => {
  const h = 1920 * zoom;
  return (
    <AbsoluteFill style={{ overflow: "hidden", opacity }}>
      <Img
        src={SKY}
        style={{
          position: "absolute",
          height: h,
          width: h * SKY_AR,
          left: 540 - (h * SKY_AR) / 2 + Math.sin(T * 0.21) * 36,
          top: 960 - h / 2 + y,
          filter: blur ? `blur(${blur}px)` : undefined,
        }}
      />
    </AbsoluteFill>
  );
};

/** Wide cloud bank cut from the sky plate's own clouds; scale > 1 means "close to the lens". */
export const CloudBank: React.FC<{ scale: number; opacity: number; flip?: boolean; y?: number; x?: number }> = ({ scale, opacity, flip = false, y = 0, x = 0 }) => {
  if (opacity <= 0.001) return null;
  const w = 3000;
  const h = w / SKY_AR;
  return (
    <AbsoluteFill style={{ overflow: "hidden", pointerEvents: "none", opacity }}>
      <div
        style={{
          position: "absolute",
          left: 540 - w / 2 + x,
          top: 2020 - h + y,
          width: w,
          height: h,
          transformOrigin: "50% 100%",
          transform: `scale(${scale}) scaleX(${flip ? -1 : 1})`,
          WebkitMaskImage: "linear-gradient(to bottom, transparent 52%, #000 72%)",
        }}
      >
        <Img src={SKY} style={{ width: "100%", height: "100%" }} />
      </div>
    </AbsoluteFill>
  );
};

/** Slow ambient dust rising through the frame. */
export const Dust: React.FC<{ T: number; count?: number; opacity?: number; seed?: string; speed?: number }> = ({ T, count = 70, opacity = 0.55, seed = "hid", speed = 30 }) => (
  <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
    {Array.from({ length: count }, (_, i) => {
      const z = 0.25 + random(`${seed}z${i}`) * 0.75;
      const x = random(`${seed}x${i}`) * 1080 + Math.sin(T * 0.7 + i) * 18 * z;
      const y = (((random(`${seed}y${i}`) * 2000 - T * speed * z * 2) % 2000) + 2000) % 2000 - 40;
      const tw = 0.55 + 0.45 * Math.sin(T * 3 + i * 1.7);
      return <circle key={i} cx={x} cy={y} r={0.8 + z * 2.4} fill={i % 4 === 0 ? theme2.lilac : "#f4f2ff"} opacity={opacity * z * tw} />;
    })}
  </svg>
);

/** Soft out-of-focus lights in front of everything: depth without CSS blur. */
export const Bokeh: React.FC<{ T: number; opacity?: number; seed?: string; count?: number }> = ({ T, opacity = 1, seed = "bk", count = 11 }) => (
  <AbsoluteFill style={{ pointerEvents: "none", opacity }}>
    {Array.from({ length: count }, (_, i) => {
      const z = random(`${seed}z${i}`);
      const size = 60 + z * 220;
      const x = random(`${seed}x${i}`) * 1180 - 50 + Math.sin(T * (0.3 + z * 0.4) + i) * 60 * (0.4 + z);
      const y = random(`${seed}y${i}`) * 2000 - 40 + Math.cos(T * (0.25 + z * 0.3) + i * 2) * 50 - T * 26 * z;
      const a = (0.08 + (1 - z) * 0.1) * (0.7 + 0.3 * Math.sin(T * 1.4 + i));
      const col = i % 3 === 0 ? "228,220,255" : i % 3 === 1 ? "188,165,238" : "255,214,240";
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
            background: `radial-gradient(circle, rgba(${col},${a}) 0%, rgba(${col},${a * 0.6}) 38%, rgba(${col},0) 70%)`,
          }}
        />
      );
    })}
  </AbsoluteFill>
);

/** Floating glass cards far behind the action: parallax depth. */
export const GlassCards: React.FC<{ T: number; opacity?: number }> = ({ T, opacity = 1 }) => (
  <AbsoluteFill style={{ pointerEvents: "none", opacity, perspective: 1600 }}>
    {Array.from({ length: 7 }, (_, i) => {
      const z = random(`gc-z${i}`);
      const w = 130 + z * 170;
      const h = w * (0.62 + random(`gc-h${i}`) * 0.3);
      const x = random(`gc-x${i}`) * 1080 + Math.sin(T * 0.35 + i) * 30;
      const y = 120 + random(`gc-y${i}`) * 1650 + Math.cos(T * 0.4 + i * 1.3) * 26 - T * (6 + z * 10);
      const ry = Math.sin(T * 0.5 + i) * 28 + (i % 2 ? 20 : -20);
      const rx = Math.cos(T * 0.45 + i) * 16;
      return (
        <div
          key={i}
          style={{
            position: "absolute",
            left: x - w / 2,
            top: y - h / 2,
            width: w,
            height: h,
            borderRadius: 16,
            border: "1px solid rgba(228,220,255,.22)",
            background: "linear-gradient(140deg, rgba(228,220,255,.13), rgba(188,165,238,.04) 60%, rgba(159,211,255,.06))",
            opacity: 0.35 + z * 0.4,
            transform: `rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${Math.sin(T * 0.3 + i) * 6}deg)`,
            boxShadow: "0 20px 50px rgba(3,4,18,.35)",
          }}
        >
          {[0.28, 0.5, 0.68].map((yy, k) => (
            <div key={k} style={{ position: "absolute", left: "12%", top: `${yy * 100}%`, width: `${[62, 44, 30][k]}%`, height: k === 0 ? 7 : 4, borderRadius: 4, background: k === 0 ? "rgba(228,220,255,.35)" : "rgba(228,220,255,.16)" }} />
          ))}
        </div>
      );
    })}
  </AbsoluteFill>
);

/** Warp streaks flowing out of a vanishing point: the camera drifting forward through the sky. */
export const Streaks: React.FC<{ T: number; opacity: number; cx?: number; cy?: number; speed?: number }> = ({ T, opacity, cx = 540, cy = 900, speed = 0.28 }) => {
  if (opacity <= 0.001) return null;
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity }}>
      {Array.from({ length: 64 }, (_, i) => {
        const ang = random(`st-a${i}`) * Math.PI * 2;
        const z = (random(`st-z${i}`) + T * speed * (0.7 + random(`st-s${i}`) * 0.6)) % 1;
        const r0 = 60 / (1.02 - z);
        const r1 = 60 / (1.02 - Math.max(0, z - 0.035));
        const dx = Math.cos(ang);
        const dy = Math.sin(ang);
        const a = clamp01((z - 0.1) * 2) * (1 - clamp01((z - 0.92) * 12));
        return (
          <line
            key={i}
            x1={cx + dx * r1}
            y1={cy + dy * r1}
            x2={cx + dx * r0}
            y2={cy + dy * r0}
            stroke={i % 3 === 0 ? theme2.lilac : "#f4f2ff"}
            strokeWidth={0.6 + z * 2.6}
            strokeLinecap="round"
            opacity={a * 0.8}
          />
        );
      })}
    </svg>
  );
};

/** A diagonal band of light sweeping across its (overflow-hidden) parent; k goes 0 -> 1. */
export const Sweep: React.FC<{ k: number; width?: number; strength?: number; angle?: number; span?: number }> = ({ k, width = 420, strength = 0.22, angle = 100, span = 1900 }) => {
  if (k <= 0 || k >= 1) return null;
  const x = lerp(-span * 0.6, span, k);
  return (
    <div
      style={{
        position: "absolute",
        top: "-50%",
        left: 0,
        width,
        height: "200%",
        transform: `translateX(${x}px) rotate(${angle - 90}deg)`,
        background: `linear-gradient(90deg, rgba(228,220,255,0), rgba(228,220,255,${strength}) 50%, rgba(228,220,255,0))`,
        mixBlendMode: "screen",
        pointerEvents: "none",
      }}
    />
  );
};

const IRI = "#bca5ee, #f8f7f3 9%, #9fd3ff 20%, #e4dcff 31%, #c9a7ff 43%, #6d5bd0 55%, #ffd6f0 66%, #f8f7f3 76%, #8fb8ff 87%, #bca5ee";

/**
 * The site's iridescent chrome ring, as a tilted 3D orbit. `half` renders only the far
 * (top) or near (bottom) arc so it can pass behind and in front of other layers.
 */
export const IriRing: React.FC<{
  cx: number;
  cy: number;
  d: number;
  thick: number;
  tilt: number;
  rx: number;
  spin: number;
  opacity: number;
  half?: "back" | "front";
}> = ({ cx, cy, d, thick, tilt, rx, spin, opacity, half }) => {
  if (opacity <= 0.001 || d < 4) return null;
  const box = d * 1.2;
  const clip = half === "back" ? "inset(0 0 50% 0)" : half === "front" ? "inset(50% 0 0 0)" : undefined;
  const t = Math.max(1.5, thick);
  const ring = `radial-gradient(farthest-side, transparent calc(100% - ${t}px), #000 calc(100% - ${t - 1}px), #000 calc(100% - 1px), transparent 100%)`;
  return (
    <div
      style={{
        position: "absolute",
        left: cx - box / 2,
        top: cy - box / 2,
        width: box,
        height: box,
        transform: `rotateZ(${tilt}deg)`,
        clipPath: clip,
        opacity,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: (box - d) / 2,
          top: (box - d) / 2,
          width: d,
          height: d,
          transform: `perspective(1800px) rotateX(${rx}deg)`,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            background: `conic-gradient(from ${spin}deg, ${IRI})`,
            WebkitMaskImage: ring,
            filter: `drop-shadow(0 0 ${Math.max(4, t * 0.6)}px rgba(188,165,238,.8))`,
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            background: `radial-gradient(farthest-side, transparent calc(100% - ${t}px), rgba(20,16,60,.45) calc(100% - ${t}px), rgba(255,255,255,.55) calc(100% - ${t * 0.55}px), rgba(20,16,60,.35) 100%)`,
            WebkitMaskImage: ring,
            mixBlendMode: "overlay",
          }}
        />
      </div>
    </div>
  );
};

/** A clean macOS-style pointer; `press` 0..1 squashes it on click. */
export const Pointer: React.FC<{ x: number; y: number; press?: number; opacity?: number; size?: number }> = ({ x, y, press = 0, opacity = 1, size = 1.7 }) => {
  if (opacity <= 0.001) return null;
  return (
    <svg
      width={34 * size}
      height={48 * size}
      viewBox="0 0 34 48"
      style={{
        position: "absolute",
        left: x - 3 * size,
        top: y - 2 * size,
        opacity,
        transformOrigin: "10% 6%",
        transform: `scale(${1 - press * 0.16})`,
        filter: "drop-shadow(0 8px 14px rgba(3,4,18,.55))",
        overflow: "visible",
      }}
    >
      <path d="M3 2 L3 38 L12 29.5 L18.5 44 L25 41 L18.6 27 L30.5 27 Z" fill="#f8f7f3" stroke="#25243b" strokeWidth={2.2} strokeLinejoin="round" />
    </svg>
  );
};

/** Expanding lilac rings at a click point; k goes 0 -> 1. */
export const Ripple: React.FC<{ x: number; y: number; k: number; r?: number }> = ({ x, y, k, r = 110 }) => {
  if (k <= 0 || k >= 1) return null;
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none" }}>
      {[0, 0.18].map((d, i) => {
        const kk = clamp01((k - d) / (1 - d));
        if (kk <= 0) return null;
        return <circle key={i} cx={x} cy={y} r={10 + r * Math.sqrt(kk)} fill="none" stroke={i ? theme2.lilacSoft : theme2.lilac} strokeWidth={5 * (1 - kk) + 1} opacity={(1 - kk) * 0.95} />;
      })}
      <circle cx={x} cy={y} r={16 * (1 - k)} fill={theme2.lilacSoft} opacity={1 - k} />
    </svg>
  );
};

/** Lilac corner brackets around a rect (tracking callout). */
export const Brackets: React.FC<{ x: number; y: number; w: number; h: number; opacity: number; arm?: number; stroke?: number; color?: string }> = ({
  x,
  y,
  w,
  h,
  opacity,
  arm = 30,
  stroke = 4,
  color = theme2.lilac,
}) => {
  if (opacity <= 0.001) return null;
  const a = Math.min(arm, w / 2.5, h / 1.5);
  const d = `M${x} ${y + a} V${y} H${x + a} M${x + w - a} ${y} H${x + w} V${y + a} M${x + w} ${y + h - a} V${y + h} H${x + w - a} M${x + a} ${y + h} H${x} V${y + h - a}`;
  return (
    <svg style={{ position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none", opacity }} width={1} height={1}>
      <path d={d} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 8px ${theme2.glow})` }} />
    </svg>
  );
};
