import { theme2 } from "../../theme";
import { clamp01, easeOutCubic, prog } from "./kit";

// Callouts drawn in RECORDING pixels (children of RecView), so they stay locked to the
// UI while the camera moves. `s` is the current screen-px per recording-px scale, used to
// keep strokes and label text a constant size on screen.

/** A lilac rounded box that draws itself around a UI element, with an optional tab label. */
export const DrawBox: React.FC<{
  t: number;
  at: number;
  until?: number;
  x: number;
  y: number;
  w: number;
  h: number;
  s: number;
  label?: string;
  labelSide?: "top" | "bottom";
}> = ({ t, at, until = 1e9, x, y, w, h, s, label, labelSide = "top" }) => {
  if (t < at) return null;
  const draw = easeOutCubic(prog(t, at, at + 0.38));
  const out = 1 - prog(t, until, until + 0.18);
  if (out <= 0) return null;
  const sw = 3.2 / s;
  const r = 14 / s;
  const tabK = easeOutCubic(prog(t, at + 0.16, at + 0.42));
  const fs = 23 / s;
  const pulse = 0.5 + 0.5 * Math.sin((t - at) * 10);
  return (
    <div style={{ position: "absolute", left: 0, top: 0, opacity: out }}>
      <svg width={1708} height={1080} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <rect x={x} y={y} width={w} height={h} rx={r} fill={`rgba(188,165,238,${0.1 * draw})`} />
        <rect
          x={x}
          y={y}
          width={w}
          height={h}
          rx={r}
          fill="none"
          stroke={theme2.lilac}
          strokeWidth={sw}
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - draw}
          style={{ filter: `drop-shadow(0 0 ${6 / s}px rgba(150,120,230,.85))` }}
        />
        <circle cx={x + w} cy={y} r={(6 + 3 * pulse) / s} fill={theme2.lilac} opacity={draw} />
      </svg>
      {label && (
        <div
          style={{
            position: "absolute",
            left: x,
            top: labelSide === "top" ? y - fs * 2.1 : y + h + fs * 0.5,
            transform: `translateY(${(1 - tabK) * (labelSide === "top" ? 10 : -10) / s}px) scale(${0.85 + 0.15 * tabK})`,
            transformOrigin: "0% 100%",
            opacity: tabK,
            padding: `${fs * 0.28}px ${fs * 0.6}px`,
            borderRadius: fs * 0.5,
            background: theme2.lilac,
            color: "#1a1640",
            fontFamily: theme2.mono,
            fontSize: fs,
            fontWeight: 500,
            letterSpacing: "0.06em",
            whiteSpace: "nowrap",
            boxShadow: `0 ${4 / s}px ${18 / s}px rgba(60,40,140,.35)`,
          }}
        >
          {label}
        </div>
      )}
    </div>
  );
};

/** A highlighter stroke sweeping across one or more text runs, in order. */
export const Marker: React.FC<{
  t: number;
  at: number;
  dur?: number;
  until?: number;
  runs: { x: number; y: number; w: number; h: number }[];
}> = ({ t, at, dur = 0.5, until = 1e9, runs }) => {
  if (t < at) return null;
  const out = 1 - prog(t, until, until + 0.18);
  const total = runs.reduce((n, r) => n + r.w, 0);
  const k = easeOutCubic(prog(t, at, at + dur)) * total;
  let acc = 0;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, opacity: out }}>
      {runs.map((r, i) => {
        const w = clamp01((k - acc) / r.w) * r.w;
        acc += r.w;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: r.x,
              top: r.y,
              width: w,
              height: r.h,
              borderRadius: r.h * 0.3,
              background: "linear-gradient(180deg, rgba(188,165,238,.55), rgba(170,140,235,.7))",
              mixBlendMode: "multiply",
            }}
          />
        );
      })}
    </div>
  );
};
