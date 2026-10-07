import { random, useCurrentFrame } from "remotion";
import { easeExpo, tween } from "../../components/anim";
import { Scramble } from "../../fx/Scramble";
import { theme } from "../../theme";
import { Rect } from "./geom";

/**
 * Tracking box for UI inside footage: brackets snap in from wide, a hairline outline
 * flickers on, the label decodes, and a live coordinate readout ticks under the box.
 * Pass a fresh rect every frame and it follows the UI (zoom / drift).
 */
export const Track: React.FC<{
  r: Rect;
  at: number;
  until?: number;
  label: string;
  color?: string;
  ink?: string;
  pos?: "top" | "bottom";
  size?: number;
}> = ({ r, at, until = Infinity, label, color = theme.fg, ink = theme.bg, pos = "top", size = 19 }) => {
  const f = useCurrentFrame();
  const t = f / 30;
  if (t < at || t > until) return null;
  const k = tween(t, at, at + 0.28, 0, 1, easeExpo);
  const out = until === Infinity ? 0 : tween(t, until - 0.12, until, 0, 1);
  const flick = t - at < 0.1 ? (Math.floor(f) % 2 ? 0.35 : 1) : 1;
  const pad = 10 + (1 - k) * 60;
  const X = r.x - pad;
  const Y = r.y - pad;
  const W = r.w + pad * 2;
  const H = r.h + pad * 2;
  const L = Math.min(30, W / 3, H / 3);
  const corner = (cx: number, cy: number, sx: number, sy: number) => (
    <path d={`M${cx + sx * L},${cy} L${cx},${cy} L${cx},${cy + sy * L}`} fill="none" stroke={color} strokeWidth={4} />
  );
  const jitter = (random(`tj${label}${Math.floor(f / 3)}`) - 0.5) * 2;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, opacity: k * (1 - out) * flick, pointerEvents: "none" }}>
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <rect x={X} y={Y} width={W} height={H} fill={color} fillOpacity={0.06} stroke={color} strokeOpacity={0.45} strokeWidth={1.5} strokeDasharray="6 6" />
        {corner(X, Y, 1, 1)}
        {corner(X + W, Y, -1, 1)}
        {corner(X, Y + H, 1, -1)}
        {corner(X + W, Y + H, -1, -1)}
        <line x1={X + W / 2 - 9} y1={Y + H / 2} x2={X + W / 2 + 9} y2={Y + H / 2} stroke={color} strokeOpacity={0.5} strokeWidth={1.5} />
        <line x1={X + W / 2} y1={Y + H / 2 - 9} x2={X + W / 2} y2={Y + H / 2 + 9} stroke={color} strokeOpacity={0.5} strokeWidth={1.5} />
      </svg>
      <div
        style={{
          position: "absolute",
          left: X,
          top: pos === "top" ? Y - size - 18 : Y + H + 6,
          fontFamily: theme.mono,
          fontSize: size,
          lineHeight: 1,
          letterSpacing: "0.1em",
          color: ink,
          background: color,
          padding: "5px 9px",
          whiteSpace: "pre",
        }}
      >
        <Scramble text={label} at={at} dur={0.32} />
      </div>
      <div
        style={{
          position: "absolute",
          left: X + W - 150,
          width: 150,
          textAlign: "right",
          top: pos === "top" ? Y + H + 6 : Y - 22,
          fontFamily: theme.mono,
          fontSize: 13,
          letterSpacing: "0.08em",
          color,
          opacity: 0.75,
        }}
      >
        {`X${String(Math.round(r.x + jitter)).padStart(4, "0")} Y${String(Math.round(r.y)).padStart(4, "0")}`}
      </div>
    </div>
  );
};
