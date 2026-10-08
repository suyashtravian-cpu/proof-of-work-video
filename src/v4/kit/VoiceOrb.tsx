import { useCurrentFrame } from "remotion";
import ENV from "../vo-envelope.json";
import { C, clamp01, pop } from "./util";

/** Voice loudness 0..1 at a video time (seconds). Precomputed by scripts/vo-envelope.py; no audio decoding at render. */
export const voiceLevel = (videoSec: number) => {
  const x = videoSec * ENV.fps;
  const i = Math.floor(x);
  const a = ENV.level[i] ?? 0;
  const b = ENV.level[i + 1] ?? 0;
  return a + (b - a) * (x - i);
};

/** Where the composition parks the orb between the hook and the end card (just above the captions). */
export const ORB_DOCK = { x: 540, y: 1166, size: 46 };

/**
 * A small red-and-white orb that breathes with the voice.
 * `sceneStart` = the Sequence's start in video seconds, so the envelope lines up inside a Sequence.
 * `born` (Sequence seconds) pops it in; `level` overrides the envelope (e.g. to hold it open).
 */
export const VoiceOrb: React.FC<{
  x: number;
  y: number;
  size?: number;
  sceneStart?: number;
  born?: number;
  level?: number;
  opacity?: number;
  /** Extra scale on top of the voice pulse (morphs, exits). */
  scale?: number;
  /** 0..1: fades the orbit ring and halo (when the orb becomes something else). */
  plain?: number;
}> = ({ x, y, size = ORB_DOCK.size, sceneStart = 0, born, level, opacity = 1, scale = 1, plain = 0 }) => {
  const f = useCurrentFrame();
  const t = f / 30;
  const v = level ?? voiceLevel(sceneStart + t);
  const b = born === undefined ? 1 : pop(t, born, 0.28);
  if (b <= 0 || opacity <= 0) return null;
  const breathe = 0.03 * Math.sin(t * 3.1);
  const s = size * b * scale * (1 + 0.38 * v + breathe);
  const halo = (1 - plain) * clamp01(0.25 + v);
  const ring = (1 - plain) * (0.35 + 0.5 * v);
  const spin = t * 140;
  return (
    <div style={{ position: "absolute", left: x, top: y, width: 0, height: 0, opacity, pointerEvents: "none" }}>
      {/* halo */}
      <div
        style={{
          position: "absolute",
          left: -s * 1.6,
          top: -s * 1.6,
          width: s * 3.2,
          height: s * 3.2,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(255,59,47,${0.38 * halo}) 0%, rgba(255,59,47,${0.12 * halo}) 38%, rgba(255,59,47,0) 70%)`,
        }}
      />
      {/* voice ripples: one ring per strong syllable, expanding */}
      {[0, 1].map((k) => {
        const p = ((t * 1.6 + k * 0.5) % 1 + 1) % 1;
        const r = s * (0.6 + p * 0.9);
        return (
          <div
            key={k}
            style={{ position: "absolute", left: -r, top: -r, width: r * 2, height: r * 2, borderRadius: "50%", border: `1.5px solid ${C.white}`, opacity: ring * v * (1 - p) * 0.8 }}
          />
        );
      })}
      {/* orbit with a satellite dot */}
      <svg width={s * 2} height={s * 2} viewBox="-1 -1 2 2" style={{ position: "absolute", left: -s, top: -s, overflow: "visible", transform: `rotate(${spin}deg)`, opacity: ring }}>
        <circle r={0.78} fill="none" stroke={C.white} strokeWidth={0.035} strokeDasharray="0.9 0.35" opacity={0.55} />
        <circle cx={0.78} cy={0} r={0.07} fill={C.white} />
      </svg>
      {/* core */}
      <div
        style={{
          position: "absolute",
          left: -s / 2,
          top: -s / 2,
          width: s,
          height: s,
          borderRadius: "50%",
          background: `radial-gradient(circle at 38% 34%, #ffffff 0%, #ffe3e0 ${14 + 16 * v}%, ${C.red} ${52 + 10 * v}%, #8f160e 100%)`,
          boxShadow: `0 0 ${12 + 40 * v}px ${2 + 8 * v}px rgba(255,59,47,${(0.45 + 0.4 * v) * (1 - plain * 0.6)})`,
        }}
      />
    </div>
  );
};
