import { AbsoluteFill, Easing, OffthreadVideo, random, useCurrentFrame } from "remotion";
import { easeExpo, easeInOut, easeOut, tween, useSpringAt } from "../components/anim";
import { PhoneFrame } from "../components/PhoneFrame";
import { clip, fullPage } from "../footage";
import { GridBg } from "../fx/GridBg";
import { Particles } from "../fx/Particles";
import { Scramble } from "../fx/Scramble";
import { shakeAt } from "../fx/shake";
import { sec } from "../timing";
import { theme } from "../theme";
import { CYAN } from "./skills-bet/plane";

const PH_W = 440;
const PH_H = (PH_W * 844) / 390 + 30;
const CY = 845; // phone centre on screen
const RECEDE_AT = 2.55; // orbit backs off for the PDF beat
const PDF_AT = 2.85;
const SHRINK_AT = 3.55;
const TYPE_AT = 3.92;
const DELETE_AT = 4.32;
const WHIP_AT = 4.62;
const P = 1500; // orbit perspective

// Orbiting crops of the real site (page px in the full-page capture).
type Card = { crop: [number, number, number, number]; label: string; a: number; yo: number };
const CARDS: Card[] = [
  { crop: [60, 1594, 506, 280], label: "LIVE · BILTIB", a: 0.35, yo: -300 },
  { crop: [620, 3540, 530, 300], label: "META ADS · 112 EVENTS", a: 1.4, yo: 250 },
  { crop: [60, 6910, 340, 290], label: "EXPERIMENT · ATLAS AI", a: 2.45, yo: -140 },
  { crop: [116, 2320, 204, 140], label: "CONCEPT · THE WHOLE TRUTH", a: 3.5, yo: 330 },
  { crop: [426, 7250, 340, 290], label: "EXPERIMENT · HOMEWARD", a: 4.55, yo: -360 },
  { crop: [1020, 1594, 180, 280], label: "LIVE · ICREATEEPIC", a: 5.6, yo: 120 },
];
const CARD_H = 172;

const STATS: { value: number; label: string; sub?: string }[] = [
  { value: 3, label: "LIVE BUILDS" },
  { value: 4, label: "BRAND CONCEPTS" },
  { value: 10, label: "EXPERIMENTS" },
  { value: 1999, label: "REDDIT CLICKS", sub: "FROM $59.17" },
];

const SiteCrop: React.FC<{ crop: [number, number, number, number]; w: number; h: number }> = ({ crop, w, h }) => {
  const [x, y, cw] = crop;
  const f = w / cw;
  return (
    <div
      style={{
        width: w,
        height: h,
        backgroundImage: `url(${fullPage})`,
        backgroundSize: `${1200 * f}px ${9148 * f}px`,
        backgroundPosition: `${-x * f}px ${-y * f}px`,
        backgroundRepeat: "no-repeat",
      }}
    />
  );
};

type Placed = { c: Card; i: number; sx: number; sy: number; k: number; z: number; th: number; front: boolean };

const OrbitCard: React.FC<{ p: Placed; t: number; pcx: number; alpha: number }> = ({ p, t, pcx, alpha }) => {
  const { c, i, sx, sy, k, th } = p;
  const w = (CARD_H * c.crop[2]) / c.crop[3];
  const ghost = p.front ? Math.max(0, 1 - Math.abs(sx - pcx) / 330) : 0;
  const dark = p.front ? 0 : Math.min(0.6, Math.max(0, -Math.cos(th)) * 0.6);
  const labelAt = 0.4 + i * 0.09;
  return (
    <div
      style={{
        position: "absolute",
        left: sx,
        top: sy,
        transform: `translate(-50%, -50%) scale(${k}) perspective(900px) rotateY(${-Math.sin(th) * 32}deg) rotateZ(${Math.sin(th * 1.7 + i) * 3}deg)`,
        opacity: alpha * (1 - ghost * 0.72),
      }}
    >
      <div style={{ position: "relative", borderRadius: 10, overflow: "hidden", border: "1.5px solid #ffffff55", boxShadow: "0 24px 60px rgba(0,0,0,.7)" }}>
        <SiteCrop crop={c.crop} w={w} h={CARD_H} />
        {dark > 0 && <div style={{ position: "absolute", inset: 0, background: `rgba(8,8,8,${dark})` }} />}
      </div>
      {t >= labelAt && (
        <div style={{ position: "absolute", left: 0, top: -34, fontFamily: theme.mono, fontSize: 18, letterSpacing: "0.1em", whiteSpace: "pre", color: theme.bg, background: c.label.startsWith("LIVE") ? theme.fg : CYAN, padding: "3px 8px" }}>
          <Scramble text={c.label} at={labelAt} dur={0.35} />
        </div>
      )}
    </div>
  );
};

