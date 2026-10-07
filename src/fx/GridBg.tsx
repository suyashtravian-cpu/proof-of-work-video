import { useCurrentFrame } from "remotion";

/** Perspective grid floor sliding toward camera: instant "tech" depth behind anything. */
export const GridBg: React.FC<{ opacity?: number; speed?: number; horizon?: number }> = ({ opacity = 0.18, speed = 1, horizon = 1100 }) => {
  const t = useCurrentFrame() / 30;
  const off = (t * 80 * speed) % 80;
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", perspective: 600, pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          left: -1500,
          right: -1500,
          top: horizon,
          height: 3000,
          transformOrigin: "50% 0%",
          transform: "rotateX(72deg)",
          backgroundImage: "linear-gradient(#ffffff 1.5px, transparent 1.5px), linear-gradient(90deg, #ffffff 1.5px, transparent 1.5px)",
          backgroundSize: "80px 80px",
          backgroundPosition: `0 ${off}px`,
          opacity,
          maskImage: "linear-gradient(180deg, transparent 0%, #000 40%)",
          WebkitMaskImage: "linear-gradient(180deg, transparent 0%, #000 40%)",
        }}
      />
    </div>
  );
};
