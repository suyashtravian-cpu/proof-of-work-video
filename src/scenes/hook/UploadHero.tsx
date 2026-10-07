import { AbsoluteFill, Easing } from "remotion";
import { easeExpo, easeInOut, tween } from "../../components/anim";
import { Paper, PAPER_H, PAPER_W } from "../../components/Paper";
import { FloatingCode } from "../../fx/FloatingCode";
import { Particles } from "../../fx/Particles";
import { Scramble } from "../../fx/Scramble";
import { shakeAt } from "../../fx/shake";
import { theme } from "../../theme";
import { CYAN, Cursor, PdfIcon } from "./bits";
import { TITLES } from "./wall";

// 4.4–6.0: "Upload your résumé." One field fills the frame, the file drops,
// the bar fills, and the camera punches into the PDF, which becomes the page
// the Résumé scene opens on.

export const HERO_AT = 4.4;
const DROP = 4.62;
const P0 = 4.74;
const P1 = 5.3;
const EXIT = 5.5;
const EXIT_END = 5.9;

// screen-space layout
const CARD = { x: 46, y: 236, w: 988, h: 1300 };
const ZONE = { x: 96, y: 790, w: 888, h: 470 };
const ICON_W = 112;
const ICON = { cx: 540, cy: 900 }; // where the icon sits after the drop
const PAPER_CENTER = { x: 540, y: 920 }; // Résumé scene frame 0: centred, translateY(-40)

const W: { w: string; at: number }[] = [
  { w: "Upload", at: 4.42 },
  { w: "your", at: 4.78 },
  { w: "résumé", at: 5.0 },
];

