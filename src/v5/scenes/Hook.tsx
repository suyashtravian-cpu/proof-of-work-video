import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { theme2 } from "../../v2/theme";
import { HeroWindow } from "../../v2/scenes/hook-intro/HeroWindow";
import { LOGO } from "../../v2/scenes/hook-intro/NameCard";
import { Clouds, OuterWorld } from "../../v2/scenes/hook-intro/Stage";
import { Bokeh, Brackets, Dust, IriRing } from "../../v2/scenes/hook-intro/World";
import { C, OUT_EXPO, PULL, clamp01, footToScreen, lerp, pullP, springT, tw, winRect } from "../../v2/scenes/hook-intro/util";
import { L, word } from "../timing";

/**
 * 0 - 4.8 s. Video 2's Hook, re-texted: "Most brands hire / 4 people / for this?" fly through the
 * site's sky at the lens and refuse to settle, the chrome ring orbits the "4". The camera pulls back
 * through the clouds and the sky collapses into the floating site window (the real hero). Then
 * "1 person" and "+ AI" snap in under it, tracked from the site's own name mark.
 *
 * Video 2's hook-intro helpers run on their own clock (pull-back 1.45 - 2.05 s). `v2T` maps ad
 * seconds onto it, so the flight lasts as long as "Most brands hire four people for this."
 */
const PULL_A = 2.15; // ad second the pull-back starts (right after "this.")
const PULL_B = 2.75; // ...and the sky has landed inside the window
const v2T = (t: number) => interpolate(t, [0, PULL_A, PULL_B, 4.8], [0, 1.45, 2.05, 3.2], { extrapolateRight: "clamp" });

const PERSP = 1200;
const VP: [number, number] = [540, 860];

type FlyWord = {
  text: string;
  at: number;
  size: number;
  color: string;
  rest: [number, number];
  from: { x: number; y: number; rx: number; ry: number; rz: number };
  ph: number;
};

// "Most brands hire four people for this." Each word arrives as it is spoken.
const W_HIRE = 560;
const W_PEOPLE = 800;
const W_THIS = 1040;
const WORDS: FlyWord[] = [
  { text: "Most", at: word(L.hire, "most") - 0.12, size: 120, color: theme2.paper, rest: [231, W_HIRE], from: { x: -260, y: -200, rx: 24, ry: 55, rz: -10 }, ph: 0 },
  { text: "brands", at: word(L.hire, "brands") - 0.1, size: 120, color: theme2.paper, rest: [567, W_HIRE], from: { x: 120, y: -320, rx: 30, ry: -20, rz: 6 }, ph: 1.2 },
  { text: "hire", at: word(L.hire, "hire") - 0.1, size: 120, color: theme2.paper, rest: [875, W_HIRE], from: { x: 420, y: -120, rx: 0, ry: -60, rz: 12 }, ph: 2.4 },
  { text: "4", at: word(L.hire, "four") - 0.1, size: 330, color: theme2.lilac, rest: [184, W_PEOPLE], from: { x: -520, y: 60, rx: 0, ry: 75, rz: -12 }, ph: 3.1 },
  { text: "people", at: word(L.hire, "people") - 0.1, size: 230, color: theme2.paper, rest: [659, W_PEOPLE], from: { x: 560, y: 80, rx: 0, ry: -75, rz: 12 }, ph: 4.0 },
  { text: "for", at: word(L.hire, "for") - 0.08, size: 230, color: theme2.paper, rest: [289, W_THIS], from: { x: -460, y: 320, rx: -35, ry: 45, rz: -14 }, ph: 4.9 },
  { text: "this?", at: word(L.hire, "this") - 0.08, size: 230, color: theme2.paper, rest: [705, W_THIS], from: { x: 420, y: 420, rx: -30, ry: -45, rz: 16 }, ph: 5.6 },
];
const THIS_AT = word(L.hire, "this") + 0.2;

/** Scale + clip that carries the words into the window as the sky collapses into it. */
const CARRY_C: [number, number] = [540, 790];

