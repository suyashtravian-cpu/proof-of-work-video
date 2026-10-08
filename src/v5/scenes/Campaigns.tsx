import { AbsoluteFill, useCurrentFrame } from "remotion";
import { shakeAt } from "../../fx/shake";
import { theme2 } from "../../v2/theme";
import {
  Atmos,
  Bracket,
  ChromeRing,
  Flash,
  Ripple,
  Sparks,
  SpringLetters,
  Sweep,
  Tag,
  bell,
  clamp01,
  ease,
  lerp,
  prog,
  springAt,
  track,
} from "../../v2/scenes/campaigns-lab/kit";
import { NUMERAL_EM, Numeral } from "../../v2/scenes/campaigns-lab/Numeral";
import { scrollTo } from "../../v2/scenes/campaigns-lab/scroll";
import { CAMP } from "../../v2/scenes/campaigns-lab/scrollData";
import { FloatWin } from "../components/rec";
import { L, S, at } from "../timing";

// FOUR (19.22 to 26.6): video 2's Campaigns, re-timed to "Four. Campaigns that bring them in.
// Meta, Google, Reddit, Amazon. Clicks for pennies. Real sign-ups." Footage: rec 28.0 to 31.0,
// "Then, find the first people." and the Moolank Meta ads panel (112 reading-reveal events from
// INR 440.12, 1 to 4 Oct 2026). Each channel name lands on its spoken word; the Reddit number is an
// overlay that rises out of the real Reddit tab and lands (1,999 clicks from $59.17) on "pennies".

const w = (line: number, word: string) => at("four", line, word);
const LEN = S.four[1] - S.four[0];
export const CAMPAIGNS_BEATS = {
  land: 0.4, // window lands
  under: w(L.campaigns, "bring") - 0.02, // underline "the first people."
  punch: w(L.channels, "meta"), // whip into the Moolank Meta panel
  n112: w(L.channels, "meta") + 0.3, // bracket the 112
  spend: w(L.channels, "meta") + 0.55, // bracket the spend
  date: w(L.channels, "google") + 0.12, // date tag
  reddit: w(L.channels, "reddit"), // pull back to the Reddit tab; the count begins
  hit: w(L.pennies, "pennies"), // 1,999 lands
  from: w(L.pennies, "pennies") + 0.3, // FROM $59.17
  tag: w(L.pennies, "real"), // Reddit ads · iCreateEpic
  out: LEN - 0.3, // zoom-through exit
};
const B = CAMPAIGNS_BEATS;

/** Channel chips, each on its spoken word (the caption track skips this line). */
const CHANNELS = [
  { name: "Meta", at: w(L.channels, "meta") },
  { name: "Google", at: w(L.channels, "google") },
  { name: "Reddit", at: w(L.channels, "reddit") },
  { name: "Amazon", at: w(L.channels, "amazon") },
];
const CHIPS_OUT = w(L.pennies, "clicks") - 0.28;

// Smooth version of the recorded wheel scroll (headline up and out, panel up into view).
const S0 = B.under + 0.1;
const S1 = B.punch - 0.12;
const footage = (t: number) => {
  const want = 481 * prog(t, S0, S1, ease.inOut);
  if (t < S1) {
    const tNom = t < S0 ? lerp(28.3, 28.45, t / S0) : lerp(28.45, 28.9, (t - S0) / (S1 - S0));
    return { want, ...scrollTo(CAMP, want, tNom) };
  }
  return { want: 481, t: 28.95 + (t - S1) * 0.36, shift: 0 };
};

const COUNT_AT = B.reddit + 0.16;

/** "Meta, Google, Reddit, Amazon.": one chip per channel on its word, the spoken one lit; Reddit stays ringed for the count. */
const ChannelChips: React.FC<{ t: number }> = ({ t }) => {
  if (t < CHANNELS[0].at - 0.05) return null;
  const out = prog(t, CHIPS_OUT, CHIPS_OUT + 0.24, ease.in);
  if (out >= 1) return null;
  const live = CHANNELS.reduce((n, c, i) => (t >= c.at ? i : n), -1);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 1278, display: "flex", justifyContent: "center", gap: 18 }}>
      {CHANNELS.map((c, i) => {
        const k = springAt(t, c.at - 0.02, 10, 0.5, 190);
        const lit = i === live ? 1 - prog(t, c.at + 0.5, c.at + 0.9) * (c.name === "Reddit" ? 0 : 0.7) : c.name === "Reddit" && t >= c.at ? 0.55 : 0;
        const ring = c.name === "Reddit" && t >= c.at ? 0.5 + 0.5 * Math.sin((t - c.at) * 7) : 0;
        return (
          <div
            key={c.name}
            style={{
              padding: "16px 30px 14px",
              borderRadius: 999,
              fontFamily: theme2.sans,
              fontWeight: 800,
              fontSize: 38,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              whiteSpace: "nowrap",
              color: lit > 0.5 ? theme2.ink : theme2.lilacSoft,
              background: lit > 0 ? `rgba(188,165,238,${0.25 + 0.75 * lit})` : "rgba(20,20,54,.8)",
              border: `2px solid rgba(188,165,238,${0.5 + 0.5 * Math.max(lit, ring)})`,
              boxShadow: `0 18px 40px rgba(3,4,18,.55), 0 0 ${24 + 40 * Math.max(lit, ring)}px rgba(188,165,238,${0.25 + 0.4 * Math.max(lit, ring)})`,
              transform: `translateY(${(1 - k) * 50 + out * 60}px) scale(${0.6 + 0.4 * k})`,
              opacity: clamp01(k * 2) * (1 - out),
            }}
          >
            {c.name}
          </div>
        );
      })}
    </div>
  );
};