export const UploadHero: React.FC<{ t: number }> = ({ t }) => {
  if (t < HERO_AT) return null;
  const arrive = tween(t, HERO_AT, HERO_AT + 0.3, 0, 1, easeExpo);
  const drift = tween(t, HERO_AT, EXIT, 0, 1, Easing.linear);
  const [sx, sy, sr] = shakeAt(t, [HERO_AT, DROP], 20, 0.3);
  const exitK = tween(t, EXIT, EXIT_END, 0, 1, Easing.in(Easing.cubic));
  const zoom = Math.exp(Math.log(9) * exitK);
  const scale = (1.45 - 0.45 * arrive) * (1 + drift * 0.045) * zoom;
  const rot = (1 - arrive) * 4 - drift * 1.2 + Math.sin(t * 2.4) * 0.7 + sr;
  const cardFade = tween(t, 5.66, 5.84, 1, 0);

  const drop = tween(t, DROP - 0.2, DROP, 0, 1, Easing.in(Easing.quad));
  const settle = tween(t, DROP, DROP + 0.25, 0, 1, Easing.out(Easing.back(2.2)));
  const prog = tween(t, P0, P1, 0, 1, easeInOut);
  const done = t >= P1 + 0.03;
  const dropped = t >= DROP;

  // icon position on screen (before the card transform) while falling
  const iconY = dropped ? ICON.cy - (1 - settle) * 26 : 420 + (ICON.cy - 420) * drop;
  const iconX = dropped ? ICON.cx : 760 - 220 * drop;
  const iconRot = dropped ? (1 - settle) * -6 : 14 - 14 * drop;
  const iconScale = dropped ? 1 + (1 - settle) * 0.12 : 1.25 - 0.25 * drop;

  const titleIdx = Math.floor(t * 15) % TITLES.length;
  const marching = (t * 120) % 48;

  // Paper grows out of the PDF icon as the camera punches in.
  const paperOn = t >= EXIT + 0.04;
  // keeps pushing past full size: the camera flies into the page as the cut lands
  const pk = tween(t, EXIT + 0.04, 5.97, 0, 1, Easing.inOut(Easing.quad));
  const pScale = (ICON_W / PAPER_W) * Math.exp(Math.log((PAPER_W / ICON_W) * 1.55) * pk);
  const pY = ICON.cy + (PAPER_CENTER.y - ICON.cy) * pk;
  const pOpacity = tween(t, EXIT + 0.04, EXIT + 0.16, 0, 1);

  const label = (
    <div style={{ position: "absolute", left: ZONE.x - CARD.x, top: 300 - 30, width: ZONE.w, fontFamily: theme.sans, fontWeight: 800, fontSize: 150, lineHeight: 0.93, letterSpacing: "-0.06em", color: theme.ink }}>
      {W.map((w, i) => {
        const k = tween(t, w.at, w.at + 0.2, 0, 1, easeExpo);
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              marginRight: i === 1 ? 0 : "0.2em",
              opacity: t < w.at ? 0.08 : Math.min(1, 0.08 + k * 2.4),
              transform: `translateY(${(1 - k) * 40}px) scale(${1.25 - 0.25 * k})`,
              transformOrigin: "50% 80%",
            }}
          >
            {w.w}
            {i === 1 && <br />}
          </span>
        );
      })}
      <span style={{ display: "inline-block", color: theme.red, transform: `scale(${1 + 0.25 * Math.max(0, Math.sin((t - 5.15) * 14)) * (t > 5.15 ? 1 : 0)})`, opacity: t < 5.15 ? 0.25 : 1 }}>*</span>
    </div>
  );

  return (
    <AbsoluteFill style={{ background: theme.bg }}>
      <FloatingCode count={20} opacity={0.16} seed="uh" speed={1.6} />
      <Particles count={36} opacity={0.4} seed="uhp" />
      <AbsoluteFill
        style={{
          transformOrigin: `${ICON.cx}px ${ICON.cy}px`,
          transform: `translate(${sx + Math.sin(t * 1.7) * 8}px, ${sy + Math.cos(t * 2.1) * 10 - drift * 30}px) scale(${scale}) rotate(${rot}deg)`,
          opacity: cardFade,
        }}
      >
        <div style={{ position: "absolute", left: CARD.x, top: CARD.y, width: CARD.w, height: CARD.h, background: "#f3f1ec", borderRadius: 40, boxShadow: "0 60px 120px rgba(0,0,0,.6)" }}>
          <div style={{ position: "absolute", left: 50, top: 46, right: 50, display: "flex", justifyContent: "space-between", fontFamily: theme.mono, fontSize: 24, letterSpacing: "0.14em", color: "#8a8983" }}>
            <span>JOB APPLICATION</span>
            <span>STEP 2 / 2</span>
          </div>
          <div style={{ position: "absolute", left: 50, top: 92, fontFamily: theme.sans, fontWeight: 800, fontSize: 60, letterSpacing: "-0.045em", color: theme.ink, whiteSpace: "nowrap" }}>
            {TITLES[titleIdx]}
            <span style={{ fontFamily: theme.mono, fontWeight: 500, fontSize: 22, letterSpacing: "0.1em", color: theme.red, marginLeft: 18, verticalAlign: "middle" }}>↻ ANY ROLE</span>
          </div>
          <div style={{ position: "absolute", left: 50, right: 50, top: 196, height: 3, background: "#1d1d1d" }} />
          {label}
        </div>
        {/* drop zone */}
        <svg width={ZONE.w} height={ZONE.h} style={{ position: "absolute", left: ZONE.x, top: ZONE.y, overflow: "visible" }}>
          <rect
            x={3}
            y={3}
            width={ZONE.w - 6}
            height={ZONE.h - 6}
            rx={30}
            fill={done ? "#ecebe6" : dropped ? "#e9e7e1" : "#fbfaf7"}
            stroke={dropped ? "#1d1d1d" : theme.red}
            strokeWidth={6}
            strokeDasharray={done ? undefined : "26 22"}
            strokeDashoffset={-marching}
          />
        </svg>
        {!dropped && (
          <div style={{ position: "absolute", left: ZONE.x, top: ZONE.y + ZONE.h - 150, width: ZONE.w, textAlign: "center", fontFamily: theme.sans, fontWeight: 600, fontSize: 40, color: "#8a8983" }}>
            ↓ Drop your PDF here
          </div>
        )}
        {dropped && (
          <div style={{ position: "absolute", left: ZONE.x, width: ZONE.w, top: ICON.cy + 92, textAlign: "center" }}>
            <div style={{ fontFamily: theme.sans, fontWeight: 700, fontSize: 50, letterSpacing: "-0.035em", color: theme.ink }}>resume_final_v7.pdf {done && <span style={{ color: theme.red }}>✓</span>}</div>
            <div style={{ margin: "26px auto 0", width: 680, height: 20, borderRadius: 10, background: "#d8d6cf", overflow: "hidden" }}>
              <div style={{ width: `${prog * 100}%`, height: "100%", background: done ? theme.red : "#141414" }} />
            </div>
            <div style={{ marginTop: 18, fontFamily: theme.mono, fontSize: 28, letterSpacing: "0.12em", color: done ? theme.red : "#55544f" }}>
              {done ? "UPLOADED · SAME AS LAST TIME" : `UPLOADING… ${String(Math.round(prog * 100)).padStart(3, " ")}%`}
            </div>
          </div>
        )}
        {/* the file */}
        <div style={{ position: "absolute", left: iconX, top: iconY, transform: `translate(-50%,-50%) rotate(${iconRot}deg) scale(${iconScale})`, opacity: paperOn ? 1 - pOpacity : 1 }}>
          <PdfIcon w={ICON_W} />
        </div>
        {!dropped && <Cursor x={iconX + 40} y={iconY + 50} size={78} rot={-6} />}
        {dropped && t < DROP + 0.5 && <Cursor x={iconX + 40 + (t - DROP) * 900} y={iconY + 50 + (t - DROP) * 600} size={78} rot={-6} />}
        <div style={{ position: "absolute", left: CARD.x + 50, top: CARD.y + CARD.h - 196, width: CARD.w - 100, height: 104, borderRadius: 52, background: "#1d1d1d", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: theme.sans, fontWeight: 700, fontSize: 42 }}>
          Submit application →
        </div>
        <div style={{ position: "absolute", left: CARD.x + 50, top: CARD.y + CARD.h - 70, fontFamily: theme.mono, fontSize: 22, color: "#8a8983", letterSpacing: "0.06em" }}>Required fields are marked *</div>
      </AbsoluteFill>

      {/* HUD readout under the card, outside the zoom */}
      {t < EXIT + 0.1 && (
        <div style={{ position: "absolute", left: 70, right: 70, top: 1586, display: "flex", justifyContent: "space-between", fontFamily: theme.mono, fontSize: 22, letterSpacing: "0.12em", color: CYAN, opacity: tween(t, HERO_AT + 0.1, HERO_AT + 0.3, 0, 1) * tween(t, EXIT - 0.05, EXIT + 0.1, 1, 0) }}>
          <Scramble text="POST /apply/resume" at={HERO_AT + 0.1} dur={0.3} />
          <span>
            {"▮".repeat(Math.round(prog * 12)).padEnd(12, "▯")} {done ? "200 OK" : `${Math.round(prog * 100)}%`}
          </span>
        </div>
      )}

      {paperOn && (
        <div
          style={{
            position: "absolute",
            left: PAPER_CENTER.x - PAPER_W / 2,
            top: pY - PAPER_H / 2,
            width: PAPER_W,
            height: PAPER_H,
            transform: `scale(${pScale}) rotate(${(1 - pk) * -8}deg)`,
            transformOrigin: "50% 30%",
            opacity: pOpacity,
          }}
        >
          <Paper />
        </div>
      )}
    </AbsoluteFill>
  );
};
