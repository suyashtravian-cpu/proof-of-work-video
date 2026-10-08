import { Easing } from "remotion";
import { theme2 } from "../../theme";
import { Sweep } from "./World";
import { OUT_EXPO, clamp01, footToScreen, springT, tw } from "./util";

const CX = 540;
const CY = 282;
const W = 800;
const H = 196;
const NAME = "Suyash Kashyap";
export const LOGO: [number, number] = [81, 46]; // "S." mark in the site's corner (rec px)

/** "I'm Suyash.": a paper name card drops out of the sky, tethered to the logo in the real site. */
export const NameCard: React.FC<{ T: number }> = ({ T }) => {
  if (T < 3.4 || T > 4.75) return null;
  const k = springT(T, 3.48, 12, 0.8, 120);
  const out = tw(T, 4.26, 4.62, 0, 1, Easing.in(Easing.cubic));
  const fl = clamp01((T - 3.9) / 0.4);
  const rx = (1 - k) * -75 + fl * 5 * Math.sin(T * 1.6) - out * 20;
  const ry = fl * 7 * Math.sin(T * 1.2 + 1) - out * 80;
  const s = 0.55 + 0.45 * k;
  const bob = Math.sin(T * 1.9) * 7;
  const [lx, ly] = footToScreen(T, LOGO[0], LOGO[1] + 14);
  const ax = CX - W / 2 + 104;
  const ay = CY + H / 2 - 8 + bob;
  const draw = tw(T, 3.62, 3.92, 0, 1, OUT_EXPO) * (1 - tw(T, 4.18, 4.32, 0, 1));
  return (
    <>
      {draw > 0.001 && (
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          <path
            d={`M${lx} ${ly} C ${lx} ${ly - 70}, ${ax} ${ay + 90}, ${ax} ${ay}`}
            fill="none"
            stroke={theme2.lilac}
            strokeWidth={3}
            strokeDasharray="1 1"
            pathLength={1}
            strokeDashoffset={1 - draw}
            style={{ filter: `drop-shadow(0 0 6px ${theme2.glow})` }}
          />
          <circle cx={lx} cy={ly} r={6 * draw} fill={theme2.lilacSoft} />
        </svg>
      )}
      <div
        style={{
          position: "absolute",
          left: CX - W / 2,
          top: CY - H / 2 + bob,
          width: W,
          height: H,
          transformOrigin: "50% 0%",
          transform: `perspective(1400px) translateX(${-560 * out}px) rotateX(${rx}deg) rotateY(${ry}deg) scale(${s})`,
          opacity: clamp01(k * 3) * (1 - out),
          borderRadius: 40,
          background: `linear-gradient(135deg, ${theme2.paper} 0%, #efeaff 70%, #e4dcff 100%)`,
          boxShadow: "0 40px 90px rgba(3,4,18,.6), 0 0 70px rgba(188,165,238,.35), inset 0 1px 0 rgba(255,255,255,.9)",
          display: "flex",
          alignItems: "center",
          gap: 30,
          padding: "0 44px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: 118,
            height: 118,
            flex: "none",
            borderRadius: 59,
            background: `conic-gradient(from ${T * 120}deg, #bca5ee, #e4dcff, #9fd3ff, #c9a7ff, #bca5ee)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: theme2.display,
            fontWeight: 800,
            fontSize: 62,
            color: theme2.ink,
            letterSpacing: "-0.04em",
            boxShadow: "inset 0 0 0 3px rgba(255,255,255,.6)",
          }}
        >
          S.
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ fontFamily: theme2.display, fontWeight: 800, fontSize: 70, lineHeight: 1, letterSpacing: "-0.035em", color: theme2.ink, whiteSpace: "pre" }}>
            {[...NAME].map((ch, i) => {
              const c = springT(T, 3.56 + i * 0.022, 10, 0.5, 210);
              return (
                <span key={i} style={{ display: "inline-block", transform: `translateY(${(1 - c) * 46}px) rotate(${(1 - c) * 14}deg)`, opacity: clamp01(c * 2.5) }}>
                  {ch}
                </span>
              );
            })}
          </div>
          <div style={{ fontFamily: theme2.sans, fontWeight: 500, fontSize: 29, color: "#5d5a80", letterSpacing: "-0.005em", opacity: tw(T, 3.78, 3.98, 0, 1), transform: `translateY(${tw(T, 3.78, 4.0, 14, 0, OUT_EXPO)}px)` }}>
            AI creator. Independent builder.
          </div>
        </div>
        <Sweep k={tw(T, 3.72, 4.25, 0, 1)} width={240} strength={0.75} angle={110} span={1200} />
      </div>
    </>
  );
};