const Pdf: React.FC<{ t: number }> = ({ t }) => {
  const f = Math.floor(t * 30);
  const glitch = t >= DELETE_AT && t < DELETE_AT + 0.2;
  const body = (dx = 0, tint?: string) => (
    <div style={{ position: "absolute", left: dx, top: 0, width: 250, height: 324, background: tint ?? theme.paper, borderRadius: 10, padding: 28, boxSizing: "border-box", boxShadow: tint ? undefined : "0 30px 70px rgba(0,0,0,.7)", mixBlendMode: tint ? "screen" : undefined, opacity: tint ? 0.75 : 1 }}>
      {!tint && (
        <>
          <div style={{ fontFamily: theme.sans, fontWeight: 800, fontSize: 30, color: theme.ink, letterSpacing: "-0.03em", marginBottom: 6 }}>Résumé</div>
          <div style={{ height: 3, background: theme.ink, marginBottom: 16 }} />
          {[86, 70, 92, 60, 80, 52, 74].map((w, i) => (
            <div key={i} style={{ height: 10, width: `${w}%`, borderRadius: 3, background: i % 3 === 0 ? "#9a9890" : "#d2d0c8", marginBottom: 14 }} />
          ))}
          <div style={{ position: "absolute", right: -16, bottom: 26, background: theme.red, color: "#fff", fontFamily: theme.mono, fontSize: 30, padding: "8px 16px", borderRadius: 6 }}>PDF</div>
        </>
      )}
    </div>
  );
  if (!glitch) return <div style={{ position: "relative", width: 250, height: 324 }}>{body()}</div>;
  // glitch-delete: torn horizontal slices + chroma ghosts
  return (
    <div style={{ position: "relative", width: 250, height: 324 }}>
      {body(-14 + random(`pg${f}r`) * 8, theme.red)}
      {body(14 - random(`pg${f}c`) * 8, CYAN)}
      {Array.from({ length: 7 }, (_, i) => {
        const top = (i * 324) / 7;
        const off = (random(`ps${f}${i}`) - 0.5) * 120;
        return (
          <div key={i} style={{ position: "absolute", left: off, top, width: 250, height: 324 / 7 + 1, overflow: "hidden" }}>
            <div style={{ position: "absolute", left: 0, top: -top, width: 250, height: 324 }}>{body()}</div>
          </div>
        );
      })}
    </div>
  );
};

