import { AbsoluteFill, Easing, useCurrentFrame } from "remotion";
import { Scramble } from "../../fx/Scramble";
import { shakeAt } from "../../fx/shake";
import { AiCursor, type CursorKey } from "../kit/AiCursor";
import { Burst, Shockwave } from "../kit/fx";
import { tokenize } from "../kit/TokenCaptions";
import { ORB_DOCK, VoiceOrb, voiceLevel } from "../kit/VoiceOrb";
import { C, clamp01, easeExpo, kick, lerp, pop, prog } from "../kit/util";
import { at, L, S } from "../timing";

// 28.95–33.2  "See what I can build for you. | Tap the link."
// v1's "✓ shipped" hit opens the card; the pill flies up into a badge, the name decodes, the
// voice orb rises from its dock and opens into the "See what I can build ↗" button (its words
// stream in on the voice), the URL types, and on "Tap" the AI cursor taps the button: it pulses
// from then on, "Tap the link ↓" lands on the word.

const T0 = S.end[0];
const HIT = 0.02;
const RISE: [number, number] = [0.1, 0.32];
const MORPH: [number, number] = [0.32, 0.46];
const URL_AT: [number, number] = [0.95, 1.38];
const TAP = at("end", L.tap, "tap");

export const BUTTON = { x: 540, y: 862, w: 820, h: 128 };
const SHIP = { x: 540, y: 770 };
const BADGE_Y = 482;
const URL = "pilotaccess.com/suyashpow";
const BTN_WORDS = ["See", "what", "I", "can", "build"];

const ArrowUR: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: "inline-block", overflow: "visible" }}>
    <path d="M6 18 L18 6 M9 6 H18 V15" fill="none" stroke={color} strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const ArrowDown: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg width={size * 0.8} height={size} viewBox="0 0 20 26" style={{ display: "inline-block", overflow: "visible" }}>
    <path d="M10 2 V23 M2 15 L10 23 L18 15" fill="none" stroke={color} strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** "✓ shipped": slams on the cut, then flies up and shrinks into the badge above the name. */
const Shipped: React.FC<{ t: number }> = ({ t }) => {
  const k = prog(t, HIT, HIT + 0.24, easeExpo);
  const up = prog(t, 0.24, 0.44, Easing.inOut(Easing.cubic));
  const wob = kick(t, HIT, 0.06, 34, 9);
  const s = lerp(1.6 - 0.6 * k, 0.4, up) * (1 + wob);
  return (
    <div
      style={{
        position: "absolute",
        left: SHIP.x,
        top: lerp(SHIP.y, BADGE_Y, up),
        transform: `translate(-50%, -50%) scale(${s})`,
        opacity: clamp01(k * 3),
        display: "flex",
        alignItems: "center",
        gap: 22,
        padding: "10px 34px 14px",
        borderRadius: 14,
        background: C.red,
        color: "#fff",
        fontFamily: C.sans,
        fontWeight: 800,
        fontSize: 96,
        letterSpacing: "-0.035em",
        whiteSpace: "nowrap",
        boxShadow: `0 0 ${90 * (1 - up) + 20}px rgba(255,59,47,${0.35 + 0.35 * (1 - k)})`,
      }}
    >
      ✓ shipped
    </div>
  );
};

