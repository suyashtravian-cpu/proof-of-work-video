import { AbsoluteFill, random, useCurrentFrame } from "remotion";
import { theme } from "../theme";
import { SCENES } from "../timeline";
import { sec } from "../timing";

/** 5-frame glitch at every scene boundary: torn bars, chroma slivers, a flash. */
export const GlitchCut: React.FC = () => {
  const f = useCurrentFrame();
  const cut = SCENES.map((s) => sec(s.from)).find((c) => c > 0 && f >= c - 2 && f < c + 4);
  if (cut === undefined) return null;
  const k = 1 - Math.abs(f - cut) / 4;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {Array.from({ length: 9 }, (_, i) => {
        const y = random(`gy${f}${i}`) * 1920;
        const h = 6 + random(`gh${f}${i}`) * 70;
        const x = (random(`gx${f}${i}`) - 0.5) * 240;
        const c = [theme.fg, theme.red, "#33e1ff", "#000"][Math.floor(random(`gc${f}${i}`) * 4)];
        return <div key={i} style={{ position: "absolute", left: x, top: y, width: 1080, height: h, background: c, opacity: 0.55 * k, mixBlendMode: i % 2 ? "difference" : "normal" }} />;
      })}
      <AbsoluteFill style={{ background: "#fff", opacity: f === cut ? 0.35 : 0 }} />
    </AbsoluteFill>
  );
};
