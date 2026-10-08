import { interpolate } from "remotion";
import { theme2 } from "../../theme";
import { IriRing } from "./World";
import { C, OUT_EXPO, PULL, WIN_LEFT, WIN_TOP, CHROME, clamp01, footToScreen, lerp, springT, tw } from "./util";

const SIZE = 300;
const PERSP = 1200;
const VP: [number, number] = [540, 900];

// Footage px -> landed window px (identity pose), for the headline targets.
const land = (fx: number, fy: number): [number, number] => [WIN_LEFT + fx * C, WIN_TOP + CHROME + fy * C];

type Word = {
  text: string;
  color: string;
  at: number;
  rest: [number, number];
  target: [number, number];
  ts: number;
  from: { x: number; y: number; rx: number; ry: number; rz: number };
  ph: number;
};

// "Ideas / don't / sit still." laid out like the site headline, then landed on it.
// Footage headline boxes (rec px): Ideas 111-561 x 244-376, don't 219-568 x 400-532, sit still. 108-437 x 558-671.
const LINE3 = land(272.5, 614.5);
const S3 = 0.25;
const WORDS: Word[] = [
  { text: "Ideas", color: theme2.paper, at: -0.22, rest: [480, 645], target: land(336, 310), ts: 0.363, from: { x: -240, y: -260, rx: 24, ry: 55, rz: -10 }, ph: 0 },
  { text: "don’t", color: theme2.lilac, at: 0.4, rest: [625, 888], target: land(393.5, 466), ts: 0.33, from: { x: 560, y: 60, rx: 0, ry: -75, rz: 12 }, ph: 2.1 },
  { text: "sit", color: theme2.paper, at: 0.68, rest: [275, 1131], target: [LINE3[0] - 258 * S3, LINE3[1]], ts: S3, from: { x: -460, y: 320, rx: -35, ry: 45, rz: -14 }, ph: 4.0 },
  { text: "still.", color: theme2.paper, at: 0.84, rest: [695, 1131], target: [LINE3[0] + 162 * S3, LINE3[1]], ts: S3, from: { x: 420, y: 420, rx: -30, ry: -45, rz: 16 }, ph: 5.3 },
];

const wordTransform = (w: Word, T: number) => {
  const k = springT(T, w.at, 11, 0.85, 105);
  const q = tw(T, 1.45, 2.0, 0, 1, PULL);
  const live = clamp01((T - w.at - 0.45) / 0.5) * (1 - q);
  const dolly = 100 * tw(T, 0, 1.45, 0, 1); // the camera drifts in
  // Flight from the depth of the sky, overshooting toward the lens, then settling.
  let z = interpolate(k, [0, 1, 1.4], [-5200, 0, 420], { extrapolateRight: "clamp" }) + dolly;
  let x = w.rest[0] + w.from.x * (1 - k);
  let y = w.rest[1] + w.from.y * (1 - k);
  let rx = w.from.rx * (1 - k);
  let ry = w.from.ry * (1 - k);
  let rz = w.from.rz * (1 - k);
  // ...and it never sits still.
  x += live * 18 * Math.sin(T * 1.5 + w.ph);
  y += live * 14 * Math.cos(T * 1.2 + w.ph);
  z += live * 90 * Math.sin(T * 1.1 + w.ph);
  ry += live * 13 * Math.sin(T * 0.95 + w.ph);
  rz += live * 2.4 * Math.sin(T * 1.3 + w.ph);
  if (w.text === "still." && T > 1.12) rz += (1 - q) * 11 * Math.sin((T - 1.12) * 24) * Math.exp(-(T - 1.12) * 5);
  // The pull-back: every word lands on its twin in the real headline.
  x = lerp(x, w.target[0], q);
  y = lerp(y, w.target[1], q);
  z = lerp(z, 0, q);
  rx = lerp(rx, 0, q);
  ry = lerp(ry, 0, q);
  rz = lerp(rz, 0, q);
  const s = lerp(1, w.ts, q);
  const blur = Math.max(0, 1 - k) * 14;
  const op = clamp01(k * 4) * (1 - tw(T, 1.96, 2.1, 0, 1));
  return { transform: `translate3d(${x}px, ${y}px, ${z}px) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg) scale(${s}) translate(-50%, -50%)`, blur, op };
};

