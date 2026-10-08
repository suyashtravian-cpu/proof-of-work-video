import { AbsoluteFill } from "remotion";
import { CloudBank, GlassCards, SkyPlate } from "./World";
import { OUT, clamp01, tw } from "./util";

/** The wide sky the site window floats in (revealed by the pull-back). */
export const OuterWorld: React.FC<{ T: number; lift?: number }> = ({ T, lift = 0 }) => (
  <AbsoluteFill style={{ transform: `translateY(${-lift}px)` }}>
    <SkyPlate T={T} zoom={1.04 + 0.025 * Math.sin(T * 0.4)} y={40} />
    <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(9,13,37,.72) 0%, rgba(9,13,37,.25) 45%, rgba(9,13,37,0) 62%)" }} />
    <AbsoluteFill style={{ background: "radial-gradient(ellipse 70% 30% at 50% 40%, rgba(188,165,238,.18), rgba(188,165,238,0) 70%)" }} />
    <AbsoluteFill style={{ background: "radial-gradient(ellipse 80% 62% at 50% 46%, rgba(9,13,37,0) 55%, rgba(9,13,37,.5) 100%)" }} />
    <GlassCards T={T} opacity={0.75 * tw(T, 1.6, 2.4, 0, 1)} />
  </AbsoluteFill>
);

/** Cloud layers: rushing past the lens during the pull-back, then a bank the window floats over. */
export const Clouds: React.FC<{ T: number; lift?: number }> = ({ T, lift = 0 }) => {
  const bankScale = tw(T, 1.4, 2.3, 3.8, 1, OUT) + 0.02 * Math.sin(T * 0.6);
  const bankOp = tw(T, 1.4, 1.62, 0, 0.82);
  const wisp = clamp01((T - 1.42) / 0.25) * (1 - clamp01((T - 1.72) / 0.4));
  return (
    <AbsoluteFill style={{ pointerEvents: "none", transform: `translateY(${-lift}px)` }}>
      <CloudBank scale={bankScale} opacity={bankOp} x={Math.sin(T * 0.25) * 40} y={40} />
      <CloudBank scale={tw(T, 1.42, 2.15, 5.5, 1.7, OUT)} opacity={wisp * 0.55} flip x={-160} y={-60} />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(9,13,37,0) 66%, rgba(9,13,37,.42) 100%)", opacity: bankOp }} />
    </AbsoluteFill>
  );
};
