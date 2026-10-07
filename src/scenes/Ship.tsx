import { AbsoluteFill, Img, OffthreadVideo, useCurrentFrame } from "remotion";
import { easeExpo, easeInOut, tween } from "../components/anim";
import { BrowserFrame } from "../components/BrowserFrame";
import { Slam } from "../components/Slam";
import { clip, fullPage } from "../footage";
import { sec } from "../timing";
import { theme } from "../theme";

const END_AT = 2.9;

// 42.0–47.5  "I don't just talk about AI. I ship with it." + end card
export const Ship: React.FC = () => {
  const t = useCurrentFrame() / 30;
  const end = tween(t, END_AT, END_AT + 0.45, 0, 1, easeExpo);
  const scroll = tween(t, END_AT, 5.5, 0, 1, easeInOut);
  return (
    <AbsoluteFill style={{ background: theme.bg }}>
      {end < 1 && (
        <AbsoluteFill style={{ opacity: 1 - end }}>
          <div style={{ position: "absolute", inset: 0, filter: "brightness(.18) blur(8px)" }}>
            <BrowserFrame width={1000} y={120} rotateX={6} rotateY={-4} scale={1.1}>
              <OffthreadVideo src={clip("hero")} trimBefore={sec(6.8)} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </BrowserFrame>
          </div>
          <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", textAlign: "center", padding: "0 60px", gap: 40 }}>
            <Slam at={0} size={70} color="#cfcec8">
              I don’t just talk about AI.
            </Slam>
            <Slam at={1.7} size={170}>
              I ship with it.
            </Slam>
          </AbsoluteFill>
        </AbsoluteFill>
      )}
      {t >= END_AT && (
        <AbsoluteFill style={{ opacity: end }}>
          <div style={{ position: "absolute", top: 330, left: 0, right: 0, textAlign: "center", transform: `translateY(${(1 - end) * 40}px)` }}>
            <div style={{ fontFamily: theme.mono, fontSize: 26, letterSpacing: "0.22em", color: theme.dim }}>PROOF OF WORK</div>
            <div style={{ fontFamily: theme.sans, fontWeight: 800, fontSize: 116, letterSpacing: "-0.055em", color: theme.fg, marginTop: 18 }}>Suyash Kashyap</div>
            <div style={{ fontFamily: theme.sans, fontWeight: 500, fontSize: 40, color: "#cfcec8", marginTop: 10 }}>AI builder. Marketer. Perpetually curious.</div>
            <div style={{ display: "inline-block", marginTop: 46, fontFamily: theme.mono, fontSize: 34, color: theme.bg, background: theme.fg, padding: "20px 34px", borderRadius: 50 }}>
              pilotaccess.com/proofofwork ↗
            </div>
          </div>
          <div style={{ position: "absolute", top: 1030, left: "50%", width: 900, height: 820, transform: "translateX(-50%)", borderRadius: "18px 18px 0 0", overflow: "hidden", border: "1px solid #ffffff26", borderBottom: 0 }}>
            <Img src={fullPage} style={{ width: 900, transform: `translateY(${-scroll * 1700}px)` }} />
            <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(8,8,8,0) 50%, rgba(8,8,8,1) 100%)" }} />
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
