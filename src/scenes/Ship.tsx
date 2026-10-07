import { AbsoluteFill, Img, random, useCurrentFrame } from "remotion";
import { easeExpo, easeInOut, easeOut, tween } from "../components/anim";
import { Callout } from "../fx/Callout";
import { FloatingCode } from "../fx/FloatingCode";
import { GridBg } from "../fx/GridBg";
import { Particles } from "../fx/Particles";
import { Scramble } from "../fx/Scramble";
import { shakeAt } from "../fx/shake";
import { fullPage } from "../footage";
import { theme } from "../theme";
import { Burst, Shockwave } from "./twist-ship/ShipFx";

const CYAN = "#33e1ff";
const IMPLODE = 1.4; // "talk" collapses into a point
const HIT = 1.7; // "I ship with it."
const END_AT = 2.9; // end card
const CORE = { x: 540, y: 760 };
const easeIn3 = (x: number) => x * x * x;

// "I don't just talk about AI." — typeset word by word.
const WORDS: { w: string; at: number; row: number; size: number; outline?: boolean; color?: string }[] = [
  { w: "I", at: 0.0, row: 0, size: 132, color: "#cfcec8" },
  { w: "don’t", at: 0.14, row: 0, size: 132, color: "#cfcec8" },
  { w: "just", at: 0.36, row: 0, size: 132, color: "#cfcec8" },
  { w: "talk", at: 0.55, row: 1, size: 330, outline: true },
  { w: "about", at: 0.85, row: 2, size: 150, color: "#cfcec8" },
  { w: "AI.", at: 1.02, row: 2, size: 150 },
];
const ROW_Y = [470, 610, 950];

const Word: React.FC<{ t: number; w: (typeof WORDS)[number] }> = ({ t, w }) => {
  if (t < w.at) return null;
  const k = tween(t, w.at, w.at + 0.22, 0, 1, easeExpo);
  const ch = Math.max(0, 1 - (t - w.at) / 0.25) * 14;
  const f = Math.floor(t * 15);
  const style: React.CSSProperties = {
    display: "inline-block",
    fontFamily: theme.sans,
    fontWeight: 800,
    fontSize: w.size,
    lineHeight: 1,
    letterSpacing: "-0.055em",
    marginRight: "0.22em",
    color: w.outline ? "transparent" : (w.color ?? theme.fg),
    WebkitTextStroke: w.outline ? `4px ${theme.fg}` : undefined,
    transform: `translateY(${(1 - k) * -50}px) scale(${1.6 - 0.6 * k})`,
    opacity: Math.min(1, k * 1.8),
    textShadow: ch > 0.5 ? `${-ch}px 0 ${theme.red}, ${ch}px 0 ${CYAN}` : undefined,
  };
  if (!w.outline) return <span style={style}>{w.w}</span>;
  // "talk": hollow, and every letter chatters.
  return (
    <span style={{ ...style, marginRight: 0 }}>
      {[...w.w].map((c, i) => (
        <span key={i} style={{ display: "inline-block", transform: `translateY(${(random(`ty${i}${f}`) - 0.5) * 14}px) rotate(${(random(`tr${i}${f}`) - 0.5) * 7}deg)` }}>
          {c}
        </span>
      ))}
    </span>
  );
};

const Talk: React.FC<{ t: number }> = ({ t }) => {
  const imp = tween(t, IMPLODE, HIT - 0.02, 0, 1, easeIn3);
  if (imp >= 1) return null;
  const blah = "blah · blah · hot take · thread 1/12 · blah · ".repeat(4);
  const bk = tween(t, 0.55, 0.8, 0, 1, easeOut);
  return (
    <div style={{ position: "absolute", inset: 0, transformOrigin: `${CORE.x}px ${CORE.y}px`, transform: `scale(${1 - imp * 0.98}) rotate(${imp * 14}deg)`, opacity: 1 - imp * 0.6 }}>
      {[560, 990].map((y, i) => (
        <div key={y} style={{ position: "absolute", top: y, left: 0, whiteSpace: "nowrap", fontFamily: theme.mono, fontSize: 26, letterSpacing: "0.1em", color: "#ffffff", opacity: 0.16 * bk, transform: `translateX(${(i ? -1 : 1) * (t * 220) - 600}px)` }}>
          {blah}
        </div>
      ))}
      {[0, 1, 2].map((row) => (
        <div key={row} style={{ position: "absolute", left: 0, right: 0, top: ROW_Y[row], textAlign: "center", whiteSpace: "nowrap" }}>
          {WORDS.filter((w) => w.row === row).map((w) => (
            <Word key={w.w} t={t} w={w} />
          ))}
        </div>
      ))}
    </div>
  );
};

