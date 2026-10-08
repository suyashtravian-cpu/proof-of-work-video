import { AbsoluteFill, Easing, useCurrentFrame } from "remotion";
import { Scramble } from "../../fx/Scramble";
import { shakeAt } from "../../fx/shake";
import { AiCursor, type CursorKey } from "../kit/AiCursor";
import { Burst, Shockwave, SpeedLines } from "../kit/fx";
import { Slices } from "../kit/GlitchCut";
import { Thinking } from "../kit/Thinking";
import { C, clamp01, easeExpo, easeIn3, pop, prog, tween } from "../kit/util";
import { Postings, type Drawn } from "./hook/Postings";
import { affineFor, apply, camAt, CARD_AT, CARDS, FH, FW, HT, layout, roleOf, TRACKED } from "./hook/wall";

// 0.0–4.8  "Most brands hire four people for this. | I'm one person, with AI."
// ECU on a job posting → whip back to an endless wall of postings; a red HIRES NEEDED counter
// counts four roles (landing 04 on "four") → swing along the wall → FREEZE on "I'm" → the AI
// cursor strikes out `$ hire --team 4`, types `$ suyash --with ai`, thinks → on "AI." the wall
// glitches and every posting collapses into one card: Suyash Kashyap, four roles checked.

const TARGET = { x: 540, y: 790 }; // where the wall collapses and the one card lands

// ---------- terminal geometry (screen px) ----------
const TERM = { x: 80, y: 600, w: 920, head: 58, padX: 36, padY: 22, fs: 44, lh: 72 };
const CW = TERM.fs * 0.6; // JetBrains Mono advance
const LEFT = TERM.x + TERM.padX;
const lineY = (i: number) => TERM.y + TERM.head + TERM.padY + TERM.lh * (i + 0.5);
const caretX = (chars: number) => LEFT + chars * CW;
const CMD1 = "hire --team 4";
const CMD2 = "suyash --with ai";

const typed = (t: number, [a, b]: readonly [number, number], s: string) => s.slice(0, Math.floor(prog(t, a, b) * s.length + 1e-6));

// ---------- the agent's cursor ----------
const typingKeys = ([a, b]: readonly [number, number], s: string, row: number): CursorKey[] =>
  Array.from({ length: s.length }, (_, k) => ({
    t: a + ((b - a) * (k + 1)) / s.length,
    x: caretX(2 + k + 1) + 10,
    y: lineY(row) + 18,
    ease: (x: number) => x,
    type: k === 0 ? b - a + 0.04 : undefined,
  }));
const SEL_START = HT.freeze + 0.08;
const SEL_END = HT.strike - 0.02;
const PATH: CursorKey[] = [
  { t: HT.cursorIn, x: 1150, y: 1480 },
  { t: HT.click1, x: caretX(2) + 10, y: lineY(0) + 18, arc: -140, click: true },
  ...typingKeys(HT.type1, CMD1, 0),
  { t: SEL_START, x: caretX(2) - 4, y: lineY(0) + 6, down: true },
  { t: SEL_END, x: caretX(2 + CMD1.length) + 4, y: lineY(0) + 6, ease: Easing.inOut(Easing.cubic) },
  { t: SEL_END + 0.03, x: caretX(2 + CMD1.length) + 4, y: lineY(0) + 6, down: false },
  { t: HT.type2[0] - 0.02, x: caretX(2) + 10, y: lineY(1) + 18, click: true },
  ...typingKeys(HT.type2, CMD2, 1),
  { t: HT.enter, x: caretX(2 + CMD2.length) + 10, y: lineY(1) + 18, click: true },
  { t: HT.collapse - 0.02, x: caretX(2 + CMD2.length) + 40, y: lineY(1) + 60 },
  { t: HT.collapse + 0.2, x: TARGET.x + 60, y: TARGET.y + 40, ease: easeIn3 },
];