const ringState = (T: number) => {
  const q = tw(T, 1.45, 2.0, 0, 1, PULL);
  const e = springT(T, 0.12, 13, 1, 80);
  const [tx, ty] = land(1620, 220); // the chrome ring in the site's top-right corner
  return {
    cx: lerp(540 + Math.sin(T * 0.9) * 14, tx, q),
    cy: lerp(905 + Math.cos(T * 0.8) * 10, ty, q),
    d: lerp(1000 * (0.35 + 0.65 * e), 105, q),
    thick: lerp(34, 9, q),
    tilt: lerp(-12 + Math.sin(T * 0.8) * 6, -30, q),
    rx: lerp(72 + Math.sin(T * 1.2) * 4, 55, q),
    spin: T * 140,
    opacity: clamp01(e * 1.4) * (1 - tw(T, 1.88, 2.06, 0, 1)),
  };
};

/** The hook's flying headline, with the chrome ring orbiting "don't". */
export const HookWords: React.FC<{ T: number }> = ({ T }) => {
  if (T > 2.15) return null;
  const r = ringState(T);
  return (
    <div style={{ position: "absolute", inset: 0, perspective: PERSP, perspectiveOrigin: `${VP[0]}px ${VP[1]}px`, pointerEvents: "none" }}>
      <IriRing {...r} half="back" />
      {WORDS.map((w) => {
        if (T < w.at - 0.02) return null;
        const { transform, blur, op } = wordTransform(w, T);
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
              fontSize: SIZE,
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
      <IriRing {...r} half="front" />
    </div>
  );
};

/** Small lilac eyebrow from the site: "Suyash Kashyap / A mind in motion". */
export const HookTag: React.FC<{ T: number }> = ({ T }) => {
  const k = tw(T, 0.05, 0.7, 0, 1, OUT_EXPO);
  const out = tw(T, 1.4, 1.7, 0, 1);
  if (k <= 0 || out >= 1) return null;
  return (
    <div
      style={{
        position: "absolute",
        top: 132,
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

// "Neither do I." snaps in under the window, tracked from the tiny label in the real hero.
const NDI = [
  { text: "Neither", at: 1.98, dx: -150, color: theme2.paper },
  { text: "do", at: 2.2, dx: 192, color: theme2.paper },
  { text: "I.", at: 2.4, dx: 343, color: theme2.lilac },
];
const NDI_Y = 1258;
const NDI_SIZE = 150;
export const NDI_LABEL: [number, number] = [206, 707]; // "NEITHER DO I." in the hero (rec px)

export const NeitherDoI: React.FC<{ T: number }> = ({ T }) => {
  if (T < 1.85 || T > 3.75) return null;
  const exit = tw(T, 3.28, 3.62, 0, 1, (x) => x * x);
  const [lx, ly] = footToScreen(T, NDI_LABEL[0], NDI_LABEL[1] + 12);
  const draw = tw(T, 1.88, 2.12, 0, 1, OUT_EXPO) * (1 - tw(T, 3.15, 3.35, 0, 1));
  const ex = 540 - 360;
  const ey = NDI_Y - NDI_SIZE * 0.42;
  const hit = T > 2.4 ? Math.exp(-(T - 2.4) * 9) * Math.sin((T - 2.4) * 40) * 6 : 0;
  return (
    <>
      {draw > 0.001 && (
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          <path
            d={`M${lx} ${ly} C ${lx} ${ly + 120}, ${ex - 20} ${ey - 140}, ${ex} ${ey}`}
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
      {NDI.map((w, i) => {
        const k = springT(T, w.at, 12, 0.6, 180);
        if (k <= 0) return null;
        const s = interpolate(k, [0, 1], [1.9, 1]);
        const blur = Math.max(0, 1 - k) * 18;
        const float = Math.sin(T * 1.7 + i * 1.4) * 8;
        const ex2 = -700 * exit * (i === 2 ? -0.6 : 1) * (1 + i * 0.15);
        return (
          <div
            key={w.text}
            style={{
              position: "absolute",
              left: 540 + w.dx,
              top: NDI_Y + float + hit * (i === 2 ? 0 : 0.5),
              transform: `translate(-50%, -50%) translateX(${ex2}px) scale(${s}) rotate(${(1 - Math.min(1, k)) * (i % 2 ? 8 : -8) + (i === 2 ? hit : 0)}deg)`,
              opacity: clamp01(k * 3) * (1 - exit),
              fontFamily: theme2.display,
              fontWeight: 800,
              fontSize: NDI_SIZE,
              lineHeight: 1,
              letterSpacing: "-0.045em",
              whiteSpace: "nowrap",
              color: w.color,
              filter: blur + exit * 16 > 0.3 ? `blur(${blur + exit * 16}px)` : undefined,
              textShadow: `0 12px 50px rgba(9,13,37,.85), 0 0 40px ${i === 2 ? "rgba(188,165,238,.6)" : "rgba(228,220,255,.2)"}`,
            }}
          >
            {w.text}
          </div>
        );
      })}
    </>
  );
};