// Deploy log typed underneath the talk; it finishes exactly on the hit.
const DEPLOY = [
  { at: 0.08, text: "$ git push origin main", cmd: true },
  { at: 0.45, text: "→ build    proofofwork ............ ok" },
  { at: 0.72, text: "→ 3 live builds · 4 concepts · 10 experiments" },
  { at: 0.98, text: "→ deploy   pilotaccess.com/proofofwork" },
];

const Deploy: React.FC<{ t: number }> = ({ t }) => {
  const k = tween(t, 0.0, 0.3, 0, 1, easeExpo);
  const out = tween(t, END_AT - 0.1, END_AT + 0.2, 0, 1);
  const p = tween(t, 1.08, HIT, 0, 1, (x) => 1 - (1 - x) ** 1.6);
  const done = t >= HIT;
  const pop = tween(t, HIT, HIT + 0.25, 0, 1, easeExpo);
  const bars = 26;
  return (
    <div
      style={{
        position: "absolute",
        left: 40,
        right: 40,
        top: 1330,
        height: 420,
        borderRadius: 18,
        background: "rgba(11,11,11,.95)",
        border: `1px solid ${done ? "#ffffff55" : "#ffffff22"}`,
        boxShadow: done ? `0 0 ${80 * (1 - pop) + 30}px rgba(255,59,47,${0.25 + 0.4 * (1 - pop)})` : "0 30px 80px rgba(0,0,0,.6)",
        overflow: "hidden",
        opacity: k * (1 - out),
        transform: `translateY(${(1 - k) * 80 + out * 120}px)`,
      }}
    >
      <div style={{ height: 46, display: "flex", alignItems: "center", gap: 9, padding: "0 18px", background: "#151515", borderBottom: "1px solid #ffffff14", fontFamily: theme.mono, fontSize: 16, color: "#8c8b86" }}>
        {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
          <div key={c} style={{ width: 12, height: 12, borderRadius: 6, background: c }} />
        ))}
        <span style={{ marginLeft: 12 }}>deploy — proof-of-work</span>
      </div>
      <div style={{ padding: "16px 26px", fontFamily: theme.mono, fontSize: 25, lineHeight: "44px" }}>
        {DEPLOY.filter((l) => t >= l.at).map((l, i) => {
          const chars = Math.round(tween(t, l.at, l.at + (l.cmd ? 0.3 : 0.14), 0, l.text.length, (x) => x));
          return (
            <div key={i} style={{ whiteSpace: "pre", color: l.cmd ? theme.fg : "#9a9a94" }}>
              {l.text.slice(0, chars)}
            </div>
          );
        })}
        {t >= 1.08 && (
          <div style={{ whiteSpace: "pre", color: "#cfcec8" }}>
            {"  "}
            <span style={{ color: done ? theme.fg : CYAN }}>{"█".repeat(Math.round(p * bars))}</span>
            <span style={{ color: "#333" }}>{"█".repeat(bars - Math.round(p * bars))}</span>
            {`  ${Math.round(p * 100)}%`}
          </div>
        )}
        {done && (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 18,
              marginTop: 10,
              padding: "6px 22px 8px",
              borderRadius: 10,
              background: theme.red,
              color: "#fff",
              fontFamily: theme.sans,
              fontWeight: 800,
              fontSize: 54,
              letterSpacing: "-0.03em",
              transform: `scale(${1.5 - 0.5 * pop})`,
              transformOrigin: "0% 50%",
            }}
          >
            ✓ shipped
            <span style={{ fontFamily: theme.mono, fontWeight: 500, fontSize: 22, letterSpacing: "0.04em", opacity: 0.9 }}>pilotaccess.com/proofofwork</span>
          </div>
        )}
      </div>
    </div>
  );
};