// ---------- pieces ----------
const Counter: React.FC<{ t: number }> = ({ t }) => {
  if (t < 0.46 || t > HT.term + 0.2) return null;
  const k = pop(t, 0.46, 0.24);
  const e = prog(t, HT.term, HT.term + 0.2, easeIn3);
  const n = HT.ticks.filter((a) => t >= a).length;
  const last = HT.ticks[n - 1] ?? 0;
  const punch = n > 0 ? Math.max(0, 1 - (t - last) / 0.18) : 0;
  return (
    <div
      style={{
        position: "absolute",
        left: 540,
        top: 300,
        transform: `translateX(-50%) translateY(${(1 - k) * 30 - e * 40}px) scale(${0.9 + 0.1 * k})`,
        opacity: clamp01(k * 2) * (1 - e),
        display: "flex",
        alignItems: "center",
        gap: 30,
        padding: "18px 30px 20px",
        background: "rgba(8,8,8,.9)",
        border: `1.5px solid ${n > 0 ? "rgba(255,59,47,.6)" : C.line}`,
        borderRadius: 16,
        boxShadow: `0 20px 60px rgba(0,0,0,.6), 0 0 ${40 * punch}px rgba(255,59,47,${0.5 * punch})`,
      }}
    >
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: C.mono, fontSize: 19, letterSpacing: "0.16em", color: "#ffffffa0" }}>
          <span style={{ width: 11, height: 11, borderRadius: 6, background: C.red, opacity: Math.floor(t * 4) % 2 ? 0.35 : 1 }} />
          HIRES NEEDED
        </div>
        <div style={{ fontFamily: C.sans, fontWeight: 800, fontSize: 132, lineHeight: 1, letterSpacing: "-0.04em", color: C.red, transform: `scale(${1 + 0.12 * punch})`, transformOrigin: "0% 60%" }}>
          <span style={{ opacity: 0.3 }}>0</span>
          {n}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 250, fontFamily: C.mono, fontSize: 23, letterSpacing: "0.08em", color: C.fg }}>
        {TRACKED.map((r, i) => (
          <div key={r.role} style={{ height: 30, opacity: t >= r.at ? 1 : 0.18, color: t >= r.at ? C.fg : C.dim }}>
            {t >= r.at ? <Scramble text={`${String(i + 1).padStart(2, "0")} ${r.role.toUpperCase()}`} at={r.at} dur={0.2} /> : `${String(i + 1).padStart(2, "0")} ·····`}
          </div>
        ))}
      </div>
    </div>
  );
};

/** Red corner brackets locked onto a counted posting. */
const Lock: React.FC<{ t: number; id: number; at: number; idx: number }> = ({ t, id, at, idx }) => {
  if (t < at || t >= HT.freeze) return null;
  const m = affineFor(camAt(t), CARDS[id].X, CARDS[id].Y);
  if (!m) return null;
  const k = prog(t, at, at + 0.2, easeExpo);
  const pts = [apply(m, 0, 0), apply(m, FW, 0), apply(m, 0, FH), apply(m, FW, FH)];
  const pad = 10 + (1 - k) * 46;
  const x0 = Math.min(...pts.map((p) => p.x)) - pad;
  const x1 = Math.max(...pts.map((p) => p.x)) + pad;
  const y0 = Math.min(...pts.map((p) => p.y)) - pad;
  const y1 = Math.max(...pts.map((p) => p.y)) + pad;
  const L = 24;
  const corner = (cx: number, cy: number, sx: number, sy: number) => <path d={`M${cx + sx * L},${cy} L${cx},${cy} L${cx},${cy + sy * L}`} fill="none" stroke={C.red} strokeWidth={4} />;
  return (
    <div style={{ position: "absolute", inset: 0, opacity: k }}>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        {corner(x0, y0, 1, 1)}
        {corner(x1, y0, -1, 1)}
        {corner(x0, y1, 1, -1)}
        {corner(x1, y1, -1, -1)}
      </svg>
      <div style={{ position: "absolute", left: x0, top: y0 - 32, fontFamily: C.mono, fontSize: 18, color: "#fff", background: C.red, padding: "2px 7px" }}>{String(idx + 1).padStart(2, "0")}</div>
    </div>
  );
};

