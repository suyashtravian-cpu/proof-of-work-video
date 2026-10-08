import { AbsoluteFill, Img, random, staticFile } from "remotion";
import { theme2 } from "../../theme";
import { clamp01, eOut, prog } from "./kit";

const SKY = staticFile("v2/world-sky-v2.png");
// The sky image is 1672x941; at 1920 px tall it is 3412 px wide. Its horizon glow sits ~64% down.
const SKY_W = 3412;

/** The site's floating-island sky with an explicit clock (so two scenes can share one continuous plate). */
export const SkyPlate: React.FC<{ t: number; zoom?: number; opacity?: number; x?: number; y?: number; originY?: number }> = ({
  t,
  zoom = 1,
  opacity = 1,
  x = 0,
  y = 0,
  originY = 1150,
}) => (
  <AbsoluteFill style={{ overflow: "hidden", opacity }}>
    <div
      style={{
        position: "absolute",
        inset: 0,
        transform: `translate(${x + Math.sin(t * 0.2) * 18}px, ${y}px) scale(${zoom})`,
        transformOrigin: `540px ${originY}px`,
      }}
    >
      <Img src={SKY} style={{ position: "absolute", height: 1920, width: SKY_W, left: 540 - SKY_W / 2, top: 0 }} />
    </div>
  </AbsoluteFill>
);

/** Drifting dust in lilac and paper. `dx/dy` is a parallax offset; `warp` (0..1) stretches them into radial streaks. */
export const Motes: React.FC<{
  t: number;
  count?: number;
  seed?: string;
  dx?: number;
  dy?: number;
  opacity?: number;
  warp?: number;
  cx?: number;
  cy?: number;
  size?: number;
}> = ({ t, count = 70, seed = "mo", dx = 0, dy = 0, opacity = 0.7, warp = 0, cx = 540, cy = 960, size = 1 }) => (
  <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
    {Array.from({ length: count }, (_, i) => {
      const z = 0.25 + random(`${seed}z${i}`) * 0.75;
      const bx = random(`${seed}x${i}`) * 1180 - 50;
      const by = random(`${seed}y${i}`) * 2020 - 50;
      const x = (((bx + dx * z + Math.sin(t * 0.7 + i) * 16 * z) % 1180) + 1180) % 1180 - 50;
      const y = (((by + dy * z - t * 46 * z) % 2020) + 2020) % 2020 - 50;
      const lilac = random(`${seed}c${i}`) > 0.45;
      const fill = lilac ? theme2.lilac : theme2.paper;
      const tw = 0.55 + 0.45 * Math.sin(t * (2 + z * 3) + i * 1.7);
      const r = (0.9 + z * 2.6) * size;
      if (warp > 0.02) {
        const vx = x - cx;
        const vy = y - cy;
        const d = Math.hypot(vx, vy) || 1;
        const len = warp * (60 + d * 0.35) * z;
        return (
          <line
            key={i}
            x1={x}
            y1={y}
            x2={x - (vx / d) * len}
            y2={y - (vy / d) * len}
            stroke={fill}
            strokeWidth={r * 0.9}
            strokeLinecap="round"
            opacity={opacity * z * tw}
          />
        );
      }
      return <circle key={i} cx={x} cy={y} r={r} fill={fill} opacity={opacity * z * tw} />;
    })}
  </svg>
);

/** Large soft out-of-focus lights (no CSS blur: radial gradients only). */
export const Bokeh: React.FC<{ t: number; seed?: string; dx?: number; dy?: number; opacity?: number; count?: number }> = ({
  t,
  seed = "bk",
  dx = 0,
  dy = 0,
  opacity = 1,
  count = 8,
}) => (
  <AbsoluteFill style={{ pointerEvents: "none", opacity }}>
    {Array.from({ length: count }, (_, i) => {
      const r = 70 + random(`${seed}r${i}`) * 150;
      const x = random(`${seed}x${i}`) * 1080 + Math.sin(t * 0.35 + i * 2) * 40 + dx * (0.4 + r / 400);
      const y = random(`${seed}y${i}`) * 1920 + Math.cos(t * 0.3 + i) * 50 + dy * (0.4 + r / 400);
      const a = 0.1 + random(`${seed}a${i}`) * 0.16;
      const c = random(`${seed}c${i}`) > 0.3 ? "188,165,238" : "248,247,243";
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
            background: `radial-gradient(circle, rgba(${c},${a}) 0%, rgba(${c},${a * 0.6}) 45%, rgba(${c},0) 70%)`,
          }}
        />
      );
    })}
  </AbsoluteFill>
);

/** A soft diagonal band of light that sweeps across the frame between `at` and `at + dur`. */
export const LightSweep: React.FC<{ t: number; at: number; dur?: number; opacity?: number; angle?: number }> = ({
  t,
  at,
  dur = 0.7,
  opacity = 0.35,
  angle = 18,
}) => {
  const p = prog(t, at, at + dur);
  if (p <= 0 || p >= 1) return null;
  const x = -900 + eOut(p) * 2900;
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
          opacity: opacity * Math.sin(p * Math.PI),
          background: "linear-gradient(90deg, rgba(228,220,255,0) 0%, rgba(228,220,255,.55) 50%, rgba(228,220,255,0) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};

/**
 * The end-card world: sky plate, bokeh and motes. `t` is End-scene time and may be negative,
 * so the Cta portal can show exactly what End opens on. The camera rushes forward out of the
 * portal and settles by ~1.4 s.
 */
export const endZoom = (t: number) => 1.06 + 0.34 * (1 - eOut(prog(t, -0.5, 1.5))) + Math.max(0, t) * 0.012;

export const EndBackdrop: React.FC<{ t: number }> = ({ t }) => {
  const zoom = endZoom(t);
  const warp = 1 - clamp01((t + 0.1) / 0.9);
  return (
    <AbsoluteFill style={{ background: theme2.bg, overflow: "hidden" }}>
      <SkyPlate t={t} zoom={zoom} opacity={0.95} originY={1060} y={-40} />
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(9,13,37,.82) 0%, rgba(9,13,37,.25) 30%, rgba(9,13,37,0) 52%, rgba(9,13,37,.15) 75%, rgba(9,13,37,.7) 100%)",
        }}
      />
      <Bokeh t={t} seed="endbk" dy={-(zoom - 1) * 300} opacity={0.9} />
      <Motes t={t} seed="endmo" count={90} warp={warp} cy={900} dy={-(zoom - 1) * 600} opacity={0.75} />
    </AbsoluteFill>
  );
};
