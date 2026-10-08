import { AbsoluteFill, random, useCurrentFrame } from "remotion";
import { RecSpans } from "../../v2/components/Rec";
import { theme2 } from "../../v2/theme";
import { Bokeh, LightSweep, Motes, SkyPlate } from "../../v2/scenes/onemind-cta-end/Backdrop";
import {
  bump,
  camAt,
  camCss,
  camSpeed,
  clamp01,
  eIn,
  eIO,
  eInQuint,
  eOut,
  eOutBack,
  eOutExpo,
  lerp,
  prog,
  springAt,
  toScreen,
  type CamKey,
} from "../../v2/scenes/onemind-cta-end/kit";
import { L, S, at } from "../timing";

// PAYOFF (26.6 to 28.95): video 2's OneMind. "And this ad? Made the same way." The site's
// connection graph: the four things this ad just showed (products, tools, content, campaigns) pop
// as nodes wired to the real cards they stand for, then hand over to the one centre. On "Made"
// everything converges into the orb; "same way." bursts it back out. The scene ends by diving into
// the orb (match cut to the ring in Cta). The line is kinetic (typeset here, no caption).

const LEN = S.payoff[1] - S.payoff[0];
const w = (s: string) => at("payoff", L.thisAd, s);
const T_AND = w("and");
const T_THIS = w("this");
const T_AD = w("ad");
const T_MADE = w("made");
const T_THE = w("the");
const T_SAME = w("same");
const T_WAY = w("way");
const CONV = T_MADE - 0.02; // nodes fly into the orb
const BURST = T_SAME; // "same way." bursts out
const DIVE = LEN - 0.17;
const REC_SPAN: [number, number] = [60.2, 63.2];

type Rect = [number, number, number, number];
/** Card rectangles in the recording (px), measured on the stable graph shot. */
const CARD: Record<string, Rect> = {
  biltib: [490, 463, 653, 523],
  moolank: [862, 408, 1022, 468],
  icreate: [1142, 535, 1308, 597],
  playground: [399, 642, 570, 707],
  conv: [1050, 716, 1225, 780],
  creative: [679, 770, 856, 836],
};
const ORB: [number, number] = [855, 620];

/** The four chapters of the ad as graph nodes, each wired to the real card(s) it stands for. */
const WORDS = [
  { w: "Products", at: 0.06, x: 290, y: 560, cards: ["biltib", "moolank", "icreate"] },
  { w: "Tools", at: 0.2, x: 840, y: 600, cards: ["conv"] },
  { w: "Content", at: 0.34, x: 260, y: 1060, cards: ["creative", "playground"] },
  { w: "Campaigns", at: 0.48, x: 760, y: 1100, cards: ["moolank", "icreate"] },
];
const HANDOVER = 0.62; // card wires hand over to centre wires

const KEYS: CamKey[] = [
  { t: 0, cx: 940, cy: 480, s: 2.1, r: -8, fy: 940 },
  { t: 0.36, cx: 855, cy: 610, s: 1.06, r: 0, fy: 880, ease: eOut },
  { t: CONV - 0.05, cx: 855, cy: 616, s: 1.12, r: 0.6, fy: 880, ease: (x) => x },
  { t: CONV + 0.25, cx: 855, cy: 620, s: 1.0, r: 0, fy: 880, ease: eOut },
  { t: BURST, cx: 855, cy: 620, s: 1.05, r: 0, fy: 880, ease: eIO },
  { t: BURST + 0.25, cx: 855, cy: 620, s: 1.5, r: 0, fy: 880, ease: eOut },
  { t: DIVE, cx: 855, cy: 620, s: 1.7, r: -6, fy: 880, ease: eOut },
  { t: LEN, cx: 855, cy: 620, s: 9.5, r: -24, fy: 900, ease: eInQuint },
];

const display: React.CSSProperties = { fontFamily: theme2.display, fontWeight: 800, letterSpacing: "-0.045em", lineHeight: 1 };

