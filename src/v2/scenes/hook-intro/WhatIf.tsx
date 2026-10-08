import { Easing, OffthreadVideo, Sequence, interpolate, random } from "remotion";
import { sec } from "../../../timing";
import { REC, REC_H, REC_W } from "../../components/Rec";
import { theme2 } from "../../theme";
import { Brackets, IriRing, Pointer, Ripple, Sweep } from "./World";
import { INTRO_AT, IN_OUT, OUT, clamp01, lerp, springT, tw } from "./util";

// Chip -> page morph timing (global seconds).
export const CLICK1 = 5.95; // pointer clicks the "what if?" chip
export const MORPH = 6.0;
export const CLICK2 = 8.45; // pointer clicks "Step into my work" on the real page
export const WHIP = 8.78;

const CHIP_CX = 540;
const CHIP_CY = 1020;
const CHIP_W = 640;
const CHIP_H = 200;
const CARD_W = 940;
const CARD_H = 880;
const CARD_CY = 800;

// "Curiosity. Made tangible." footage: fades in at rec 14.86-15.0, static until 15.42.
const CUR_REC = 14.86;
const CUR_RATE = 0.17;
const FS = 1.4; // footage scale inside the card
const ANCHOR: [number, number] = [860, 615]; // rec px placed at the card centre
const loc = (fx: number, fy: number): [number, number] => [(fx - ANCHOR[0]) * FS, (fy - ANCHOR[1]) * FS];
const rect = (x0: number, y0: number, x1: number, y1: number, pad: number) => {
  const [a, b] = loc(x0, y0);
  const [c, d] = loc(x1, y1);
  return [a - pad, b - pad, c - a + 2 * pad, d - b + 2 * pad];
};
const R_CUR = rect(666, 485, 1052, 595, 18);
const R_MADE = rect(554, 606, 1166, 714, 18);
const R_BTN = rect(786, 747, 924, 787, 14);
const BTN = loc(855, 767);

const LABEL = "“what if?”";

const quad = (a: [number, number], c: [number, number], b: [number, number], k: number): [number, number] => [
  (1 - k) * (1 - k) * a[0] + 2 * (1 - k) * k * c[0] + k * k * b[0],
  (1 - k) * (1 - k) * a[1] + 2 * (1 - k) * k * c[1] + k * k * b[1],
];
const press = (T: number, at: number) => tw(T, at - 0.07, at, 0, 1, OUT) * (1 - tw(T, at + 0.03, at + 0.14, 0, 1));