// 31.4–36.5 (global 32.6–37.7)  "If I'm asking you to bet on what I can do..." | "you should get more than a PDF."
export const Bet: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / 30;
  const enter = useSpringAt(0, 15, 0.8);
  const pdfIn = useSpringAt(PDF_AT, 12, 0.6);
  const recede = tween(t, RECEDE_AT, RECEDE_AT + 0.5, 0, 1, easeInOut) * (1 - tween(t, WHIP_AT, WHIP_AT + 0.4, 0, 1, easeOut));
  const slide = tween(t, RECEDE_AT, RECEDE_AT + 0.45, 0, 1, easeInOut);
  const shrink = tween(t, SHRINK_AT, SHRINK_AT + 0.5, 0, 1, easeInOut);
  const grow = tween(t, SHRINK_AT, SHRINK_AT + 0.7, 0, 1, easeExpo);
  const punch = t >= DELETE_AT ? Math.max(0, 1 - (t - DELETE_AT) / 0.16) : 0;
  const [sx, sy, sr] = shakeAt(t, [DELETE_AT], 22, 0.32);
  const [ex, ey] = shakeAt(t, [0.05], 10, 0.25);

  // phone
  const phX = slide * 125;
  const pcx = 540 + phX;
  const phScale = (0.5 + 0.5 * enter) * (1 + 0.1 * grow) * (1 + punch * 0.03);
  const phRotY = -50 * (1 - enter) + 8 * Math.cos(t * 1.15) - slide * 6;
  const phRotX = 26 * (1 - enter) + 4 + Math.sin(t * 0.9) * 2;

  // orbit
  const spin = 2.2 * (1 - Math.exp(-2.4 * t)) + 0.72 * t + tween(t, WHIP_AT, 5.1, 0, 2.4, Easing.in(Easing.cubic));
  const R = (40 + 340 * tween(t, 0.05, 0.6, 0, 1, easeExpo)) * (1 + recede * 0.3);
  const placed: Placed[] = CARDS.map((c, i) => {
    const th = c.a + spin;
    const x = R * Math.sin(th);
    const z = 360 * Math.cos(th) - recede * 650;
    const y = c.yo * (1 + recede * 0.1) + 50 * Math.cos(th);
    const k = P / (P - z);
    return { c, i, th, z, k, front: z > 0, sx: pcx + x * k, sy: CY + y * k };
  }).sort((a, b) => a.z - b.z);
  const cardAlpha = tween(t, 0.05, 0.3, 0, 1) * (1 - recede * 0.8);

  // PDF placement (left of the phone), shrinking then deleted
  const pdfScale = pdfIn * (1 - 0.84 * shrink) * (1 + Math.sin(t * 9) * 0.01);
  const pdfX = 215;
  const pdfY = 800 + shrink * 40;
  const pdfRot = -7 + shrink * 22 + Math.sin(t * 2) * 2;
  const pdfGone = t >= DELETE_AT + 0.2;
  const boxW = 250 * pdfScale;
  const boxH = 324 * pdfScale;
  const pdfLabel = t >= DELETE_AT ? "DELETED" : t >= SHRINK_AT + 0.15 ? "SMALLER. STILL A PDF." : "RESUME.PDF · STATIC";
  const typed = "$ rm resume.pdf";
  const nTyped = Math.round(tween(t, TYPE_AT, DELETE_AT - 0.04, 0, typed.length));

  return (
    <AbsoluteFill style={{ background: theme.bg, overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `translate(${sx + ex}px, ${sy + ey}px) rotate(${sr}deg)` }}>
        <GridBg opacity={0.12} speed={1.2} horizon={1240} />
        <Particles count={50} opacity={0.32} seed="betp" />
        <div style={{ position: "absolute", left: pcx - 520, top: CY - 620, width: 1040, height: 1240, background: `radial-gradient(closest-side, ${CYAN}22, rgba(51,225,255,0) 70%)`, opacity: 0.6 + grow * 0.4 }} />

        {/* data links from the phone to every card */}
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: cardAlpha }}>
          {placed.map((p) => (
            <g key={p.i}>
              <line x1={pcx} y1={CY} x2={p.sx} y2={p.sy} stroke={CYAN} strokeWidth={1.5} strokeDasharray="6 10" strokeDashoffset={-t * 90} opacity={0.4} />
              <circle cx={p.sx} cy={p.sy} r={4} fill={CYAN} opacity={0.8} />
            </g>
          ))}
        </svg>

        {placed.filter((p) => !p.front).map((p) => (
          <OrbitCard key={p.i} p={p} t={t} pcx={pcx} alpha={cardAlpha} />
        ))}

        <PhoneFrame width={PH_W} x={phX} y={CY - 960 + (1 - enter) * 900} rotateY={phRotY} rotateX={phRotX} scale={phScale} glare={((t * 0.35) % 1.6) - 0.2} glow={0.4 + grow * 0.6}>
          <OffthreadVideo src={clip("mobile")} trimBefore={sec(9.6)} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </PhoneFrame>

        {placed.filter((p) => p.front).map((p) => (
          <OrbitCard key={p.i} p={p} t={t} pcx={pcx} alpha={cardAlpha} />
        ))}

        {/* LIVE tag riding above the phone */}
        {t >= PDF_AT && (
          <div
            style={{
              position: "absolute",
              left: pcx,
              top: 272,
              transform: `translateX(-50%) scale(${tween(t, PDF_AT, PDF_AT + 0.25, 0.6, 1, easeExpo)})`,
              display: "flex",
              alignItems: "center",
              gap: 12,
              fontFamily: theme.mono,
              fontSize: 22,
              letterSpacing: "0.08em",
              color: theme.fg,
              background: "rgba(8,8,8,.75)",
              border: `1.5px solid ${theme.fg}`,
              padding: "8px 16px",
              whiteSpace: "pre",
            }}
          >
            <span style={{ width: 12, height: 12, borderRadius: 6, background: theme.red, opacity: Math.floor(t * 4) % 2 ? 0.35 : 1 }} />
            <Scramble text="LIVE · pilotaccess.com/proofofwork" at={PDF_AT} dur={0.4} />
          </div>
        )}

        {/* the PDF: shrunk, then glitch-deleted */}
        {t >= PDF_AT && !pdfGone && (
          <div style={{ position: "absolute", left: pdfX, top: pdfY, transform: `translate(-50%, -50%) rotate(${pdfRot}deg) scale(${pdfScale})` }}>
            <Pdf t={t} />
          </div>
        )}
        {t >= PDF_AT + 0.1 && t < DELETE_AT + 0.5 && (
          <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: t >= DELETE_AT + 0.3 ? 1 - (t - DELETE_AT - 0.3) / 0.2 : 1 }}>
            {[
              [-1, -1],
              [1, -1],
              [1, 1],
              [-1, 1],
            ].map(([dx, dy], i) => {
              const pad = 22;
              const x = pdfX + dx * (boxW / 2 + pad);
              const y = pdfY + dy * (boxH / 2 + pad);
              const L = 22;
              const col = t >= DELETE_AT ? theme.red : CYAN;
              return <path key={i} d={`M${x - dx * L},${y} L${x},${y} L${x},${y - dy * L}`} fill="none" stroke={col} strokeWidth={3} />;
            })}
          </svg>
        )}
        {t >= PDF_AT + 0.1 && t < DELETE_AT + 0.5 && (
          <div
            style={{
              position: "absolute",
              left: Math.max(40, pdfX - boxW / 2 - 22),
              top: pdfY - boxH / 2 - 22 - 40,
              fontFamily: theme.mono,
              fontSize: 25,
              letterSpacing: "0.08em",
              whiteSpace: "pre",
              color: theme.bg,
              background: t >= DELETE_AT ? theme.red : CYAN,
              padding: "5px 12px",
            }}
          >
            <Scramble key={pdfLabel} text={pdfLabel} at={pdfLabel === "DELETED" ? DELETE_AT : pdfLabel.startsWith("SMALLER") ? SHRINK_AT + 0.15 : PDF_AT + 0.1} dur={0.25} />
          </div>
        )}
        {/* pixel debris */}
        {t >= DELETE_AT + 0.05 && t < DELETE_AT + 0.75 && (
          <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
            {Array.from({ length: 34 }, (_, i) => {
              const d = t - DELETE_AT - 0.05;
              const ang = random(`deb${i}`) * Math.PI * 2;
              const sp = 160 + random(`dsp${i}`) * 520;
              const s = 4 + random(`dsz${i}`) * 10;
              const x = pdfX + Math.cos(ang) * sp * d;
              const y = pdfY + Math.sin(ang) * sp * d + 300 * d * d;
              const col = [theme.paper, theme.red, CYAN][i % 3];
              return <rect key={i} x={x} y={y} width={s} height={s} fill={col} opacity={Math.max(0, 1 - d / 0.7)} />;
            })}
          </svg>
        )}

        {/* terminal: rm resume.pdf */}
        {t >= TYPE_AT - 0.1 && (
          <div
            style={{
              position: "absolute",
              left: 48,
              top: 1010,
              width: 320,
              padding: "14px 18px",
              boxSizing: "border-box",
              background: "rgba(10,10,10,.85)",
              border: "1.5px solid #ffffff30",
              borderRadius: 10,
              fontFamily: theme.mono,
              fontSize: 25,
              lineHeight: 1.5,
              color: theme.fg,
              whiteSpace: "pre",
              transform: `translateY(${(1 - tween(t, TYPE_AT - 0.1, TYPE_AT + 0.1, 0, 1, easeExpo)) * 30}px)`,
              opacity: tween(t, TYPE_AT - 0.1, TYPE_AT + 0.05, 0, 1),
              boxShadow: "0 20px 50px rgba(0,0,0,.6)",
            }}
          >
            <div>
              {typed.slice(0, nTyped)}
              {t < DELETE_AT && <span style={{ background: Math.floor(t * 8) % 2 ? CYAN : "transparent" }}> </span>}
            </div>
            {t >= DELETE_AT + 0.04 && <div style={{ color: theme.red }}>deleted.</div>}
            {t >= DELETE_AT + 0.32 && (
              <div style={{ color: theme.dim }}>
                <Scramble text="// won't be missed" at={DELETE_AT + 0.32} dur={0.3} />
              </div>
            )}
          </div>
        )}
      </AbsoluteFill>

      {/* HUD stat ticks (above the phone, below the HUD strip) */}
      <div style={{ position: "absolute", left: 50, right: 50, top: 128, display: "flex", justifyContent: "space-between" }}>
        {STATS.map((s, i) => {
          const at = 0.25 + i * 0.15;
          const k = tween(t, at, at + 0.2, 0, 1, easeExpo);
          const n = Math.round(tween(t, at, at + 0.55, 0, s.value, easeOut));
          const landed = t >= at + 0.55;
          return (
            <div key={s.label} style={{ width: 236, opacity: k, transform: `translateY(${(1 - k) * -24}px)`, borderLeft: `2px solid ${landed ? theme.fg : "#ffffff40"}`, paddingLeft: 14 }}>
              <div style={{ fontFamily: theme.sans, fontWeight: 800, fontSize: 64, lineHeight: 1, letterSpacing: "-0.04em", color: theme.fg }}>{n.toLocaleString("en-US")}</div>
              <div style={{ fontFamily: theme.mono, fontSize: 17, letterSpacing: "0.12em", color: theme.dim, marginTop: 8 }}>
                <Scramble text={s.label} at={at} dur={0.4} />
              </div>
              {s.sub && <div style={{ fontFamily: theme.mono, fontSize: 15, letterSpacing: "0.12em", color: CYAN, marginTop: 4 }}>{t >= at + 0.55 ? s.sub : ""}</div>}
            </div>
          );
        })}
      </div>

      <AbsoluteFill style={{ background: "#fff", opacity: punch * 0.28, pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};