const Terminal: React.FC<{ t: number }> = ({ t }) => {
  if (t < HT.term || t > HT.collapse + 0.14) return null;
  const k = pop(t, HT.term, 0.22);
  const g = prog(t, HT.collapse, HT.collapse + 0.12); // CRT collapse
  const l1 = typed(t, HT.type1, CMD1);
  const l2 = typed(t, HT.type2, CMD2);
  const strike = prog(t, HT.strike, HT.strike + 0.12, easeExpo);
  const selW = t >= SEL_START && t < SEL_END + 0.06 ? Easing.inOut(Easing.cubic)(clamp01((t - SEL_START) / (SEL_END - SEL_START))) * CMD1.length * CW : 0;
  const typing1 = t >= HT.type1[0] && t < HT.type1[1] + 0.05;
  const typing2 = t >= HT.type2[0] && t < HT.type2[1] + 0.05;
  const blink = Math.floor(t * 4) % 2 === 0;
  const row2 = t >= HT.strike + 0.08;
  const caretRow = t < HT.strike + 0.08 ? 0 : 1;
  const caretChars = caretRow === 0 ? 2 + l1.length : 2 + l2.length;
  const showCaret = t < HT.enter && (typing1 || typing2 || blink);
  const prompt = <span style={{ color: C.dim }}>$ </span>;
  return (
    <div
      style={{
        position: "absolute",
        left: TERM.x,
        top: TERM.y,
        width: TERM.w,
        transform: `translateY(${(1 - k) * 50}px) scale(${(0.94 + 0.06 * k) * (1 + g * 0.3)}, ${(0.94 + 0.06 * k) * (1 - g * 0.97)})`,
        transformOrigin: "50% 50%",
        opacity: clamp01(k * 2),
        background: "rgba(10,10,10,.95)",
        border: `1.5px solid ${C.line}`,
        borderRadius: 20,
        overflow: "hidden",
        boxShadow: "0 40px 100px rgba(0,0,0,.7)",
      }}
    >
      <div style={{ height: TERM.head, display: "flex", alignItems: "center", gap: 10, padding: "0 22px", borderBottom: `1.5px solid ${C.line}`, fontFamily: C.mono, fontSize: 18, letterSpacing: "0.1em", color: C.dim }}>
        {[C.red, "#4a4a4a", "#4a4a4a"].map((c, i) => (
          <span key={i} style={{ width: 13, height: 13, borderRadius: 7, background: c }} />
        ))}
        <span style={{ marginLeft: 12 }}>agent · ~/brand</span>
        <span style={{ marginLeft: "auto", color: C.red, opacity: t >= HT.freeze ? 1 : 0 }}>■ PAUSED</span>
      </div>
      <div style={{ position: "relative", padding: `${TERM.padY}px ${TERM.padX}px`, height: TERM.lh * 3, fontFamily: C.mono, fontSize: TERM.fs, lineHeight: `${TERM.lh}px`, whiteSpace: "pre", color: C.white }}>
        {/* selection */}
        {selW > 0 && <div style={{ position: "absolute", left: TERM.padX + 2 * CW, top: TERM.padY + 10, width: selW, height: TERM.lh - 20, background: "rgba(255,255,255,.22)" }} />}
        <div style={{ position: "relative", opacity: 1 - 0.55 * strike }}>
          {prompt}
          {l1}
          {strike > 0 && <span style={{ position: "absolute", left: 2 * CW - 6, top: TERM.lh / 2 - 3, height: 7, width: (CMD1.length * CW + 12) * strike, background: C.red, boxShadow: "0 0 12px rgba(255,59,47,.7)" }} />}
        </div>
        {row2 && (
          <div>
            {prompt}
            {l2}
          </div>
        )}
        {showCaret && <div style={{ position: "absolute", left: TERM.padX + caretChars * CW + 2, top: TERM.padY + caretRow * TERM.lh + 12, width: CW * 0.55, height: TERM.lh - 24, background: C.white }} />}
        {g > 0 && <div style={{ position: "absolute", inset: 0, background: "#fff", opacity: g }} />}
      </div>
    </div>
  );
};

