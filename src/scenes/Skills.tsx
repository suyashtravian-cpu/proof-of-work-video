import { AbsoluteFill, Img, useCurrentFrame } from "remotion";
import { easeExpo, easeInOut, easeOut, tween } from "../components/anim";
import { Slam } from "../components/Slam";
import { fullPage } from "../footage";
import { theme } from "../theme";

export const SKILLS = ["AI-assisted building", "Product marketing", "Paid social", "Search ads", "SEO", "Content & copy", "Creative strategy"];
export const STRIKE_AT = (i: number) => 0.55 + i * 0.1;
const WALL_AT = 1.6;

// 28.1–31.4  "Not a list of skills. Proof of them."
export const Skills: React.FC = () => {
  const t = useCurrentFrame() / 30;
  const wall = tween(t, WALL_AT, WALL_AT + 0.35, 0, 1, easeExpo);
  const scroll = tween(t, WALL_AT, 3.3, 0, 1, easeInOut);
  return (
    <AbsoluteFill style={{ background: theme.bg }}>
      {wall < 1 && (
        <div style={{ position: "absolute", left: 110, top: 300, opacity: 1 - wall }}>
          <div style={{ fontFamily: theme.mono, fontSize: 24, letterSpacing: "0.2em", color: theme.dim, marginBottom: 30 }}>SKILLS</div>
          {SKILLS.map((s, i) => {
            const k = tween(t, i * 0.05, i * 0.05 + 0.25, 0, 1, easeOut);
            const strike = tween(t, STRIKE_AT(i), STRIKE_AT(i) + 0.14, 0, 1, easeOut);
            return (
              <div key={s} style={{ position: "relative", fontFamily: theme.sans, fontWeight: 700, fontSize: 76, letterSpacing: "-0.04em", lineHeight: 1.22, color: strike > 0 ? "#5b5a56" : theme.fg, opacity: k, transform: `translateX(${(1 - k) * -40}px)` }}>
                {s}
                <div style={{ position: "absolute", left: -10, top: "54%", height: 9, width: `calc(${strike * 100}% + 20px)`, background: theme.red, borderRadius: 5 }} />
              </div>
            );
          })}
        </div>
      )}
      {t >= WALL_AT && (
        <AbsoluteFill style={{ perspective: 1800, opacity: wall }}>
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 0,
              width: 1200,
              transformOrigin: "50% 0%",
              transform: `translateX(-50%) translateY(${380 - scroll * 5600}px) rotateX(48deg) rotateZ(-10deg) scale(${1.05})`,
              boxShadow: "0 0 160px rgba(255,255,255,.12)",
            }}
          >
            <Img src={fullPage} style={{ width: 1200, display: "block", filter: "brightness(.5)" }} />
          </div>
          <AbsoluteFill style={{ background: "radial-gradient(ellipse 70% 30% at 50% 50%, rgba(8,8,8,.75), rgba(8,8,8,0) 100%), linear-gradient(180deg, rgba(8,8,8,.92) 0%, rgba(8,8,8,0) 30%, rgba(8,8,8,0) 70%, rgba(8,8,8,.92) 100%)" }} />
          <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", textAlign: "center", textShadow: "0 10px 60px rgba(0,0,0,.9)" }}>
            <Slam at={WALL_AT + 0.1} size={250}>Proof</Slam>
            <Slam at={WALL_AT + 0.5} size={120} style={{ marginTop: 6 }}>of them.</Slam>
          </AbsoluteFill>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
