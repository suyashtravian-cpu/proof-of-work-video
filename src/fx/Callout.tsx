import { useCurrentFrame } from "remotion";
import { easeExpo, tween } from "../components/anim";
import { theme } from "../theme";
import { Scramble } from "./Scramble";

/** HUD tracking box: corner brackets snap in around a region, label decodes above it. */
export const Callout: React.FC<{ x: number; y: number; w: number; h: number; at: number; label: string; color?: string; until?: number }> = ({
  x,
  y,
  w,
  h,
  at,
  label,
  color = theme.fg,
  until = Infinity,
}) => {
  const t = useCurrentFrame() / 30;
  if (t < at || t > until) return null;
  const k = tween(t, at, at + 0.25, 0, 1, easeExpo);
  const out = until === Infinity ? 0 : tween(t, until - 0.15, until, 0, 1);
  const pad = (1 - k) * 40;
  const L = 26;
  const corner = (cx: number, cy: number, sx: number, sy: number) => (
    <path d={`M${cx + sx * L},${cy} L${cx},${cy} L${cx},${cy + sy * L}`} fill="none" stroke={color} strokeWidth={3} />
  );
  const X = x - pad;
  const Y = y - pad;
  const W = w + pad * 2;
  const H = h + pad * 2;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, opacity: k * (1 - out), pointerEvents: "none" }}>
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        {corner(X, Y, 1, 1)}
        {corner(X + W, Y, -1, 1)}
        {corner(X, Y + H, 1, -1)}
        {corner(X + W, Y + H, -1, -1)}
      </svg>
      <div style={{ position: "absolute", left: X, top: Y - 34, fontFamily: theme.mono, fontSize: 18, letterSpacing: "0.12em", color: theme.bg, background: color, padding: "3px 8px" }}>
        <Scramble text={label} at={at} dur={0.35} />
      </div>
    </div>
  );
};