const ShipLine: React.FC<{ t: number }> = ({ t }) => {
  if (t < HIT || t > END_AT + 0.3) return null;
  const k = tween(t, HIT, HIT + 0.2, 0, 1, easeExpo);
  const wob = Math.sin((t - HIT) * 38) * Math.exp(-(t - HIT) * 9) * 0.06;
  const push = tween(t, HIT + 0.2, END_AT, 0, 0.07, easeInOut);
  const ch = Math.max(0, 1 - (t - HIT) / 0.4) * 22;
  const out = tween(t, END_AT - 0.08, END_AT + 0.22, 0, 1, easeIn3);
  const glitch = (t > 2.38 && t < 2.46) || (t > END_AT - 0.1 && t < END_AT + 0.2);
  const text: React.CSSProperties = {
    fontFamily: theme.sans,
    fontWeight: 800,
    fontSize: 236,
    lineHeight: 0.94,
    letterSpacing: "-0.06em",
    color: theme.fg,
    textShadow: ch > 0.5 ? `${-ch}px 0 ${theme.red}, ${ch}px 0 ${CYAN}, 0 0 60px rgba(255,255,255,.25)` : "0 0 60px rgba(255,255,255,.18)",
    whiteSpace: "nowrap",
  };
  const block = (
    <div style={{ textAlign: "center" }}>
      <div style={text}>
        I <span style={{ color: theme.red }}>ship</span>
      </div>
      <div style={text}>with it.</div>
    </div>
  );
  const f = Math.floor(t * 30);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 520, transform: `scale(${(2.3 - 1.3 * k) * (1 + wob + push) + out * 0.8})`, opacity: Math.min(1, k * 3) * (1 - out), transformOrigin: "50% 45%" }}>
      {glitch
        ? [0, 1, 2, 3, 4].map((i) => {
            const y0 = i * 20;
            const dx = (random(`sg${f}${i}`) - 0.5) * 120;
            return (
              <div key={i} style={{ position: i ? "absolute" : "relative", inset: i ? 0 : undefined, clipPath: `inset(${y0}% 0 ${100 - y0 - 20}% 0)`, transform: `translateX(${dx}px)` }}>
                {block}
              </div>
            );
          })
        : block}
    </div>
  );
};

const URL = "pilotaccess.com/proofofwork";

