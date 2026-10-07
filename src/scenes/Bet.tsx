import { AbsoluteFill, OffthreadVideo, useCurrentFrame } from "remotion";
import { easeExpo, easeInOut, tween, useSpringAt } from "../components/anim";
import { PhoneFrame } from "../components/PhoneFrame";
import { clip } from "../footage";
import { sec } from "../timing";
import { theme } from "../theme";

const PDF_AT = 2.8;
const SHRINK_AT = 3.55;

// 31.4–36.5  "If I'm asking you to bet on what I can do... you should get more than a PDF."
export const Bet: React.FC = () => {
  const t = useCurrentFrame() / 30;
  const enter = useSpringAt(0, 18, 0.8);
  const pdf = useSpringAt(PDF_AT, 14, 0.6);
  const shrink = tween(t, SHRINK_AT, SHRINK_AT + 0.6, 0, 1, easeInOut);
  const grow = tween(t, SHRINK_AT, SHRINK_AT + 0.8, 0, 1, easeExpo);
  return (
    <AbsoluteFill style={{ background: theme.bg }}>
      <PhoneFrame
        width={470}
        y={-90 + (1 - enter) * 1200}
        rotateY={14 - t * 4 - grow * 6}
        rotateX={4}
        x={grow * 90}
        scale={1 + grow * 0.06}
      >
        <OffthreadVideo src={clip("mobile")} trimBefore={sec(9.6)} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </PhoneFrame>
      {t >= PDF_AT && (
        <div
          style={{
            position: "absolute",
            left: 70 + shrink * 70,
            top: 860 + shrink * 330,
            transform: `scale(${pdf * (1 - shrink * 0.72)}) rotate(${-8 + shrink * 30}deg)`,
            transformOrigin: "50% 50%",
            opacity: 1 - tween(t, SHRINK_AT + 0.6, SHRINK_AT + 1.0, 0, 1),
          }}
        >
          <div style={{ width: 230, height: 300, background: theme.paper, borderRadius: 12, padding: 26, boxSizing: "border-box", boxShadow: "0 30px 70px rgba(0,0,0,.7)" }}>
            {[70, 90, 60, 84, 50, 76].map((w, i) => (
              <div key={i} style={{ height: 11, width: `${w}%`, borderRadius: 4, background: i === 0 ? "#2b2b2b" : "#cfcdc6", marginBottom: 16 }} />
            ))}
            <div style={{ position: "absolute", right: -14, bottom: 24, background: theme.red, color: "#fff", fontFamily: theme.mono, fontSize: 30, padding: "8px 16px", borderRadius: 6 }}>PDF</div>
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};
