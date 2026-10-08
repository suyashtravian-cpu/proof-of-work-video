import { useCurrentFrame } from "remotion";
import { anchorX, C, clamp01 } from "./util";

/**
 * The agent's "thinking" beat: one shimmering line, ~0.4 s, right before a reveal.
 * Times in Sequence seconds. Gone by `at + dur`.
 */
export const Thinking: React.FC<{
  at: number;
  dur?: number;
  text?: string;
  x?: number;
  y: number;
  anchor?: "l" | "c" | "r";
  size?: number;
}> = ({ at, dur = 0.42, text = "thinking · planning 3 steps…", x = 540, y, anchor = "c", size = 26 }) => {
  const t = useCurrentFrame() / 30;
  if (t < at || t > at + dur) return null;
  const k = clamp01((t - at) / 0.08);
  const out = clamp01((t - (at + dur - 0.08)) / 0.08);
  // the highlight sweeps across twice
  const p = (((t - at) / (dur / 2)) % 1) * 160 - 30;
  const spin = (t - at) * 540;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translate(${anchorX(anchor)}, -50%) translateY(${(1 - k) * 8 - out * 8}px)`,
        opacity: k * (1 - out),
        display: "flex",
        alignItems: "center",
        gap: size * 0.5,
        whiteSpace: "nowrap",
        pointerEvents: "none",
      }}
    >
      <svg width={size * 0.8} height={size * 0.8} viewBox="-10 -10 20 20" style={{ transform: `rotate(${spin}deg)`, filter: `drop-shadow(0 0 6px ${C.redGlow})` }}>
        {[0, 60, 120].map((a) => (
          <rect key={a} x={-1.6} y={-9} width={3.2} height={18} rx={1.6} fill={C.red} transform={`rotate(${a})`} />
        ))}
      </svg>
      <span
        style={{
          fontFamily: C.mono,
          fontSize: size,
          letterSpacing: "0.04em",
          backgroundImage: `linear-gradient(90deg, rgba(255,255,255,.38) 0%, rgba(255,255,255,.38) ${p - 18}%, #ffffff ${p}%, rgba(255,255,255,.38) ${p + 18}%, rgba(255,255,255,.38) 100%)`,
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
        }}
      >
        {text}
      </span>
    </div>
  );
};