const wordTransform = (w: FlyWord, t: number) => {
  const T = v2T(t);
  const k = springT(t, w.at, 11, 0.85, 105);
  const q = pullP(T);
  const live = clamp01((t - w.at - 0.45) / 0.5) * (1 - q);
  const dolly = 100 * tw(t, 0, PULL_A, 0, 1); // the camera drifts in
  // Flight from the depth of the sky, overshooting toward the lens, then settling.
  let z = interpolate(k, [0, 1, 1.4], [-5200, 0, 420], { extrapolateRight: "clamp" }) + dolly;
  let x = w.rest[0] + w.from.x * (1 - k);
  let y = w.rest[1] + w.from.y * (1 - k);
  let rx = w.from.rx * (1 - k);
  let ry = w.from.ry * (1 - k);
  let rz = w.from.rz * (1 - k);
  // ...and they never sit still.
  x += live * 18 * Math.sin(t * 1.5 + w.ph);
  y += live * 14 * Math.cos(t * 1.2 + w.ph);
  z += live * 90 * Math.sin(t * 1.1 + w.ph);
  ry += live * 13 * Math.sin(t * 0.95 + w.ph);
  rz += live * 2.4 * Math.sin(t * 1.3 + w.ph);
  if (w.text === "this?" && t > THIS_AT) rz += (1 - q) * 11 * Math.sin((t - THIS_AT) * 24) * Math.exp(-(t - THIS_AT) * 5);
  // The pull-back flattens them into the plane of the window.
  z = lerp(z, 0, q);
  rx = lerp(rx, 0, q);
  ry = lerp(ry, 0, q);
  rz = lerp(rz, 0, q);
  const blur = Math.max(0, 1 - k) * 14 + q * 3;
  const op = clamp01(k * 4) * (1 - tw(T, 1.8, 2.08, 0, 1));
  return { transform: `translate3d(${x}px, ${y}px, ${z}px) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg) translate(-50%, -50%)`, blur, op };
};

const ringState = (t: number) => {
  const T = v2T(t);
  const q = pullP(T);
  const e = springT(t, word(L.hire, "four") - 0.02, 13, 1, 80);
  const r = winRect(T);
  // the chrome ring in the site's top-right corner (rec px), like video 2
  const tx = r.fx + 1620 * r.sc;
  const ty = r.fy + 220 * r.sc;
  return {
    cx: lerp(184 + Math.sin(t * 0.9) * 14, tx, q),
    cy: lerp(W_PEOPLE + 10 + Math.cos(t * 0.8) * 10, ty, q),
    d: lerp(470 * (0.35 + 0.65 * e), (105 * r.sc) / C, q),
    thick: lerp(26, 9, q),
    tilt: lerp(-14 + Math.sin(t * 0.8) * 6, -30, q),
    rx: lerp(70 + Math.sin(t * 1.2) * 4, 55, q),
    spin: t * 140,
    opacity: clamp01(e * 1.4) * (1 - tw(T, 1.88, 2.06, 0, 1)),
  };
};