const Button: React.FC<{ t: number }> = ({ t }) => {
  const m = prog(t, MORPH[0], MORPH[1], easeExpo);
  const press = t >= TAP ? Math.max(0, Math.sin(Math.min(1, (t - TAP) / 0.16) * Math.PI)) : 0;
  const since = t - TAP;
  const pulse = since > 0.2 ? 0.03 * Math.sin((since - 0.2) * Math.PI * 2 * 1.1) : 0;
  const v = voiceLevel(T0 + t);
  const w = lerp(ORB_DOCK.size * 1.4, BUTTON.w, m);
  const h = lerp(ORB_DOCK.size * 1.4, BUTTON.h, m);
  const sweep = ((t - 1.0) % 1.4) / 0.5;
  const toks = BTN_WORDS.map((wd) => {
    const s0 = Math.max(at("end", L.see, wd), MORPH[1] - 0.02);
    return tokenize(wd).map((p, k, arr) => ({ p, at: s0 + (k / arr.length) * 0.08 }));
  });
  const arrowAt = at("end", L.see, "build") + 0.16;
  const arrowK = pop(t, arrowAt, 0.22);
  const orbX = lerp(BUTTON.x, BUTTON.x - BUTTON.w / 2 + 72, m);
  return (
    <>
      {/* glow behind the button, breathing with the voice */}
      <div
        style={{
          position: "absolute",
          left: BUTTON.x - 520,
          top: BUTTON.y - 300,
          width: 1040,
          height: 600,
          background: `radial-gradient(ellipse at center, rgba(255,59,47,${(0.1 + 0.18 * v + 0.12 * press) * m}) 0%, rgba(255,59,47,0) 62%)`,
        }}
      />
      {/* pulse rings after the tap */}
      {since > 0 &&
        [0, 0.45].map((off) => {
          const p = ((((since + off) % 0.9) + 0.9) % 0.9) / 0.9;
          return (
            <div
              key={off}
              style={{
                position: "absolute",
                left: BUTTON.x - BUTTON.w / 2 - p * 40,
                top: BUTTON.y - BUTTON.h / 2 - p * 40,
                width: BUTTON.w + p * 80,
                height: BUTTON.h + p * 80,
                borderRadius: 100,
                border: `2.5px solid ${off ? C.red : C.white}`,
                opacity: (1 - p) * 0.75,
              }}
            />
          );
        })}
      {m > 0 && (
        <div
          style={{
            position: "absolute",
            left: BUTTON.x,
            top: BUTTON.y,
            width: w,
            height: h,
            transform: `translate(-50%, -50%) scale(${(1 + pulse) * (1 - 0.06 * press)})`,
            borderRadius: 100,
            background: C.white,
            opacity: clamp01(m * 2.5),
            overflow: "hidden",
            boxShadow: `0 0 ${50 + 60 * press}px rgba(255,255,255,${0.22 + 0.3 * press}), 0 30px 80px rgba(0,0,0,.6)`,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 140,
              right: 40,
              top: 0,
              bottom: 0,
              display: "flex",
              alignItems: "center",
              gap: 18,
              fontFamily: C.sans,
              fontWeight: 800,
              fontSize: 54,
              letterSpacing: "-0.035em",
              color: C.bg,
              whiteSpace: "nowrap",
            }}
          >
            <span>
              {toks.map((parts, i) => (
                <span key={i}>
                  {parts.map(({ p, at: a }, k) => (
                    <span key={k} style={{ opacity: t >= a ? clamp01((t - a) / 0.06) : 0 }}>
                      {p}
                    </span>
                  ))}
                  {i < toks.length - 1 ? " " : ""}
                </span>
              ))}
            </span>
            <span style={{ display: "inline-block", opacity: arrowK > 0 ? 1 : 0, transform: `scale(${arrowK}) translate(${Math.max(0, Math.sin(t * 7)) * 4}px, ${-Math.max(0, Math.sin(t * 7)) * 4}px)` }}>
              <ArrowUR size={46} color={C.red} />
            </span>
          </div>
          {/* shine */}
          {t > 1.0 && (
            <div style={{ position: "absolute", top: -20, bottom: -20, width: 120, left: -160 + sweep * 1100, transform: "skewX(-20deg)", background: "linear-gradient(90deg, rgba(255,255,255,0), rgba(255,59,47,.18), rgba(255,255,255,0))" }} />
          )}
        </div>
      )}
      {/* the orb itself: rises from the dock, then settles into the button's left slot */}
      <VoiceOrb
        x={orbX}
        y={lerp(ORB_DOCK.y, BUTTON.y, prog(t, RISE[0], RISE[1], Easing.bezier(0.5, 0, 0.1, 1)))}
        size={ORB_DOCK.size}
        sceneStart={T0}
        scale={1 + 0.5 * Math.sin(Math.PI * prog(t, RISE[0], MORPH[1])) + 0.25 * press}
        plain={m * 0.7}
      />
    </>
  );
};

