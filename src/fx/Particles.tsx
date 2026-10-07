import { random, useCurrentFrame } from "remotion";

/** Ambient drifting dust; deterministic. */
export const Particles: React.FC<{ count?: number; color?: string; opacity?: number; seed?: string }> = ({ count = 60, color = "#fff", opacity = 0.35, seed = "pt" }) => {
  const t = useCurrentFrame() / 30;
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {Array.from({ length: count }, (_, i) => {
        const z = 0.3 + random(`${seed}z${i}`) * 0.7;
        const x = (random(`${seed}x${i}`) * 1080 + Math.sin(t * 0.6 + i) * 20 * z) % 1080;
        const y = (((random(`${seed}y${i}`) * 1920 - t * 40 * z) % 1920) + 1920) % 1920;
        return <circle key={i} cx={x} cy={y} r={1 + z * 2.2} fill={color} opacity={opacity * z} />;
      })}
    </svg>
  );
};
