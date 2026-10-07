import { AbsoluteFill, Img, random, staticFile, useCurrentFrame } from "remotion";

// Cheap animated film grain (a pre-baked noise tile jittered per frame) + vignette.
export const Grain: React.FC = () => {
  const f = useCurrentFrame();
  const x = Math.floor(random(`gx${f}`) * 256);
  const y = Math.floor(random(`gy${f}`) * 256);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <AbsoluteFill
        style={{
          backgroundImage: `url(${staticFile("fx/grain.png")})`,
          backgroundPosition: `${x}px ${y}px`,
          opacity: 0.07,
          mixBlendMode: "screen",
        }}
      />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, transparent 55%, rgba(0,0,0,.55) 100%)" }} />
      <Img src={staticFile("fx/grain.png")} style={{ display: "none" }} />
    </AbsoluteFill>
  );
};
