import { OffthreadVideo, Sequence } from "remotion";
import { sec } from "../../../timing";
import { REC, REC_H, REC_W } from "../../components/Rec";
import { theme2 } from "../../theme";
import { CHROME, HERO_RATE, HERO_REC_AT, HERO_SHOW, PULL, WIN_H, WIN_LEFT, WIN_TOP, WIN_W, lerp, pullP, tw, winPose } from "./util";
import { SkyPlate, Streaks, Sweep } from "./World";

/**
 * The site window. Before 1.45 s it IS the full-bleed sky (the "inside" of the site);
 * the pull-back collapses it into a floating browser window that plays the real hero.
 * `offset` is the global second the hosting Sequence starts at.
 */
export const HeroWindow: React.FC<{ T: number; offset: number; overlay?: React.ReactNode }> = ({ T, offset, overlay }) => {
  const pose = winPose(T);
  if (pose.op <= 0.002) return null;
  const p = pullP(T);
  const x = lerp(0, WIN_LEFT, p);
  const y = lerp(0, WIN_TOP, p);
  const w = lerp(1080, WIN_W, p);
  const h = lerp(1920, WIN_H, p);
  const chrome = CHROME * tw(T, 1.72, 2.05, 0, 1, PULL);
  const innerOp = 1 - tw(T, 1.8, 2.08, 0, 1);
  const footOp = tw(T, 1.78, 2.06, 0, 1);
  const sW = lerp(1, 0.5, p);
  const ch = h - chrome;
  const fromF = Math.max(0, sec(HERO_SHOW - offset));
  const trim = sec(HERO_REC_AT + Math.max(0, offset - HERO_SHOW) * HERO_RATE);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        height: h,
        opacity: pose.op,
        transform: `translate(${pose.cx - 540}px, ${pose.cy - 760}px) perspective(2400px) rotateX(${pose.rx}deg) rotateY(${pose.ry}deg) scale(${pose.s})`,
        borderRadius: lerp(0, 24, p),
        overflow: "hidden",
        background: theme2.bg,
        border: p > 0.01 ? `1.5px solid rgba(228,220,255,${0.3 * p})` : undefined,
        boxShadow: p > 0.01 ? `0 50px 120px rgba(3,4,18,${0.75 * p}), 0 0 ${100 * p}px rgba(188,165,238,${0.4 * p})` : undefined,
      }}
    >
      {/* inside the site: the deep sky we start in */}
      {innerOp > 0.002 && (
        <div style={{ position: "absolute", left: -x, top: -y, width: 1080, height: 1920, transformOrigin: "540px 760px", transform: `scale(${sW})`, opacity: innerOp }}>
          <SkyPlate T={T} zoom={1.32 + T * 0.03} y={-170} />
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 80% 55% at 50% 47%, rgba(188,165,238,.16), rgba(9,13,37,0) 70%)" }} />
          <Streaks T={T} opacity={1 - tw(T, 1.35, 1.7, 0, 1)} cx={540} cy={905} />
          <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
            <Sweep k={tw(T, 0.15, 1.25, 0, 1)} width={520} strength={0.16} angle={112} span={2200} />
          </div>
        </div>
      )}
      {/* chrome bar with the real URL */}
      <div style={{ position: "absolute", left: 0, top: 0, width: "100%", height: chrome, overflow: "hidden", background: "rgba(20,20,54,.94)", borderBottom: "1px solid rgba(228,220,255,.12)" }}>
        <div style={{ height: CHROME, display: "flex", alignItems: "center", gap: 8, padding: "0 16px", opacity: chrome / CHROME }}>
          {["#ff6b8a", "#ffc46b", "#7be3b0"].map((c) => (
            <div key={c} style={{ width: 11, height: 11, borderRadius: 6, background: c, opacity: 0.9 }} />
          ))}
          <div
            style={{
              marginLeft: 14,
              flex: 1,
              height: 24,
              borderRadius: 12,
              background: "rgba(9,13,37,.9)",
              color: theme2.lilacSoft,
              fontFamily: theme2.mono,
              fontSize: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              letterSpacing: "0.02em",
            }}
          >
            pilotaccess.com/suyashpow
          </div>
        </div>
      </div>
      {/* the real hero footage */}
      {footOp > 0.002 && (
        <div style={{ position: "absolute", left: 0, top: chrome, width: w, height: ch, overflow: "hidden", opacity: footOp }}>
          <div style={{ position: "absolute", inset: 0, transformOrigin: "22% 46%", transform: `scale(${pose.zoom})` }}>
            <Sequence from={fromF} layout="none">
              <OffthreadVideo src={REC} muted trimBefore={trim} playbackRate={HERO_RATE} style={{ position: "absolute", width: "100%", height: "100%", objectFit: "cover" }} />
            </Sequence>
            {overlay && (
              <div style={{ position: "absolute", left: 0, top: 0, width: REC_W, height: REC_H, transformOrigin: "0 0", transform: `scale(${w / REC_W})` }}>{overlay}</div>
            )}
          </div>
          <Sweep k={tw(T, 2.02, 2.75, 0, 1)} width={300} strength={0.22} angle={108} span={1300} />
        </div>
      )}
    </div>
  );
};