/** The hook's flying line, with the chrome ring orbiting the "4". */
const HookWords: React.FC<{ t: number }> = ({ t }) => {
  const T = v2T(t);
  if (T > 2.15) return null;
  const q = pullP(T);
  const r = winRect(T);
  const ring = ringState(t);
  const carry = lerp(1, 0.8, q);
  const clip = q > 0.001 ? `inset(${r.y}px ${1080 - r.x - r.w}px ${1920 - r.y - r.h}px ${r.x}px round ${lerp(0, 24, q)}px)` : undefined;
  return (
    <>
      <div style={{ position: "absolute", inset: 0, clipPath: clip, pointerEvents: "none" }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            perspective: PERSP,
            perspectiveOrigin: `${VP[0]}px ${VP[1]}px`,
            transformOrigin: `${CARRY_C[0]}px ${CARRY_C[1]}px`,
            transform: `scale(${carry})`,
          }}
        >
          <IriRing {...ring} half="back" />
          {WORDS.map((w) => {
            if (t < w.at - 0.02) return null;
            const { transform, blur, op } = wordTransform(w, t);
            return (
              <div
                key={w.text}
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  transformOrigin: "0 0",
                  transform,
                  opacity: op,
                  fontFamily: theme2.display,
                  fontWeight: 800,
                  fontSize: w.size,
                  lineHeight: 1,
                  letterSpacing: "-0.04em",
                  whiteSpace: "nowrap",
                  color: w.color,
                  filter: blur > 0.3 ? `blur(${blur}px)` : undefined,
                  textShadow: `0 18px 70px rgba(9,13,37,.65), 0 0 50px ${w.color === theme2.lilac ? "rgba(188,165,238,.45)" : "rgba(228,220,255,.22)"}`,
                }}
              >
                {w.text}
              </div>
            );
          })}
        </div>
      </div>
      {/* the near arc of the ring stays outside the clip so it can pass in front */}
      <div style={{ position: "absolute", inset: 0, perspective: PERSP, perspectiveOrigin: `${VP[0]}px ${VP[1]}px`, pointerEvents: "none", transformOrigin: `${CARRY_C[0]}px ${CARRY_C[1]}px`, transform: `scale(${carry})` }}>
        <IriRing {...ring} half="front" />
      </div>
    </>
  );
};

/** Small lilac eyebrow from the site: "Suyash Kashyap / A mind in motion" (inside the safe zone). */
const HookTag: React.FC<{ t: number }> = ({ t }) => {
  const k = tw(t, 0.05, 0.75, 0, 1, OUT_EXPO);
  const out = tw(t, PULL_A - 0.1, PULL_A + 0.25, 0, 1);
  if (k <= 0 || out >= 1) return null;
  return (
    <div
      style={{
        position: "absolute",
        top: 312,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: 16,
        fontFamily: theme2.mono,
        fontSize: 24,
        color: theme2.lilacSoft,
        letterSpacing: `${lerp(0.6, 0.22, k)}em`,
        opacity: k * (1 - out),
        transform: `translateY(${-30 * out}px)`,
        textShadow: "0 2px 18px rgba(9,13,37,.9)",
      }}
    >
      <div style={{ width: 10, height: 10, borderRadius: 5, background: theme2.lilac, boxShadow: `0 0 16px ${theme2.lilac}` }} />
      SUYASH KASHYAP / A MIND IN MOTION
    </div>
  );
};

// "I'm one person, with AI." becomes "1 person / + AI", snapping in under the window and tracked
// from the site's own name mark (the person behind the site).
const ONE = [
  { text: "1", at: word(L.person, "one"), x: 300, y: 1215, size: 150, color: theme2.lilac },
  { text: "person", at: word(L.person, "person"), x: 592, y: 1215, size: 150, color: theme2.paper },
  { text: "+", at: word(L.person, "with"), x: 452, y: 1388, size: 170, color: theme2.lilacSoft },
  { text: "AI", at: word(L.person, "AI"), x: 610, y: 1388, size: 170, color: theme2.lilac },
];
const ONE_EXIT: [number, number] = [4.42, 4.76];

