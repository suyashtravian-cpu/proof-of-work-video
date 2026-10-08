import { AbsoluteFill, random, useCurrentFrame } from "remotion";
import { CUTS, sec } from "../timing";
import { C } from "./util";

const BAR_COLORS = [C.white, C.red, "#000000", C.fg];

/** Torn bars for one frame `f`, strength k (0..1). Black, white and red only. */
const Bars: React.FC<{ f: number; k: number; n?: number; spread?: number; seed: string }> = ({ f, k, n = 9, spread = 240, seed }) => (
  <>
    {Array.from({ length: n }, (_, i) => {
      const y = random(`${seed}y${f}${i}`) * 1920;
      const h = 5 + random(`${seed}h${f}${i}`) * 66;
      const x = (random(`${seed}x${f}${i}`) - 0.5) * spread;
      const c = BAR_COLORS[Math.floor(random(`${seed}c${f}${i}`) * BAR_COLORS.length)];
      return <div key={i} style={{ position: "absolute", left: x, top: y, width: 1080, height: h, background: c, opacity: (i % 2 ? 0.35 : 0.6) * k }} />;
    })}
  </>
);

/** 6-frame glitch on every v4 scene boundary (2 frames before → 4 after), with a one-frame flash. Composition level. */
export const GlitchCut: React.FC<{ cuts?: number[] }> = ({ cuts = CUTS }) => {
  const f = useCurrentFrame();
  const cut = cuts.map(sec).find((c) => f >= c - 2 && f < c + 4);
  if (cut === undefined) return null;
  const k = 1 - Math.abs(f - cut) / 4;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <Bars f={f} k={k} seed="gc" />
      <AbsoluteFill style={{ background: "#fff", opacity: f === cut ? 0.3 : 0 }} />
    </AbsoluteFill>
  );
};

/** In-scene glitch hit: torn bars for ~0.14 s after each time in `at` (Sequence seconds). Use on hard cuts/hits only. */
export const Slices: React.FC<{ at: number[]; dur?: number }> = ({ at, dur = 0.14 }) => {
  const f = useCurrentFrame();
  const t = f / 30;
  const hit = at.find((a) => t >= a && t < a + dur);
  if (hit === undefined) return null;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <Bars f={f} k={1 - (t - hit) / dur} n={8} spread={300} seed="sl" />
    </AbsoluteFill>
  );
};

/** Red/white chroma split of any content for `dur` after `at` (wrap the hero on a cut). */
export const Chroma: React.FC<{ at: number; dur?: number; amount?: number; children: React.ReactNode }> = ({ at, dur = 0.2, amount = 18, children }) => {
  const t = useCurrentFrame() / 30;
  const k = t >= at && t < at + dur ? 1 - (t - at) / dur : 0;
  if (k <= 0) return <>{children}</>;
  const d = amount * k;
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div style={{ position: "absolute", inset: 0, transform: `translateX(${-d}px)`, opacity: 0.7, filter: "sepia(1) saturate(9) hue-rotate(-40deg) brightness(.9)", mixBlendMode: "screen" }}>{children}</div>
      <div style={{ position: "absolute", inset: 0, transform: `translateX(${d * 0.6}px)` }}>{children}</div>
    </div>
  );
};