const EndCard: React.FC<{ t: number }> = ({ t }) => {
  if (t < END_AT) return null;
  const e = (a: number, d = 0.35) => tween(t, END_AT + a, END_AT + a + d, 0, 1, easeExpo);
  const pill = e(0.7, 0.4);
  const since = t - (END_AT + 0.7);
  const pulse = since > 0.4 ? Math.sin((since - 0.4) * Math.PI * 2 * 1.1) * 0.025 : 0;
  const press = tween(t, 4.55, 4.6, 0, 1) * (1 - tween(t, 4.6, 4.8, 0, 1));
  const browser = e(0.15, 0.6);
  const scroll = tween(t, END_AT + 0.35, 5.4, 0, 5400, easeInOut); // whip through the whole site, land on the 10 experiments
  const nameRgb = Math.max(0, 1 - (t - END_AT - 0.1) / 0.5) * 10;
  // cursor glides in from the lower right and clicks the link
  const cx = tween(t, 3.95, 4.5, 1180, 860, easeInOut);
  const cy = tween(t, 3.95, 4.5, 1250, 600, easeInOut);
  return (
    <AbsoluteFill>
      {/* the live site, scrolling, tilted back in depth */}
      <div style={{ position: "absolute", left: 70, top: 760, width: 940, height: 1060, perspective: 1800, opacity: browser, transform: `translateY(${(1 - browser) * 500}px)` }}>
        <div style={{ position: "absolute", inset: 0, transform: `rotateX(${16 - browser * 4 + tween(t, 3.3, 5.5, 0, -4)}deg)`, transformOrigin: "50% 100%", borderRadius: "18px 18px 0 0", overflow: "hidden", border: "1px solid #ffffff2a", borderBottom: 0, background: "#111", boxShadow: "0 -20px 120px rgba(255,255,255,.06)" }}>
          <div style={{ height: 44, display: "flex", alignItems: "center", gap: 9, padding: "0 16px", background: "#161616", borderBottom: "1px solid #ffffff14" }}>
            {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
              <div key={c} style={{ width: 12, height: 12, borderRadius: 6, background: c }} />
            ))}
            <div style={{ marginLeft: 16, flex: 1, height: 28, borderRadius: 8, background: "#0c0c0c", color: "#bdbcb6", fontFamily: theme.mono, fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>🔒 {URL}</div>
          </div>
          <Img src={fullPage} style={{ width: 940, display: "block", transform: `translateY(${-scroll}px)` }} />
          <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(8,8,8,.12) 0%, rgba(8,8,8,.12) 35%, rgba(8,8,8,.95) 82%, #080808 100%)" }} />
        </div>
      </div>
      {/* identity */}
      <div style={{ position: "absolute", top: 196, left: 0, right: 0, textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 14, fontFamily: theme.mono, fontSize: 24, letterSpacing: "0.3em", color: theme.dim, opacity: e(0) }}>
          <span style={{ width: 12, height: 12, borderRadius: 6, background: theme.red, opacity: Math.floor(t * 3) % 2 ? 0.35 : 1 }} />
          <Scramble text="PROOF OF WORK" at={END_AT} dur={0.35} />
        </div>
        <div
          style={{
            fontFamily: theme.sans,
            fontWeight: 800,
            fontSize: 116,
            letterSpacing: "-0.055em",
            lineHeight: 1.05,
            color: theme.fg,
            marginTop: 14,
            textShadow: nameRgb > 0.5 ? `${-nameRgb}px 0 ${theme.red}, ${nameRgb}px 0 ${CYAN}` : undefined,
            transform: `scale(${1.15 - 0.15 * e(0.05, 0.5)})`,
          }}
        >
          <Scramble text="Suyash Kashyap" at={END_AT + 0.05} dur={0.55} />
        </div>
        <div style={{ fontFamily: theme.sans, fontWeight: 500, fontSize: 42, letterSpacing: "-0.01em", color: "#cfcec8", marginTop: 12 }}>
          {["AI builder.", "Marketer.", "Perpetually curious."].map((w, i) => {
            const k = e(0.32 + i * 0.13, 0.3);
            return (
              <span key={w} style={{ display: "inline-block", marginRight: i < 2 ? "0.32em" : 0, opacity: k, transform: `translateY(${(1 - k) * 26}px)`, color: i === 2 ? theme.fg : undefined }}>
                {w}
              </span>
            );
          })}
        </div>
      </div>
      {/* the link */}
      <div style={{ position: "absolute", top: 530, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <div style={{ position: "relative", opacity: Math.min(1, pill * 2), transform: `scale(${(0.6 + 0.4 * pill) * (1 + pulse - press * 0.06)})` }}>
          {pill >= 1 &&
            [0, 0.45].map((off) => {
              const p = (((since - 0.4 + off) % 0.9) + 0.9) % 0.9 / 0.9;
              return <div key={off} style={{ position: "absolute", inset: -p * 34, borderRadius: 80, border: `2px solid ${theme.fg}`, opacity: (1 - p) * 0.5 }} />;
            })}
          <div style={{ position: "relative", fontFamily: theme.mono, fontSize: 38, color: theme.bg, background: theme.fg, padding: "22px 38px", borderRadius: 60, whiteSpace: "nowrap", boxShadow: `0 0 ${50 + press * 60}px rgba(255,255,255,${0.25 + press * 0.3})` }}>
            {URL}{" "}
            <span style={{ display: "inline-block", transform: `translate(${Math.max(0, Math.sin(t * 7)) * 5}px, ${-Math.max(0, Math.sin(t * 7)) * 5}px)` }}>↗</span>
          </div>
        </div>
      </div>
      <Callout x={128} y={528} w={824} h={92} at={END_AT + 0.95} label="LIVE NOW" color={theme.red} />
      {/* receipts */}
      <div style={{ position: "absolute", top: 668, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 14 }}>
        {["3 LIVE BUILDS", "4 BRAND CONCEPTS", "10 EXPERIMENTS"].map((c, i) => {
          const k = e(0.85 + i * 0.1, 0.3);
          return (
            <div key={c} style={{ fontFamily: theme.mono, fontSize: 21, letterSpacing: "0.1em", color: theme.fg, border: "1px solid #ffffff3a", background: "rgba(8,8,8,.7)", borderRadius: 30, padding: "9px 18px", opacity: k, transform: `translateY(${(1 - k) * 20}px) scale(${0.9 + 0.1 * k})` }}>
              <Scramble text={c} at={END_AT + 0.85 + i * 0.1} dur={0.3} />
            </div>
          );
        })}
      </div>
      {/* cursor */}
      {t > 3.95 && (
        <svg width={44} height={56} viewBox="0 0 22 28" style={{ position: "absolute", left: cx, top: cy, transform: `scale(${1 - press * 0.15})`, filter: "drop-shadow(0 6px 10px rgba(0,0,0,.6))" }}>
          <path d="M1 1 L1 22 L6.5 16.5 L10 26 L13.5 24.5 L10 15.5 L18 15.5 Z" fill="#fff" stroke="#000" strokeWidth={1.4} strokeLinejoin="round" />
        </svg>
      )}
      {t > 4.55 && t < 5.0 && (
        <div style={{ position: "absolute", left: 860 - 60 * (1 + (t - 4.55) * 4), top: 600 - 60 * (1 + (t - 4.55) * 4), width: 120 * (1 + (t - 4.55) * 4), height: 120 * (1 + (t - 4.55) * 4), borderRadius: "50%", border: `3px solid ${theme.fg}`, opacity: 1 - (t - 4.55) / 0.45 }} />
      )}
    </AbsoluteFill>
  );
};

// 0.0–1.4 "I don't just talk about AI."  1.7–2.9 "I ship with it."  2.9– end card
export const Ship: React.FC = () => {
  const t = useCurrentFrame() / 30;
  const [sx, sy, sr] = shakeAt(t, [0.55, HIT, HIT + 0.08], t < HIT ? 10 : 42, 0.45);
  const flash = Math.max(0, 1 - Math.abs(t - HIT) / 0.2) * (t >= HIT ? 0.9 : 0) + Math.max(0, 1 - Math.abs(t - END_AT) / 0.07) * 0.14;
  const imp = tween(t, IMPLODE, HIT, 0, 1, easeIn3);
  const core = t >= IMPLODE && t < HIT ? imp : 0;
  const dark = t >= IMPLODE && t < HIT ? imp * 0.6 : 0;
  return (
    <AbsoluteFill style={{ background: theme.bg, overflow: "hidden" }}>
      <GridBg opacity={t < END_AT ? 0.1 : 0.14} speed={t >= HIT && t < END_AT ? 6 : 1.5} horizon={t < END_AT ? 1240 : 1000} />
      <FloatingCode count={t < END_AT ? 18 : 26} opacity={t < END_AT ? 0.07 : 0.1} seed="ship" speed={t >= HIT && t < END_AT ? 3 : 1} />
      <Particles count={50} opacity={0.3} seed="shp" />
      <AbsoluteFill style={{ background: "#000", opacity: dark }} />
      <AbsoluteFill style={{ transform: `translate(${sx}px, ${sy}px) rotate(${sr}deg)` }}>
        {t >= HIT && t < END_AT + 0.3 && (
          <AbsoluteFill style={{ background: `radial-gradient(circle at ${CORE.x}px ${CORE.y}px, rgba(255,59,47,${0.22 * Math.max(0.35, 1 - (t - HIT) / 0.8)}) 0%, rgba(8,8,8,0) 55%)` }} />
        )}
        <Shockwave t={t} at={HIT} cx={CORE.x} cy={CORE.y} />
        <Talk t={t} />
        {core > 0 && (
          <div style={{ position: "absolute", left: CORE.x - 6 - core * 30, top: CORE.y - 6 - core * 30, width: 12 + core * 60, height: 12 + core * 60, borderRadius: "50%", background: "#fff", boxShadow: `0 0 ${40 + core * 120}px ${10 + core * 40}px rgba(255,255,255,.7)` }} />
        )}
        <Deploy t={t} />
        <ShipLine t={t} />
        <Burst t={t} at={HIT} cx={CORE.x} cy={CORE.y} />
        <EndCard t={t} />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "#fff", opacity: flash, pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};
