import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";

/** The site's own floating-island sky, slowly drifting, as a deep background plate. */
export const Sky: React.FC<{ opacity?: number; blur?: number; zoom?: number }> = ({ opacity = 0.5, blur = 0, zoom = 1 }) => {
  const t = useCurrentFrame() / 30;
  return (
    <AbsoluteFill style={{ overflow: "hidden", opacity }}>
      <Img
        src={staticFile("v2/world-sky-v2.png")}
        style={{
          position: "absolute",
          height: "100%",
          left: "50%",
          transform: `translateX(-50%) translateX(${Math.sin(t * 0.15) * 40}px) scale(${zoom * (1.05 + t * 0.004)})`,
          filter: blur ? `blur(${blur}px)` : undefined,
        }}
      />
    </AbsoluteFill>
  );
};
