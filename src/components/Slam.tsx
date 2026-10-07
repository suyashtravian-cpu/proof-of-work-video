import { useCurrentFrame } from "remotion";
import { theme } from "../theme";
import { easeExpo, tween } from "./anim";

// Big type that slams in at `at` seconds (relative to its Sequence).
export const Slam: React.FC<{
  at: number;
  children: React.ReactNode;
  size?: number;
  outline?: boolean;
  color?: string;
  style?: React.CSSProperties;
}> = ({ at, children, size = 120, outline = false, color = theme.fg, style }) => {
  const t = useCurrentFrame() / 30;
  if (t < at) return null;
  const k = tween(t, at, at + 0.28, 0, 1, easeExpo);
  return (
    <div
      style={{
        fontFamily: theme.sans,
        fontWeight: 800,
        fontSize: size,
        lineHeight: 0.98,
        letterSpacing: "-0.055em",
        color: outline ? "transparent" : color,
        WebkitTextStroke: outline ? `2.5px ${color}` : undefined,
        transform: `scale(${1.35 - 0.35 * k})`,
        filter: `blur(${(1 - k) * 14}px)`,
        opacity: Math.min(1, k * 1.6),
        ...style,
      }}
    >
      {children}
    </div>
  );
};