/** Corner brackets + tint around a card, drawn inside the recording plate (recording px). */
const Bracket: React.FC<{ rect: Rect; t: number; at: number; out: number; s: number }> = ({ rect, t, at, out, s }) => {
  const k = eOutBack(prog(t, at, at + 0.26));
  if (k <= 0 || out >= 1) return null;
  const pad = 12;
  const [x0, y0, x1, y1] = rect;
  const w = x1 - x0 + pad * 2;
  const h = y1 - y0 + pad * 2;
  const sc = 1.3 - 0.3 * k;
  const sw = 3.2 / s;
  const L = Math.min(26, h * 0.42);
  const pulse = 0.12 + 0.08 * Math.sin((t - at) * 9);
  return (
    <svg width={w} height={h} style={{ position: "absolute", left: x0 - pad, top: y0 - pad, overflow: "visible" }}>
      <g transform={`translate(${w / 2} ${h / 2}) scale(${sc}) translate(${-w / 2} ${-h / 2})`} opacity={clamp01(k) * (1 - out)}>
        <rect x={0} y={0} width={w} height={h} rx={16} fill={`rgba(188,165,238,${pulse})`} stroke="rgba(188,165,238,.45)" strokeWidth={sw * 0.5} />
        <path
          d={`M0 ${L} L0 0 L${L} 0 M${w - L} 0 L${w} 0 L${w} ${L} M${w} ${h - L} L${w} ${h} L${w - L} ${h} M${L} ${h} L0 ${h} L0 ${h - L}`}
          fill="none"
          stroke={theme2.lilacSoft}
          strokeWidth={sw * 1.4}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
};

/** Where a line from `from` towards the card centre meets the card's (screen) edge. */
const edgePoint = (from: [number, number], c: [number, number], hw: number, hh: number): [number, number] => {
  const dx = from[0] - c[0];
  const dy = from[1] - c[1];
  const k = Math.min(Math.abs(dx) > 0.01 ? hw / Math.abs(dx) : 99, Math.abs(dy) > 0.01 ? hh / Math.abs(dy) : 99, 1);
  return [c[0] + dx * k, c[1] + dy * k];
};

const Wire: React.FC<{ a: [number, number]; b: [number, number]; p: number; opacity: number; t: number; seed: number; width?: number }> = ({
  a,
  b,
  p,
  opacity,
  t,
  seed,
  width = 3,
}) => {
  if (p <= 0 || opacity <= 0.01) return null;
  const x2 = lerp(a[0], b[0], p);
  const y2 = lerp(a[1], b[1], p);
  const q = (t * 1.3 + seed * 0.37) % 1;
  return (
    <g opacity={opacity}>
      <line x1={a[0]} y1={a[1]} x2={x2} y2={y2} stroke={theme2.lilac} strokeWidth={width * 4.5} strokeLinecap="round" opacity={0.16} />
      <line x1={a[0]} y1={a[1]} x2={x2} y2={y2} stroke={theme2.lilacSoft} strokeWidth={width} strokeLinecap="round" />
      {p >= 1 && <circle cx={lerp(a[0], b[0], q)} cy={lerp(a[1], b[1], q)} r={width * 2} fill={theme2.paper} opacity={0.9} />}
      <circle cx={x2} cy={y2} r={width * 2.2} fill={theme2.paper} />
    </g>
  );
};

/** "Made the / same way.": every letter arrives from a different direction on its word. */
const BOTTOM: { text: string; top: number; color: string; words: number[] }[] = [
  { text: "Made the", top: 1150, color: theme2.paper, words: [T_MADE, T_THE] },
  { text: "same way.", top: 1312, color: theme2.lilac, words: [T_SAME, T_WAY] },
];

export const OneMind: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / 30;
  const cam = camAt(t, KEYS);
  const speed = camSpeed(t, KEYS);
  const blur = Math.min(14, Math.max(0, (speed - 14) / 7));
  const orb = toScreen(cam, ORB[0], ORB[1]);

  // Which node is "live" (its wires are lit).
  const live = WORDS.reduce((n, w, i) => (t >= w.at ? i : n), -1);
  const wide = prog(t, HANDOVER, HANDOVER + 0.25);
  const conv = (i: number) => eIn(prog(t, CONV + i * 0.04, CONV + 0.3 + i * 0.04)); // node flies into the orb
  const merged = bump(t, CONV + 0.38, 0.5);
  const burst = prog(t, BURST, BURST + 0.6);
  const dive = eIn(prog(t, DIVE + 0.03, LEN));

  // Parallax for the depth layers.
  const pdx = -(cam.cx - 855) * cam.s;
  const pdy = -(cam.cy - 620) * cam.s;

  return (
    <AbsoluteFill style={{ background: theme2.bg, overflow: "hidden" }}>
      {/* deep plate */}
      <SkyPlate t={t + 40} zoom={1.12 + t * 0.01} opacity={0.42} x={pdx * 0.05} y={pdy * 0.05 - 120} />
      <Bokeh t={t} seed="omb" dx={pdx * 0.18} dy={pdy * 0.18} opacity={0.8} />
      <Motes t={t} seed="omback" count={45} dx={pdx * 0.25} dy={pdy * 0.25} opacity={0.45} size={0.8} />

      {/* the real footage, on a moving camera */}
      <AbsoluteFill style={{ filter: blur > 0.4 ? `blur(${blur.toFixed(1)}px)` : undefined }}>
        <div style={{ position: "absolute", left: 0, top: 0, width: 1708, height: 1080, transformOrigin: "0 0", transform: camCss(cam) }}>
          <div
            style={{
              position: "absolute",
              inset: 0,
              WebkitMaskImage: "linear-gradient(180deg, transparent 0px, transparent 300px, #000 372px, #000 850px, transparent 975px)",
              maskImage: "linear-gradient(180deg, transparent 0px, transparent 300px, #000 372px, #000 850px, transparent 975px)",
            }}
          >
            <RecSpans spans={[REC_SPAN]} durations={[LEN]} />
            {WORDS.map((w) =>
              w.cards.map((c, j) => <Bracket key={c} rect={CARD[c]} t={t} at={w.at + 0.04 + j * 0.07} out={wide} s={cam.s} />),
            )}
          </div>
        </div>
      </AbsoluteFill>

      {/* orb glow (screen blend over the footage) */}
      <AbsoluteFill style={{ mixBlendMode: "screen", pointerEvents: "none" }}>
        {(() => {
          const g = clamp01(prog(t, HANDOVER, HANDOVER + 0.4) * 0.6 + merged * 0.9 + bump(t, BURST, 0.6) * 0.8 + prog(t, CONV, CONV + 0.6) * 0.35);
          const R = 260 * cam.s * (1 + merged * 0.6);
          return (
            <div
              style={{
                position: "absolute",
                left: orb[0] - R,
                top: orb[1] - R,
                width: R * 2,
                height: R * 2,
                borderRadius: "50%",
                opacity: g,
                background: "radial-gradient(circle, rgba(228,220,255,.75) 0%, rgba(188,165,238,.4) 22%, rgba(188,165,238,.12) 45%, rgba(188,165,238,0) 70%)",
              }}
            />
          );
        })()}
      </AbsoluteFill>

      {/* scrims that keep the kinetic type clean */}
      <AbsoluteFill
        style={{
          opacity: prog(t, 0.05, 0.3),
          background: "linear-gradient(180deg, rgba(9,13,37,.95) 0px, rgba(9,13,37,.8) 470px, rgba(9,13,37,0) 640px)",
        }}
      />
      <AbsoluteFill
        style={{
          opacity: prog(t, CONV - 0.1, CONV + 0.2),
          background: "linear-gradient(0deg, rgba(9,13,37,.94) 0px, rgba(9,13,37,.82) 820px, rgba(9,13,37,0) 1000px)",
        }}
      />

      {/* wires, rays and rings (screen space) */}
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        {/* "same way." rays */}
        {burst > 0 &&
          Array.from({ length: 28 }, (_, i) => {
            const d = random(`omr${i}`) * 0.12;
            const p = eOutExpo(prog(t, BURST + d, BURST + 0.53 + d));
            if (p <= 0) return null;
            const ang = (i / 28) * Math.PI * 2 + (random(`oma${i}`) - 0.5) * 0.18 + (cam.r * Math.PI) / 180;
            const r0 = 75 * cam.s;
            const Lr = (700 + random(`oml${i}`) * 900) * p;
            const fade = 1 - prog(t, BURST + 0.4, BURST + 0.7) * 0.55;
            const x1 = orb[0] + Math.cos(ang) * r0;
            const y1 = orb[1] + Math.sin(ang) * r0;
            const x2 = orb[0] + Math.cos(ang) * (r0 + Lr);
            const y2 = orb[1] + Math.sin(ang) * (r0 + Lr);
            const wd = 1.5 + random(`omw${i}`) * 3;
            return (
              <g key={i} opacity={fade}>
                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={theme2.lilac} strokeWidth={wd * 4} opacity={0.14} strokeLinecap="round" />
                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={theme2.lilacSoft} strokeWidth={wd} opacity={0.85} strokeLinecap="round" />
                <circle cx={x2} cy={y2} r={wd * 2.4} fill={theme2.paper} />
              </g>
            );
          })}
        {/* shockwaves */}
        {[CONV + 0.36, BURST].map((a, k) => {
          const p = prog(t, a, a + 0.7);
          if (p <= 0 || p >= 1) return null;
          return (
            <circle
              key={k}
              cx={orb[0]}
              cy={orb[1]}
              r={60 * cam.s + eOut(p) * (k ? 1300 : 700)}
              fill="none"
              stroke={theme2.lilacSoft}
              strokeWidth={(k ? 7 : 5) * (1 - p) + 1}
              opacity={(1 - p) * 0.8}
            />
          );
        })}
        {/* node -> card wires */}
        {WORDS.map((w, i) => {
          if (t < w.at) return null;
          const from: [number, number] = [w.x, w.y];
          return w.cards.map((c, j) => {
            const [x0, y0, x1, y1] = CARD[c];
            const centre = toScreen(cam, (x0 + x1) / 2, (y0 + y1) / 2);
            const end = edgePoint(from, centre, ((x1 - x0) / 2 + 14) * cam.s, ((y1 - y0) / 2 + 14) * cam.s);
            const p = eOut(prog(t, w.at + 0.05 + j * 0.07, w.at + 0.3 + j * 0.07));
            const op = (i === live ? 1 : 0.5) * (1 - wide);
            return <Wire key={c} a={from} b={end} p={p} opacity={op} t={t} seed={i * 3 + j} width={i === live ? 3.2 : 2.2} />;
          });
        })}
        {/* node -> centre wires */}
        {WORDS.map((w, i) => {
          const p = eOut(prog(t, HANDOVER + i * 0.05, HANDOVER + 0.3 + i * 0.05));
          if (p <= 0) return null;
          const f = conv(i);
          const a: [number, number] = [lerp(w.x, orb[0], f), lerp(w.y, orb[1], f)];
          const ang = Math.atan2(a[1] - orb[1], a[0] - orb[0]);
          const b: [number, number] = [orb[0] + Math.cos(ang) * 68 * cam.s, orb[1] + Math.sin(ang) * 68 * cam.s];
          return <Wire key={w.w} a={a} b={b} p={p} opacity={1 - prog(t, CONV + 0.22 + i * 0.04, CONV + 0.4 + i * 0.04)} t={t} seed={i + 7} width={3.4} />;
        })}
        {/* the centre: a lilac ring around the orb that pulses as each wire lands */}
        {(() => {
          const on = prog(t, HANDOVER + 0.05, HANDOVER + 0.25);
          if (on <= 0) return null;
          const hit = WORDS.reduce((n, _, i) => n + bump(t, HANDOVER + 0.3 + i * 0.05, 0.3), 0) + merged * 1.5;
          const fade = 1 - prog(t, DIVE, DIVE + 0.2);
          return (
            <g opacity={on * fade}>
              <circle cx={orb[0]} cy={orb[1]} r={(70 + hit * 14) * cam.s} fill="none" stroke={theme2.lilacSoft} strokeWidth={3 + hit * 2} />
              <circle
                cx={orb[0]}
                cy={orb[1]}
                r={(86 + Math.sin(t * 5) * 4) * cam.s}
                fill="none"
                stroke={theme2.lilac}
                strokeWidth={1.5}
                strokeDasharray="6 10"
                opacity={0.7}
              />
            </g>
          );
        })()}
      </svg>

      {/* word nodes */}
      {WORDS.map((w, i) => {
        if (t < w.at) return null;
        const sp = springAt(t, w.at, 13, 9);
        const f = conv(i);
        if (f >= 1) return null;
        const isLive = i === live && t < HANDOVER;
        const glow = isLive ? 1 : 0.45;
        const x = lerp(w.x, orb[0], f);
        const y = lerp(w.y, orb[1], f) + Math.sin(t * 2.2 + i * 1.3) * 7 * (1 - f);
        const sc = sp * (isLive ? 1.06 : t < HANDOVER ? 0.9 : 1) * (1 - 0.85 * f);
        const ping = prog(t, w.at, w.at + 0.5);
        return (
          <div key={w.w} style={{ position: "absolute", left: x, top: y, width: 0, height: 0 }}>
            {ping > 0 && ping < 1 && (
              <div
                style={{
                  position: "absolute",
                  left: -40 - ping * 260,
                  top: -40 - ping * 260,
                  width: 80 + ping * 520,
                  height: 80 + ping * 520,
                  borderRadius: "50%",
                  border: `3px solid ${theme2.lilacSoft}`,
                  opacity: (1 - ping) * 0.7,
                }}
              />
            )}
            <div
              style={{
                position: "absolute",
                transform: `translate(-50%, -50%) scale(${sc}) rotate(${(1 - Math.min(1, sp)) * -12}deg)`,
                opacity: clamp01(sp * 3) * (1 - f ** 4),
                display: "flex",
                alignItems: "center",
                gap: 16,
                whiteSpace: "nowrap",
                padding: "14px 30px 18px 24px",
                borderRadius: 999,
                background: "linear-gradient(180deg, rgba(44,38,98,.92), rgba(18,18,52,.92))",
                border: `2px solid rgba(228,220,255,${0.35 + glow * 0.35})`,
                boxShadow: `0 18px 50px rgba(3,4,18,.65), 0 0 ${30 + glow * 50}px rgba(188,165,238,${0.25 + glow * 0.35}), inset 0 1px 0 rgba(255,255,255,.18)`,
              }}
            >
              <span style={{ fontFamily: theme2.mono, fontSize: 22, color: theme2.lilac, marginTop: 4 }}>
                {i + 1}/4
              </span>
              <span style={{ ...display, fontSize: 70, color: theme2.paper }}>{w.w}</span>
            </div>
          </div>
        );
      })}

      {/* "And this ad?" */}
      <AbsoluteFill style={{ pointerEvents: "none" }}>
        {(() => {
          const out = eIn(prog(t, DIVE + 0.03, LEN));
          return (
            <div
              style={{
                position: "absolute",
                top: 318 - out * 240,
                left: 0,
                width: 1080,
                display: "flex",
                justifyContent: "center",
                gap: 38,
                opacity: 1 - out,
                transform: `scale(${1 + out * 0.4})`,
              }}
            >
              {(
                [
                  ["And", T_AND, theme2.paper],
                  ["this", T_THIS, theme2.paper],
                  ["ad?", T_AD, theme2.lilac],
                ] as const
              ).map(([word, a, color]) => {
                const sp = springAt(t, a - 0.02, 12, 8);
                const q = word === "ad?" ? bump(t, a, 0.6) : 0;
                return (
                  <span
                    key={word}
                    style={{
                      ...display,
                      display: "inline-block",
                      fontSize: 156,
                      color,
                      transform: `translateY(${(1 - Math.min(1, sp)) * 80}px) scale(${(0.55 + 0.45 * sp) * (1 + q * 0.12)})`,
                      transformOrigin: "50% 70%",
                      opacity: clamp01(sp * 2.5),
                      textShadow: `0 0 ${50 + q * 60}px rgba(188,165,238,${0.55 + q * 0.3}), 0 10px 40px rgba(3,4,18,.85)`,
                    }}
                  >
                    {word}
                  </span>
                );
              })}
            </div>
          );
        })()}
      </AbsoluteFill>

      {/* "Made the / same way.": every letter arrives from a different direction */}
      <AbsoluteFill style={{ pointerEvents: "none" }}>
        {BOTTOM.map((ln, li) => {
          const out = eIn(prog(t, DIVE + 0.03, LEN));
          const chars = [...ln.text];
          let word = 0;
          let inWord = 0;
          return (
            <div
              key={ln.text}
              style={{
                ...display,
                position: "absolute",
                top: ln.top + out * 260,
                left: 0,
                width: 1080,
                textAlign: "center",
                fontSize: 150,
                color: ln.color,
                opacity: 1 - out,
                whiteSpace: "pre",
              }}
            >
              {chars.map((ch, j) => {
                if (ch === " ") {
                  word++;
                  inWord = 0;
                } else inWord++;
                const k = li * 20 + j;
                const a = ln.words[Math.min(word, ln.words.length - 1)] - 0.04 + inWord * 0.014;
                const p = eOutExpo(prog(t, a, a + 0.3));
                if (p <= 0) return <span key={j} style={{ display: "inline-block", opacity: 0 }}>{ch}</span>;
                const ang = random(`omd${k}`) * Math.PI * 2;
                const dist = 700 + random(`omdd${k}`) * 600;
                return (
                  <span
                    key={j}
                    style={{
                      display: "inline-block",
                      transform: `translate(${Math.cos(ang) * dist * (1 - p)}px, ${Math.sin(ang) * dist * (1 - p)}px) rotate(${(random(`omdr${k}`) - 0.5) * 140 * (1 - p)}deg) scale(${0.4 + 0.6 * p})`,
                      opacity: clamp01(p * 3),
                      textShadow: "0 0 46px rgba(188,165,238,.6), 0 10px 40px rgba(3,4,18,.85)",
                    }}
                  >
                    {ch}
                  </span>
                );
              })}
            </div>
          );
        })}
      </AbsoluteFill>

      {/* foreground dust, faster parallax than everything else */}
      <Motes t={t} seed="omfront" count={26} dx={pdx * 0.7} dy={pdy * 0.7} opacity={0.65} size={1.5} />
      <LightSweep t={t} at={CONV - 0.06} dur={0.75} opacity={0.3} />
      <LightSweep t={t} at={BURST - 0.04} dur={0.7} opacity={0.35} angle={-22} />

      {/* entry flash (the cut) and the dive into the orb */}
      <AbsoluteFill style={{ background: theme2.lilacSoft, opacity: (1 - prog(t, 0, 0.2)) * 0.3, mixBlendMode: "screen" }} />
      {dive > 0 && (
        <AbsoluteFill
          style={{
            opacity: dive,
            background: `radial-gradient(circle at ${orb[0]}px ${orb[1]}px, #f8f7f3 0%, #e4dcff 30%, #bca5ee 62%, #6f5cc0 100%)`,
          }}
        />
      )}
    </AbsoluteFill>
  );
};