const OnePerson: React.FC<{ t: number }> = ({ t }) => {
  const T = v2T(t);
  if (t < ONE[0].at - 0.15 || t > ONE_EXIT[1] + 0.05) return null;
  const exit = tw(t, ONE_EXIT[0], ONE_EXIT[1], 0, 1, (x) => x * x);
  const [lx, ly] = footToScreen(T, LOGO[0] + 70, LOGO[1] + 16);
  const draw = tw(t, ONE[0].at - 0.08, ONE[0].at + 0.2, 0, 1, OUT_EXPO) * (1 - tw(t, 4.2, 4.42, 0, 1));
  const ex = 222;
  const ey = 1215 - 150 * 0.45;
  const aiAt = ONE[3].at;
  const hit = t > aiAt ? Math.exp(-(t - aiAt) * 9) * Math.sin((t - aiAt) * 40) * 6 : 0;
  return (
    <>
      {draw > 0.001 && (
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          <path
            d={`M${lx} ${ly} C ${lx - 40} ${ly + 160}, ${ex - 60} ${ey - 200}, ${ex} ${ey}`}
            fill="none"
            stroke={theme2.lilac}
            strokeWidth={3}
            strokeDasharray="1 1"
            pathLength={1}
            strokeDashoffset={1 - draw}
            opacity={0.9}
            style={{ filter: `drop-shadow(0 0 6px ${theme2.glow})` }}
          />
          <circle cx={lx} cy={ly} r={6 * draw} fill={theme2.lilacSoft} />
          <circle cx={ex} cy={ey} r={5 * draw} fill={theme2.lilac} />
        </svg>
      )}
      {ONE.map((w, i) => {
        const k = springT(t, w.at - 0.02, 12, 0.6, 180);
        if (k <= 0) return null;
        const s = interpolate(k, [0, 1], [1.9, 1]);
        const blur = Math.max(0, 1 - k) * 18;
        const float = Math.sin(t * 1.7 + i * 1.4) * 8;
        const ex2 = -700 * exit * (i % 2 ? -0.6 : 1) * (1 + i * 0.15);
        const isAI = w.text === "AI";
        return (
          <div
            key={w.text}
            style={{
              position: "absolute",
              left: w.x,
              top: w.y + float + hit * (isAI ? 0 : 0.5),
              transform: `translate(-50%, -50%) translateX(${ex2}px) scale(${s}) rotate(${(1 - Math.min(1, k)) * (i % 2 ? 8 : -8) + (isAI ? hit : 0)}deg)`,
              opacity: clamp01(k * 3) * (1 - exit),
              fontFamily: theme2.display,
              fontWeight: 800,
              fontSize: w.size,
              lineHeight: 1,
              letterSpacing: "-0.045em",
              whiteSpace: "nowrap",
              color: w.color,
              filter: blur + exit * 16 > 0.3 ? `blur(${blur + exit * 16}px)` : undefined,
              textShadow: `0 12px 50px rgba(9,13,37,.85), 0 0 ${isAI ? 60 : 40}px ${w.color === theme2.paper ? "rgba(228,220,255,.2)" : "rgba(188,165,238,.6)"}`,
            }}
          >
            {w.text}
          </div>
        );
      })}
    </>
  );
};

export const Hook: React.FC = () => {
  const t = useCurrentFrame() / 30;
  const T = v2T(t);
  const q = tw(T, 1.45, 2.05, 0, 1, PULL);
  const roll = -2.6 * Math.sin(Math.PI * q);
  const name = tw(t, word(L.person, "I'm"), word(L.person, "I'm") + 0.16, 0, 1) * (1 - tw(t, 4.3, 4.5, 0, 1));
  const bloom = tw(t, 4.6, 4.8, 0, 0.55, (x) => x * x);
  const push = 1 + 0.05 * tw(t, 4.3, 4.8, 0, 1, (x) => x * x);
  return (
    <AbsoluteFill style={{ background: theme2.bg, overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `rotate(${roll}deg) scale(${(1 + Math.abs(roll) * 0.02) * push})` }}>
        <OuterWorld T={T} />
        <HeroWindow
          T={T}
          offset={0}
          overlay={<Brackets x={LOGO[0] - 22} y={LOGO[1] - 22} w={196} h={44} opacity={name} arm={12} stroke={5} />}
        />
        <Clouds T={T} />
        <Dust T={T} opacity={0.5} />
        <Bokeh T={T} opacity={0.6} />
        <HookWords t={t} />
        <OnePerson t={t} />
        <HookTag t={t} />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: theme2.lilacSoft, opacity: bloom, mixBlendMode: "screen" }} />
    </AbsoluteFill>
  );
};
