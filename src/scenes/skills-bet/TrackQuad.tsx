import { useCurrentFrame } from "remotion";
import { easeExpo, tween } from "../../components/anim";
import { Scramble } from "../../fx/Scramble";
import { theme } from "../../theme";
import { CYAN } from "./plane";

/** Tracking box glued to a projected quad (TL, TR, BR, BL): corner brackets, faint outline, decoding label, live readout. */
export const TrackQuad: React.FC<{ q: [number, number][]; at: number; until: number; label: string; color?: string }> = ({
  q,
  at,
  until,
  label,
  color = theme.fg,
}) => {
  const t = useCurrentFrame() / 30;
  if (t < at || t > until) return null;
  const k = tween(t, at, at + 0.22, 0, 1, easeExpo);
  const out = tween(t, until - 0.12, until, 0, 1);
  const mx = q.reduce((a, p) => a + p[0], 0) / 4;
  const my = q.reduce((a, p) => a + p[1], 0) / 4;
  const grow = 1 + (1 - k) * 0.3;
  const pts = q.map(([x, y]) => [mx + (x - mx) * grow, my + (y - my) * grow] as [number, number]);
  const bracket = (i: number) => {
    const p = pts[i];
    const a = pts[(i + 1) % 4];
    const b = pts[(i + 3) % 4];
    const seg = (n: [number, number]) => {
      const len = Math.hypot(n[0] - p[0], n[1] - p[1]) || 1;
      const f = Math.min(0.3, 46 / len);
      return `${p[0] + (n[0] - p[0]) * f},${p[1] + (n[1] - p[1]) * f}`;
    };
    return <path key={i} d={`M${seg(a)} L${p[0]},${p[1]} L${seg(b)}`} fill="none" stroke={color} strokeWidth={4} strokeLinecap="square" />;
  };
  const tl = pts.reduce((best, p) => (p[0] + p[1] < best[0] + best[1] ? p : best), pts[0]);
  const lx = Math.max(24, Math.min(1080 - 520, tl[0]));
  const ly = Math.max(120, tl[1] - 44);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: k * (1 - out), pointerEvents: "none" }}>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <polygon points={pts.map((p) => p.join(",")).join(" ")} fill={`${color}10`} stroke={color} strokeOpacity={0.35} strokeWidth={1.5} strokeDasharray="8 8" />
        {[0, 1, 2, 3].map(bracket)}
        <path d={`M${mx - 14},${my} L${mx + 14},${my} M${mx},${my - 14} L${mx},${my + 14}`} stroke={CYAN} strokeWidth={2} />
      </svg>
      <div style={{ position: "absolute", left: mx + 18, top: my + 10, fontFamily: theme.mono, fontSize: 16, color: CYAN, letterSpacing: "0.08em", whiteSpace: "pre" }}>
        {`TRK ${String(Math.round(mx)).padStart(4, "0")},${String(Math.round(my)).padStart(4, "0")}`}
      </div>
      <div
        style={{
          position: "absolute",
          left: lx,
          top: ly,
          fontFamily: theme.mono,
          fontSize: 26,
          letterSpacing: "0.1em",
          color: theme.bg,
          background: color,
          padding: "5px 12px",
          whiteSpace: "pre",
        }}
      >
        <Scramble text={label} at={at} dur={0.3} />
      </div>
    </div>
  );
};