/** "I take a what if... and turn it into something you can actually click." */
export const WhatIf: React.FC<{ T: number }> = ({ T }) => {
  if (T < 4.5) return null;
  const a = springT(T, 4.55, 10, 0.7, 140);
  const m = springT(T, MORPH, 15, 0.9, 105);
  const mc = Math.min(1, m);
  const whip = tw(T, WHIP, 9.2, 0, 1, Easing.in(Easing.cubic));

  // chip hover / press
  const hover = tw(T, 5.62, 5.8, 0, 1);
  const p1 = press(T, CLICK1);
  const bob = Math.sin(T * 2.1) * 10 * (1 - mc);
  const chipScale = interpolate(a, [0, 1], [0.2, 1]) * (1 + 0.045 * hover - 0.08 * p1);

  // morph geometry
  const w = lerp(CHIP_W, CARD_W, m);
  const h = lerp(CHIP_H, CARD_H, m);
  const cy = lerp(CHIP_CY, CARD_CY, m) + bob + Math.sin(T * 1.3) * 8 * mc;
  const r = lerp(100, 56, mc);
  const live = clamp01((T - MORPH - 0.3) / 0.6);
  const push = tw(T, 6.4, 8.7, 0, 1, IN_OUT);
  const ry = (1 - a) * 40 + (1 - mc) * 10 * Math.sin(T * 1.6) + live * 6 * Math.sin((T - MORPH) * 1.05);
  const rx = (1 - mc) * 8 * Math.cos(T * 1.4) + live * 3.5 * Math.sin((T - MORPH) * 0.85 + 1) - whip * 24;
  const s = chipScale * (1 + 0.07 * push) * (1 + 0.35 * whip);
  const ty = -1550 * whip;
  const transform = `translate(${CHIP_CX}px, ${cy + ty}px) perspective(2200px) rotateX(${rx}deg) rotateY(${ry}deg) scale(${s})`;

  const footOp = clamp01((m - 0.3) / 0.4);
  const chipOp = 1 - clamp01((m - 0.22) / 0.33);
  const labelOp = 1 - clamp01(m * 1.8);
  const fromF = sec(MORPH - INTRO_AT);
  const ring = clamp01(a * 1.2) * (1 - clamp01(m * 2.2));

  // pointer 1: glides to the chip and clicks it
  const e1 = tw(T, 5.0, 5.72, 0, 1, IN_OUT);
  const [p1x, p1y] = quad([1140, 1330], [930, 860], [676, 1048], e1);
  const p1op = tw(T, 5.0, 5.15, 0, 1) * (1 - tw(T, 6.05, 6.25, 0, 1));

  // pointer 2 (card-local): to the real "Step into my work" button
  const e2 = tw(T, 7.72, 8.32, 0, 1, IN_OUT);
  const [p2x, p2y] = quad([600, 560], [330, 420], [BTN[0] + 6, BTN[1] + 4], e2);
  const p2op = tw(T, 7.72, 7.85, 0, 1) * (1 - tw(T, 8.7, 8.85, 0, 1));
  const p2 = press(T, CLICK2);

  // tracking brackets: Curiosity. -> Made tangible. -> the button
  const b0 = springT(T, 6.72, 12, 0.6, 160);
  const j1 = springT(T, 7.25, 15, 0.7, 150);
  const j2 = springT(T, 7.9, 15, 0.7, 150);
  const bR = [0, 1, 2, 3].map((i) => lerp(lerp(R_CUR[i], R_MADE[i], j1), R_BTN[i], j2));
  const grow = (1 - Math.min(1, b0)) * 70;
  const bOp = clamp01(b0 * 3) * (1 - tw(T, 8.62, 8.8, 0, 1));
  const btnPulse = tw(T, CLICK2, CLICK2 + 0.45, 0, 1);

  const burst = tw(T, CLICK1, CLICK1 + 0.75, 0, 1, OUT);

  return (
    <>
      {/* the chrome ring orbits the chip (far arc) */}
      <IriRing cx={CHIP_CX} cy={CHIP_CY + bob} d={820 * (0.4 + 0.6 * Math.min(1, a))} thick={18} tilt={-9 + Math.sin(T) * 4} rx={75} spin={T * 170} opacity={ring} half="back" />

      {/* the chip that becomes the page */}
      <div style={{ position: "absolute", left: 0, top: 0, width: 0, height: 0, transform, filter: whip > 0.02 ? `blur(${whip * 22}px)` : undefined }}>
        <div
          style={{
            position: "absolute",
            left: -w / 2,
            top: -h / 2,
            width: w,
            height: h,
            borderRadius: r,
            padding: 2,
            background: `conic-gradient(from ${T * 90}deg, rgba(188,165,238,.9), rgba(248,247,243,.85), rgba(159,211,255,.7), rgba(201,167,255,.9), rgba(188,165,238,.9))`,
            boxShadow: `0 40px 100px rgba(3,4,18,.7), 0 0 ${70 + 40 * hover}px rgba(188,165,238,${0.45 + 0.25 * hover})`,
          }}
        >
          <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: r - 2, overflow: "hidden", background: "#0e0a26" }}>
            {footOp > 0.001 && (
              <div style={{ position: "absolute", inset: 0, opacity: footOp }}>
                <Sequence from={fromF} layout="none">
                  <OffthreadVideo
                    src={REC}
                    muted
                    trimBefore={sec(CUR_REC)}
                    playbackRate={CUR_RATE}
                    style={{ position: "absolute", left: (w - 4) / 2 - ANCHOR[0] * FS, top: (h - 4) / 2 - ANCHOR[1] * FS, width: REC_W * FS, height: REC_H * FS }}
                  />
                </Sequence>
                <Sweep k={tw(T, 6.45, 7.3, 0, 1)} width={340} strength={0.14} angle={106} span={1500} />
              </div>
            )}
            {chipOp > 0.001 && (
              <div style={{ position: "absolute", inset: 0, opacity: chipOp, background: `linear-gradient(135deg, ${theme2.paper} 0%, #ece6ff 55%, ${theme2.lilac} 130%)` }}>
                <Sweep k={tw(T, 4.9, 5.6, 0, 1)} width={160} strength={0.9} angle={110} span={900} />
              </div>
            )}
          </div>
        </div>
        {/* label: springy letters, then it flies up into the page's own "from what if" eyebrow */}
        {labelOp > 0.001 && (
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              transform: `translate(-50%, -50%) translateY(${lerp(0, -235, mc)}px) scale(${lerp(1, 0.2, mc)})`,
              opacity: labelOp,
              fontFamily: theme2.display,
              fontWeight: 800,
              fontSize: 128,
              lineHeight: 1,
              letterSpacing: "-0.04em",
              whiteSpace: "pre",
              color: theme2.ink,
            }}
          >
            {[...LABEL].map((ch, i) => {
              const c = springT(T, 4.64 + i * 0.04, 9, 0.5, 230);
              const wob = Math.sin(T * 5 + i) * 4 * (1 - mc) * clamp01((T - 5.1) * 2);
              return (
                <span
                  key={i}
                  style={{
                    display: "inline-block",
                    color: i === 0 || i === LABEL.length - 1 ? "#7c62c9" : undefined,
                    transform: `translateY(${(1 - c) * 90 + wob}px) scale(${0.3 + 0.7 * c}) rotate(${(1 - c) * -24}deg)`,
                    opacity: clamp01(c * 2.5),
                  }}
                >
                  {ch}
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* overlay in card space: URL tab, brackets, pointer, button press */}
      <div style={{ position: "absolute", left: 0, top: 0, width: 0, height: 0, transform, opacity: 1 - whip }}>
        {T > 6.3 && (
          <div
            style={{
              position: "absolute",
              left: -CARD_W / 2 + 34,
              top: -CARD_H / 2 - 64,
              opacity: tw(T, 6.3, 6.5, 0, 1),
              transform: `translateY(${tw(T, 6.3, 6.6, 26, 0, OUT)}px)`,
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "10px 20px",
              borderRadius: 999,
              background: "rgba(20,20,54,.85)",
              border: "1px solid rgba(228,220,255,.28)",
              fontFamily: theme2.mono,
              fontSize: 22,
              color: theme2.lilacSoft,
              whiteSpace: "nowrap",
            }}
          >
            <div style={{ width: 9, height: 9, borderRadius: 5, background: "#7be3b0", boxShadow: "0 0 10px #7be3b0" }} />
            pilotaccess.com/suyashpow
          </div>
        )}
        <Brackets x={bR[0] - grow} y={bR[1] - grow} w={bR[2] + grow * 2} h={bR[3] + grow * 2} opacity={bOp} arm={34} stroke={5} />
        {btnPulse > 0 && btnPulse < 1 && (
          <div
            style={{
              position: "absolute",
              left: R_BTN[0] + 14,
              top: R_BTN[1] + 14,
              width: R_BTN[2] - 28,
              height: R_BTN[3] - 28,
              borderRadius: 40,
              boxShadow: `0 0 ${30 + 50 * (1 - btnPulse)}px rgba(188,165,238,${0.9 * (1 - btnPulse)})`,
              background: `rgba(255,255,255,${0.35 * (1 - btnPulse)})`,
              transform: `scale(${1 - 0.06 * p2 + 0.1 * Math.sin(btnPulse * Math.PI) * (1 - btnPulse)})`,
            }}
          />
        )}
        <Ripple x={BTN[0]} y={BTN[1]} k={tw(T, CLICK2, CLICK2 + 0.55, 0, 1)} r={120} />
        <Pointer x={p2x} y={p2y} press={p2} opacity={p2op} />
      </div>

      {/* the ring's near arc passes in front of the chip */}
      <IriRing cx={CHIP_CX} cy={CHIP_CY + bob} d={820 * (0.4 + 0.6 * Math.min(1, a))} thick={18} tilt={-9 + Math.sin(T) * 4} rx={75} spin={T * 170} opacity={ring} half="front" />

      {/* click burst as the chip opens */}
      {burst > 0 && burst < 1 && (
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          {Array.from({ length: 28 }, (_, i) => {
            const ang = (i / 28) * Math.PI * 2 + random(`wb${i}`) * 0.3;
            const d = 60 + (260 + random(`wd${i}`) * 300) * burst;
            return (
              <circle
                key={i}
                cx={CHIP_CX + Math.cos(ang) * d * 1.25}
                cy={CHIP_CY + Math.sin(ang) * d * 0.8}
                r={(2 + random(`wr${i}`) * 4) * (1 - burst * 0.6)}
                fill={i % 3 ? theme2.lilacSoft : theme2.lilac}
                opacity={1 - burst}
              />
            );
          })}
        </svg>
      )}
      <Ripple x={676} y={1048} k={tw(T, CLICK1, CLICK1 + 0.55, 0, 1)} r={130} />
      <Pointer x={p1x} y={p1y} press={p1} opacity={p1op} />
    </>
  );
};

/** Speed lines for the whip into the next scene. */
export const WhipLines: React.FC<{ T: number }> = ({ T }) => {
  const k = tw(T, WHIP - 0.05, 9.2, 0, 1);
  if (k <= 0) return null;
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {Array.from({ length: 34 }, (_, i) => {
        const x = random(`wl-x${i}`) * 1080;
        const len = 200 + random(`wl-l${i}`) * 600;
        const y = 2100 - ((random(`wl-y${i}`) * 900 + k * 3200 * (0.6 + random(`wl-s${i}`) * 0.8)) % 2600);
        return <line key={i} x1={x} y1={y} x2={x} y2={y + len * k} stroke={i % 3 ? theme2.lilacSoft : theme2.lilac} strokeWidth={1 + random(`wl-w${i}`) * 3} strokeLinecap="round" opacity={0.55 * Math.sin(k * Math.PI) + 0.1} />;
      })}
    </svg>
  );
};