const ROLES4 = ["Developer", "Designer", "Content creator", "Marketer"];

const OneCard: React.FC<{ t: number }> = ({ t }) => {
  if (t < CARD_AT) return null;
  const k = pop(t, CARD_AT, 0.28);
  const blur = Math.max(0, 1 - k) * 14;
  const push = prog(t, CARD_AT + 0.3, 4.8);
  return (
    <div
      style={{
        position: "absolute",
        left: TARGET.x,
        top: TARGET.y + 6 * Math.sin(t * 3),
        width: 740,
        transform: `translate(-50%, -50%) scale(${(0.25 + 0.75 * k) * (1 + 0.05 * push)}) rotate(${(1 - Math.min(1, k)) * -9 + 0.6 * Math.sin(t * 2.2)}deg)`,
        opacity: clamp01(k * 3),
        filter: blur > 0.4 ? `blur(${blur.toFixed(1)}px)` : undefined,
        background: C.paper,
        borderRadius: 26,
        padding: "34px 42px 40px",
        boxShadow: `0 50px 120px rgba(0,0,0,.7), 0 0 ${90 * (1 - Math.min(1, k))}px rgba(255,255,255,.5)`,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily: C.mono, fontSize: 18, letterSpacing: "0.14em", color: "#8a8983" }}>
        <span>ONE PERSON · WITH AI</span>
        <span style={{ display: "flex", alignItems: "center", gap: 8, color: C.red }}>
          <span style={{ width: 10, height: 10, borderRadius: 5, background: C.red }} />1 / 1
        </span>
      </div>
      <div style={{ fontFamily: C.sans, fontWeight: 800, fontSize: 80, lineHeight: 1.05, letterSpacing: "-0.05em", color: C.ink, marginTop: 10 }}>Suyash Kashyap</div>
      <div style={{ height: 2, background: "#dddbd4", margin: "24px 0 22px" }} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", rowGap: 18, columnGap: 20 }}>
        {ROLES4.map((r, i) => {
          const c = pop(t, CARD_AT + 0.14 + i * 0.07, 0.2);
          return (
            <div key={r} style={{ display: "flex", alignItems: "center", gap: 14, fontFamily: C.sans, fontWeight: 700, fontSize: 32, letterSpacing: "-0.02em", color: C.ink }}>
              <span
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 17,
                  flex: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: c > 0 ? C.red : "#dddbd4",
                  color: "#fff",
                  fontSize: 22,
                  transform: `scale(${0.6 + 0.4 * c})`,
                }}
              >
                {c > 0 ? "✓" : ""}
              </span>
              {r}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const Hook: React.FC = () => {
  const t = useCurrentFrame() / 30;
  const cam = camAt(t);
  const placed = t < HT.collapse + 0.5 ? layout(cam) : [];

  const halted = t >= HT.freeze;
  const drawn: Drawn[] = placed.map(({ card, m }) => {
    const tr = TRACKED.find((r) => r.id === card.id);
    const lit = tr && t >= tr.at && !halted ? 1 : 0;
    const c = apply(m, FW / 2, FH / 2);
    const dist = Math.hypot(c.x - 540, c.y - 960);
    const dt = t - HT.wave - dist / 4200;
    const pulse = halted ? 0 : Math.exp(-((dt / 0.1) ** 2));
    return { id: card.id, role: roleOf(card.id), m, s: { lit, pulse } };
  });
  const suck = (_id: number, cx: number, cy: number) => {
    if (t < HT.collapse) return 0;
    const d = clamp01(Math.hypot(cx - TARGET.x, cy - TARGET.y) / 1300);
    return prog(t, HT.collapse + 0.13 * d, HT.collapse + 0.13 * d + 0.22, easeIn3);
  };

  const [sx, sy, sr] = shakeAt(t, [HT.ticks[3], HT.freeze, HT.collapse, CARD_AT], 22, 0.3);
  const dim = tween(t, HT.freeze, HT.freeze + 0.06, 0, 0.68) * tween(t, HT.collapse, HT.collapse + 0.15, 1, 0.35);
  const whip = Math.sin(Math.PI * prog(t, HT.whip, HT.wide));
  const invert = (t >= HT.freeze && t < HT.freeze + 0.07) || (t >= HT.collapse && t < HT.collapse + 0.04);
  const core = t >= HT.collapse + 0.12 && t < CARD_AT + 0.06 ? prog(t, HT.collapse + 0.12, CARD_AT) : 0;
  const flash = Math.max(0, 1 - Math.abs(t - CARD_AT) / 0.1) * 0.75 + Math.max(0, 1 - Math.abs(t - HT.freeze) / 0.05) * 0.45;
  return (
    <AbsoluteFill style={{ overflow: "hidden", filter: invert ? "grayscale(1) invert(1)" : undefined }}>
      <AbsoluteFill style={{ transform: `translate(${sx}px, ${sy}px) rotate(${cam.roll + sr}deg)`, transformOrigin: "540px 960px" }}>
        <Postings cards={drawn} suck={suck} tx={TARGET.x} ty={TARGET.y} />
        {TRACKED.map((r, i) => (
          <Lock key={r.id} t={t} id={r.id} at={r.at} idx={i} />
        ))}
      </AbsoluteFill>
      {/* scrims: bottom keeps the captions legible from frame 0, top arrives with the counter; then the freeze dim */}
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(5,5,5,0) 0%, rgba(5,5,5,0) 56%, rgba(5,5,5,.82) 70%, rgba(5,5,5,.86) 100%)", opacity: 1 - prog(t, HT.collapse, HT.collapse + 0.3) }} />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(5,5,5,.75) 0%, rgba(5,5,5,.2) 26%, rgba(5,5,5,0) 40%)", opacity: prog(t, 0.3, 0.6) * (1 - prog(t, HT.collapse, HT.collapse + 0.3)) }} />
      <AbsoluteFill style={{ background: "#050505", opacity: dim }} />
      <SpeedLines t={t} amount={whip} dir={-1} seed="hkw" />
      <AbsoluteFill style={{ transform: `translate(${sx * 0.5}px, ${sy * 0.5}px)` }}>
        <Counter t={t} />
        <Terminal t={t} />
        <Thinking at={HT.think} dur={HT.collapse - HT.think - 0.02} x={LEFT} y={lineY(2) + 2} anchor="l" size={30} />
      </AbsoluteFill>
      {core > 0 && (
        <div
          style={{
            position: "absolute",
            left: TARGET.x - 8 - core * 34,
            top: TARGET.y - 8 - core * 34,
            width: 16 + core * 68,
            height: 16 + core * 68,
            borderRadius: "50%",
            background: "#fff",
            boxShadow: `0 0 ${40 + core * 120}px ${10 + core * 40}px rgba(255,255,255,.7), 0 0 ${80 + core * 160}px rgba(255,59,47,.6)`,
          }}
        />
      )}
      <Shockwave t={t} at={CARD_AT} cx={TARGET.x} cy={TARGET.y} size={0.8} />
      <Burst t={t} at={CARD_AT} cx={TARGET.x} cy={TARGET.y} count={90} seed="hkb" reach={0.8} />
      <OneCard t={t} />
      <AiCursor path={PATH} until={HT.collapse + 0.22} />
      <Slices at={[HT.freeze, HT.collapse, HT.collapse + 0.1]} />
      <AbsoluteFill style={{ background: "#fff", opacity: flash, pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};
