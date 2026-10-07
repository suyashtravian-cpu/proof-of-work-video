import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { BigText } from "../components/BigText";
import { usePop, useUnit } from "../components/motion";
import { theme } from "../theme";
import { media } from "../media";

// "So instead of making another résumé… I built this."
export const Built: React.FC = () => {
  const frame = useCurrentFrame();
  const u = useUnit();
  const reveal = usePop(30, 16);
  const tilt = interpolate(reveal, [0, 1], [28, 8]);
  const scroll = interpolate(frame, [40, 90], [0, -18], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const textOut = interpolate(frame, [24, 32], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", perspective: 1600 }}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: textOut }}>
        <BigText size={8}>So instead of another résumé…</BigText>
      </AbsoluteFill>
      <div
        style={{
          width: "84%",
          height: "62%",
          borderRadius: 2 * u,
          overflow: "hidden",
          background: "#16161d",
          boxShadow: `0 ${4 * u}px ${12 * u}px rgba(0,0,0,.6), 0 0 ${10 * u}px ${theme.accent}33`,
          opacity: reveal,
          transform: `rotateX(${tilt}deg) scale(${0.7 + reveal * 0.3})`,
        }}
      >
        <div style={{ height: 4 * u, background: "#22222b", display: "flex", alignItems: "center", gap: u, paddingLeft: 2 * u }}>
          {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
            <div key={c} style={{ width: 1.6 * u, height: 1.6 * u, borderRadius: "50%", background: c }} />
          ))}
        </div>
        {media.siteFullPage ? (
          <Img src={staticFile(media.siteFullPage)} style={{ width: "100%", transform: `translateY(${scroll}%)` }} />
        ) : (
          <AbsoluteFill style={{ top: 4 * u, justifyContent: "center", alignItems: "center", color: theme.muted, fontSize: 4 * u }}>
            [ your site goes here ]
          </AbsoluteFill>
        )}
      </div>
      <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 8 * u }}>
        <BigText delay={34} size={9} color={theme.accent}>I built this.</BigText>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