export const Campaigns: React.FC = () => {
  const t = useCurrentFrame() / 30;
  const f = footage(t);

  // Window choreography.
  const pA = B.punch - 0.16;
  const pB = B.punch + 0.12;
  const rA = B.reddit - 0.08;
  const rB = B.reddit + 0.34;
  const win = {
    y: track(t, [[0, 1150], [B.land, -160, ease.expo], [pA, -150], [pB, -40, ease.out], [rA, -40], [rB, 100, ease.expo], [LEN, 108]]) + Math.sin(t * 1.7) * 7,
    h: track(t, [[0, 860], [pA, 860], [pB, 620, ease.out], [rA, 620], [rB, 300, ease.expo]]),
    rx: track(t, [[0, 50], [B.land, 9, ease.expo], [pA, 4], [pB, 2, ease.out], [rA, 2], [rB, 30, ease.expo], [LEN, 26]]) + Math.sin(t * 0.9) * 0.8,
    ry: track(t, [[0, -16], [B.land, -9, ease.out], [pA, -5], [pB, 8, ease.out], [rA, 4], [rB, 0, ease.expo], [LEN, -3]]),
    rz: track(t, [[0, -4], [B.land, -1.5, ease.out], [pA, -0.8], [pB, 1.2, ease.out], [rA, 0.6], [rB, -1.5, ease.expo], [LEN, -0.6]]) + Math.sin(t * 1.2) * 0.35,
    s: track(t, [[0, 0.9], [B.land, 1, ease.expo], [pA, 1.02], [pB, 1, ease.out], [rA, 1.03], [rB, 0.92, ease.expo], [LEN, 0.95]]),
    dim: track(t, [[B.reddit, 0], [rB, 0.28], [B.hit, 0.3], [B.hit + 0.25, 0.48]]),
    blur: track(t, [[B.hit, 0], [B.hit + 0.3, 1.6]]),
  };
  const cam = {
    zoom: track(t, [[0, 1.25], [pA, 1.29], [pB, 1.55, ease.whip], [rA, 1.66], [rB, 1.2, ease.expo], [LEN, 1.25]]),
    cx: track(t, [[0, 684], [pA, 676], [pB, 960, ease.whip], [rA, 948], [rB, 560, ease.expo], [LEN, 548]]),
    cy: track(t, [[0, 642], [pA, 630], [pB, 405, ease.whip], [rA, 415], [rB, 360, ease.expo], [LEN, 356]]),
  };
  const whip = bell(t, pA, pB) + bell(t, rA, rB) * 0.8;
  const mblur: [number, number] = [whip * 16, whip * 9];

  // Scene camera: hits shake, slow push, zoom-through exit.
  const [s1x, s1y, s1r] = shakeAt(t, [B.punch], 7, 0.25);
  const [s2x, s2y, s2r] = shakeAt(t, [B.hit], 18, 0.38);
  const exitK = prog(t, B.out, LEN, ease.in);
  const push = 1 + 0.012 * Math.sin(t * 0.6) + track(t, [[B.reddit, 0], [LEN - 0.38, 0.03]]);
  const world = `translate(${s1x + s2x}px, ${s1y + s2y}px) rotate(${s1r + s2r}deg) scale(${push * lerp(1, 2.3, exitK)})`;

  // Numeral.
  const countK = clamp01((t - COUNT_AT) / (B.hit - COUNT_AT));
  const value = 1999 * (1 - (1 - countK) ** 1.5); // still climbing into the hit on "pennies"
  const speed = countK > 0 && countK < 1 ? 2.4 * (1 - countK) : 0;
  const rise = prog(t, COUNT_AT, COUNT_AT + 0.55, ease.expo);
  const hitK = springAt(t, B.hit, 8, 0.5, 210);
  const numScale = lerp(0.22, 1, rise) * (t >= B.hit ? 1 + 0.2 * (1 - hitK) : 1);
  const numY = lerp(1000, 600, rise);
  const numSize = 300;
  const glow = 1 + 1.6 * Math.max(0, 1 - (t - B.hit) / 0.5) * (t >= B.hit ? 1 : 0);

  const px = -win.ry * 8 + Math.sin(t * 0.4) * 24;
  const py = win.rx * -5 - t * 8;

  return (
    <AbsoluteFill style={{ background: theme2.bg, overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `translate(${(s1x + s2x) * 0.4}px, ${(s1y + s2y) * 0.4}px) scale(${lerp(1, 1.25, exitK)})` }}>
        <Atmos t={t} px={px} py={py} seed="camp" sky={0.3} />
      </AbsoluteFill>

      <AbsoluteFill style={{ transform: world, opacity: 1 - exitK * 0.85, filter: exitK > 0.05 ? `blur(${(exitK * 10).toFixed(1)}px)` : undefined }}>
        {/* Ghost chapter numeral, deep in the plate */}
        <div
          style={{
            position: "absolute",
            right: -60 + px * 0.3,
            top: 300 + py * 0.3,
            fontFamily: theme2.display,
            fontWeight: 800,
            fontSize: 520,
            lineHeight: 1,
            letterSpacing: "-0.06em",
            color: "transparent",
            WebkitTextStroke: "2px rgba(188,165,238,.32)",
            opacity: track(t, [[0, 0], [B.land, 1, ease.out], [pA, 1], [pB, 0, ease.in]]),
            transform: `translateY(${track(t, [[0, 120], [B.land, 0, ease.expo], [pB, -160, ease.in]])}px) rotate(-6deg)`,
          }}
        >
          04
        </div>

        {/* Behind the numeral: a slow iridescent halo once it has landed */}
        {t >= B.hit - 0.05 && (
          <div
            style={{
              position: "absolute",
              left: 540,
              top: numY,
              transform: `translate(-50%, -50%) perspective(2000px) rotateX(76deg) rotateZ(${t * 40}deg) scale(${lerp(0.4, 1, prog(t, B.hit - 0.05, B.hit + 0.5, ease.expo))})`,
              width: 1150,
              height: 1150,
            }}
          >
            <ChromeRing size={1150} thick={8} rot={t * 90} opacity={0.55 * prog(t, B.hit - 0.05, B.hit + 0.3)} style={{ left: 0, top: 0 }} />
          </div>
        )}

        <FloatWin
          id="camp"
          w={1000}
          h={win.h}
          y={win.y}
          rx={win.rx}
          ry={win.ry}
          rz={win.rz}
          s={win.s}
          cam={cam}
          recT={f.t}
          shift={f.shift}
          dim={win.dim}
          blur={win.blur}
          mblur={mblur}
          sheen={t >= pA && t <= pB + 0.3 ? prog(t, pA, pB + 0.3, ease.inOut) : t < B.land + 0.5 ? prog(t, 0.1, B.land + 0.5) : -1}
          inner={(map, z) => {
            // Lilac highlighter under the recording's "the first people."
            const k = prog(t, B.under, B.under + 0.38, ease.expo);
            const [x0, y0] = map(300, 664 - f.want);
            const [x1] = map(962, 664 - f.want);
            const tab = map(486, 251);
            const tk = clamp01((t - COUNT_AT) / 0.25);
            return (
              <>
                {k > 0 && t < pB && (
                  <div
                    style={{
                      position: "absolute",
                      left: x0,
                      top: y0 - 5 * z,
                      width: (x1 - x0) * k,
                      height: 10 * z,
                      borderRadius: 99,
                      background: `linear-gradient(90deg, ${theme2.lilac}, ${theme2.lilacSoft})`,
                      boxShadow: `0 0 26px ${theme2.glow}`,
                    }}
                  />
                )}
                {t >= COUNT_AT && (
                  <>
                    <div
                      style={{
                        position: "absolute",
                        left: tab[0] - 34 * z,
                        top: tab[1] - 17 * z,
                        width: 68 * z,
                        height: 34 * z,
                        borderRadius: 99,
                        background: `rgba(188,165,238,${0.55 * tk})`,
                        boxShadow: `0 0 ${40 * tk}px rgba(188,165,238,.9)`,
                        mixBlendMode: "screen",
                      }}
                    />
                    <Ripple x={tab[0]} y={tab[1]} t={t} at={COUNT_AT} size={170} />
                  </>
                )}
              </>
            );
          }}
          overlay={(map) => {
            const [a0, a1] = [map(864, 314), map(962, 400)];
            const [s0, s1] = [map(866, 444), map(936, 494)];
            const [r0, r1] = [map(460, 235), map(513, 268)];
            const outB = B.reddit - 0.12;
            return (
              <>
                <Bracket x0={a0[0]} y0={a0[1]} x1={a1[0]} y1={a1[1]} t={t} at={B.n112} out={outB} />
                <Tag x={a1[0] + 34} y={(a0[1] + a1[1]) / 2} t={t} at={B.n112 + 0.06} out={outB} size={28}>
                  Reading-reveal events
                </Tag>
                <Bracket x0={s0[0]} y0={s0[1]} x1={s1[0]} y1={s1[1]} t={t} at={B.spend} out={outB} arm={26} />
                <Tag x={s0[0] - 10} y={s1[1] + 54} t={t} at={B.spend + 0.06} out={outB} size={28} variant="paper">
                  Total spend
                </Tag>
                <Bracket x0={r0[0]} y0={r0[1]} x1={r1[0]} y1={r1[1]} t={t} at={COUNT_AT} arm={22} thick={4} />
              </>
            );
          }}
        />

        {/* Shot B: what the panel is */}
        <div style={{ position: "absolute", left: 0, right: 0, top: 380, display: "flex", justifyContent: "center" }}>
          <SpringLetters text="MOOLANK 365" t={t} at={B.punch - 0.04} size={128} out={B.reddit - 0.14} tracking="-0.035em" />
        </div>
        <Tag x={528} y={566} t={t} at={B.punch + 0.12} out={B.reddit - 0.1} anchor="r" size={30}>
          Meta ads
        </Tag>
        <Tag x={552} y={566} t={t} at={B.date} out={B.reddit - 0.1} anchor="l" variant="glass" size={30}>
          1 to 4 Oct 2026
        </Tag>

        {/* Shot C: the Reddit number */}
        {t >= COUNT_AT && (
          <>
            {t >= B.hit && (
              <div style={{ position: "absolute", left: 540, top: numY, transform: "translate(-50%, -50%)" }}>
                {[0, 0.1].map((d, i) => {
                  const p = clamp01((t - B.hit - d) / 0.8);
                  if (p <= 0 || p >= 1) return null;
                  const size = lerp(260, 1500, ease.expo(p));
                  return (
                    <ChromeRing
                      key={i}
                      size={size}
                      thick={lerp(22, 3, p)}
                      rot={t * 120 + i * 90}
                      opacity={(1 - p) * (i === 0 ? 0.95 : 0.6)}
                      style={{ left: -size / 2, top: -size / 2, transform: i === 1 ? "rotateX(64deg)" : undefined }}
                    />
                  );
                })}
              </div>
            )}
            <div
              style={{
                position: "absolute",
                left: 540 - (NUMERAL_EM * numSize) / 2,
                top: numY - numSize * 0.48,
                transform: `perspective(1400px) rotateX(${(1 - rise) * 35}deg) scale(${numScale})`,
                transformOrigin: "50% 50%",
                opacity: clamp01(rise * 3),
              }}
            >
              <Numeral value={value} size={numSize} blurY={speed * 2.2} glow={glow} />
            </div>
            <Sparks cx={540} cy={numY} t={t} at={B.hit} seed="campspark" reach={620} />
          </>
        )}
        <div style={{ position: "absolute", left: 0, right: 0, top: 762, display: "flex", justifyContent: "center" }}>
          <SpringLetters text="REDDIT CLICKS" t={t} at={B.hit} size={80} color={theme2.lilac} tracking="0.04em" stagger={0.022} font={theme2.sans} />
        </div>
        <Tag x={540} y={912} t={t} at={B.from} anchor="c" variant="paper" size={58} style={{ letterSpacing: "0.02em" }}>
          <span style={{ fontSize: "0.62em", letterSpacing: "0.14em", opacity: 0.7, marginRight: 14, verticalAlign: "0.18em" }}>FROM</span>$59.17
        </Tag>
        <Tag x={540} y={412} t={t} at={B.tag} anchor="c" variant="glass" size={32} style={{ textTransform: "none", letterSpacing: "0.03em" }}>
          Reddit ads · iCreateEpic
        </Tag>
      </AbsoluteFill>

      <ChannelChips t={t} />

      <Sweep t={t} at={0.02} dur={0.6} />
      <Sweep t={t} at={pA - 0.05} dur={0.45} angle={-18} strength={0.22} />
      <Sweep t={t} at={B.hit - 0.04} dur={0.6} strength={0.32} width={420} />
      <Flash t={t} at={B.punch} dur={0.22} peak={0.14} />
      <Flash t={t} at={B.hit} dur={0.4} peak={0.42} />
      <Flash t={t} at={LEN - 0.22} dur={0.2} peak={0.3} />
    </AbsoluteFill>
  );
};