const CURSOR: CursorKey[] = [
  { t: 1.12, x: 1130, y: 1380 },
  { t: TAP - 0.04, x: BUTTON.x + 180, y: BUTTON.y + 18, arc: 120 },
  { t: TAP, x: BUTTON.x + 180, y: BUTTON.y + 18, click: true },
  { t: TAP + 0.9, x: BUTTON.x + 250, y: BUTTON.y + 120 },
];

export const End: React.FC = () => {
  const t = useCurrentFrame() / 30;
  const [sx, sy, sr] = shakeAt(t, [HIT, TAP], 26, 0.35);
  const flash = Math.max(0, 1 - Math.abs(t - HIT) / 0.16) * 0.8;
  const nameK = pop(t, 0.3, 0.3);
  const url = URL.slice(0, Math.round(prog(t, URL_AT[0], URL_AT[1]) * URL.length));
  const tapK = pop(t, TAP, 0.26);
  const bob = t > TAP ? Math.sin((t - TAP) * 6.5) * 10 : 0;
  const drift = prog(t, 0, 4.25);
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Shockwave t={t} at={HIT} cx={SHIP.x} cy={SHIP.y} />
      <Burst t={t} at={HIT} cx={SHIP.x} cy={SHIP.y} seed="endb" />
      <AbsoluteFill style={{ transform: `translate(${sx}px, ${sy + 6 * Math.sin(t * 1.4)}px) rotate(${sr}deg) scale(${1.02 - 0.02 * drift})`, transformOrigin: "540px 800px" }}>
        <Shipped t={t} />
        {/* name */}
        <div style={{ position: "absolute", top: 542, left: 0, right: 0, textAlign: "center", opacity: clamp01(nameK * 2), transform: `scale(${1.12 - 0.12 * nameK})` }}>
          <div style={{ fontFamily: C.sans, fontWeight: 800, fontSize: 112, lineHeight: 1, letterSpacing: "-0.055em", color: C.white, textShadow: "0 10px 50px rgba(0,0,0,.8)" }}>
            <Scramble text="Suyash Kashyap" at={0.3} dur={0.45} />
          </div>
        </div>
        <Button t={t} />
        {/* url */}
        <div style={{ position: "absolute", top: 962, left: 0, right: 0, textAlign: "center", fontFamily: C.mono, fontSize: 36, letterSpacing: "0.01em", color: C.fg, whiteSpace: "pre" }}>
          {url}
          {t >= URL_AT[0] && <span style={{ display: "inline-block", width: 18, height: 36, marginLeft: 4, verticalAlign: "-5px", background: C.red, opacity: t < URL_AT[1] + 0.05 || Math.floor(t * 3) % 2 ? 1 : 0 }} />}
        </div>
        {/* "Tap the link ↓" lands on "Tap" */}
        {t >= TAP && (
          <div
            style={{
              position: "absolute",
              top: 1080,
              left: 0,
              right: 0,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 22,
              opacity: clamp01(tapK * 3),
              transform: `scale(${1.7 - 0.7 * tapK})`,
              fontFamily: C.sans,
              fontWeight: 800,
              fontSize: 76,
              letterSpacing: "-0.045em",
              color: C.white,
              textShadow: "0 10px 40px rgba(0,0,0,.85)",
            }}
          >
            Tap the link
            <span style={{ display: "inline-block", transform: `translateY(${bob}px)` }}>
              <ArrowDown size={70} color={C.red} />
            </span>
          </div>
        )}
      </AbsoluteFill>
      <AiCursor path={CURSOR} until={TAP + 1.1} />
      <AbsoluteFill style={{ background: "#fff", opacity: flash, pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};
