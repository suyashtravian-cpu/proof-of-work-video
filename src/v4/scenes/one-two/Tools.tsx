import { cursorAt } from "../../kit/AiCursor";
import { ToolChip } from "../../kit/ToolChip";
import { C, clamp01, easeInOut, kick, lerp, pop, prog } from "../../kit/util";
import { TT } from "./beats";
import { ghostEnd } from "./Prompt";
import {
  CALC_UI,
  CARD,
  cardPose,
  chipX,
  FIT_UI,
  LENGTHS,
  optCenter,
  QUIZ_UI,
  SLIDER_DROP_X,
  SLIDER_GRAB_X,
  sliderX,
  TOOLS,
  TOOLS_CURSOR,
  V0,
  V1,
  WAISTS,
  wheel,
} from "./toolsLayout";

// The three coded mini-UIs the prompt became. Self-initiated concepts (tag CONCEPT, no brand names).
// Each is operated by the AI cursor as the voice names it; the calculator's number is EXAMPLE OUTPUT.

const BODY_TOP = 96;
const label: React.CSSProperties = { fontFamily: C.sans, fontWeight: 500, fontSize: 24, letterSpacing: "-0.01em", color: C.dim };

// ---------- quiz ----------
const QUESTIONS = [
  { q: "What's your hair type?", opts: ["Curly", "Wavy", "Straight"] },
  { q: "How often do you wash it?", opts: ["Daily", "Weekly", "Rarely"] },
  { q: "What's the main goal?", opts: ["Less frizz", "Volume", "Shine"] },
];
const PICK = [0, 1];

const QuizBody: React.FC<{ t: number }> = ({ t }) => {
  const swaps = TT.answers.map((a) => a + 0.14);
  const step = swaps.filter((s) => t >= s).length;
  const Q = QUESTIONS[step];
  const inK = step === 0 ? 1 : pop(t, swaps[step - 1], 0.2);
  const picking = step < 2 && t >= TT.answers[step] ? PICK[step] : -1;
  const fill = (k: number) => (k < step ? 1 : k === step && step < 2 ? prog(t, TT.answers[step], swaps[step]) : 0);
  return (
    <>
      <div style={{ position: "absolute", left: CARD.pad, top: 104, fontFamily: C.mono, fontSize: 22, letterSpacing: "0.08em", color: C.dim }}>Q{step + 1} / 5</div>
      <div style={{ position: "absolute", left: 170, right: CARD.pad, top: 112, display: "flex", gap: 10 }}>
        {[0, 1, 2, 3, 4].map((k) => (
          <div key={k} style={{ flex: 1, height: 10, borderRadius: 5, background: k === step ? "rgba(255,255,255,.32)" : "rgba(255,255,255,.12)", overflow: "hidden" }}>
            <div style={{ width: `${fill(k) * 100}%`, height: "100%", background: C.red, boxShadow: "0 0 10px rgba(255,59,47,.7)" }} />
          </div>
        ))}
      </div>
      <div
        style={{
          position: "absolute",
          left: CARD.pad,
          top: 134,
          fontFamily: C.sans,
          fontWeight: 700,
          fontSize: 34,
          lineHeight: 1.1,
          letterSpacing: "-0.02em",
          color: C.white,
          transform: `translateX(${(1 - inK) * 30}px)`,
          opacity: clamp01(inK * 2),
          whiteSpace: "nowrap",
        }}
      >
        {Q.q}
      </div>
      {Q.opts.map((o, k) => {
        const c = optCenter(k);
        const on = picking === k;
        const hit = on ? 1 - clamp01((t - TT.answers[step]) / 0.14) : 0;
        const ok = pop(t, (step === 0 ? 0 : swaps[step - 1]) + k * 0.04, 0.2);
        return (
          <div
            key={`${step}-${k}`}
            style={{
              position: "absolute",
              left: c.x - QUIZ_UI.optW / 2,
              top: QUIZ_UI.optY,
              width: QUIZ_UI.optW,
              height: QUIZ_UI.optH,
              borderRadius: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: C.sans,
              fontWeight: 700,
              fontSize: 26,
              letterSpacing: "-0.01em",
              color: on ? C.bg : C.fg,
              background: on ? (hit > 0.3 ? C.red : C.white) : "rgba(255,255,255,.07)",
              border: `1.5px solid ${on ? "transparent" : "rgba(255,255,255,.18)"}`,
              transform: `scale(${(0.9 + 0.1 * ok) * (1 - 0.06 * Math.sin(hit * Math.PI))})`,
              opacity: clamp01(ok * 2),
            }}
          >
            {o}
          </div>
        );
      })}
    </>
  );
};

// ---------- cost calculator ----------
const CalcBody: React.FC<{ t: number }> = ({ t }) => {
  const cur = cursorAt(TOOLS_CURSOR, t);
  const drag = t >= TT.grab && t <= TT.release;
  const v = t < TT.grab ? V0 : t > TT.release ? V1 : lerp(V0, V1, clamp01((cur.x - SLIDER_GRAB_X) / (SLIDER_DROP_X - SLIDER_GRAB_X)));
  const bottles = Math.round(2 + v * 12);
  const saved = (bottles * 156).toLocaleString("en-IN");
  const hx = sliderX(v);
  const lock = kick(t, TT.release, 0.08, 26, 9);
  return (
    <>
      <div style={{ ...label, position: "absolute", left: CALC_UI.x0, top: 108 }}>Bottles bought a week</div>
      {/* track */}
      <div style={{ position: "absolute", left: CALC_UI.x0, top: CALC_UI.y - 5, width: CALC_UI.x1 - CALC_UI.x0, height: 10, borderRadius: 5, background: "rgba(255,255,255,.14)" }} />
      <div style={{ position: "absolute", left: CALC_UI.x0, top: CALC_UI.y - 5, width: hx - CALC_UI.x0, height: 10, borderRadius: 5, background: C.red, boxShadow: "0 0 12px rgba(255,59,47,.6)" }} />
      {[0, 1, 2, 3, 4, 5, 6].map((k) => (
        <div key={k} style={{ position: "absolute", left: sliderX(k / 6) - 1, top: CALC_UI.y + 14, width: 2, height: 8, background: "rgba(255,255,255,.25)" }} />
      ))}
      {/* handle + value bubble */}
      <div style={{ position: "absolute", left: hx - 19, top: CALC_UI.y - 19, width: 38, height: 38, borderRadius: 19, background: C.white, boxShadow: `0 0 ${drag ? 26 : 10}px rgba(255,255,255,${drag ? 0.6 : 0.3})`, transform: `scale(${drag ? 1.15 : 1})` }} />
      <div style={{ position: "absolute", left: hx, top: CALC_UI.y - 58, transform: "translateX(-50%)", fontFamily: C.mono, fontSize: 24, color: C.white, background: "rgba(255,255,255,.1)", borderRadius: 8, padding: "2px 10px" }}>{bottles}</div>
      {/* output */}
      <div style={{ position: "absolute", left: 540, top: 100, display: "flex", alignItems: "baseline", gap: 12, transform: `scale(${1 + lock})`, transformOrigin: "0% 70%" }}>
        <span style={{ fontFamily: C.sans, fontWeight: 800, fontSize: 64, lineHeight: 1, letterSpacing: "-0.04em", color: C.white, fontVariantNumeric: "tabular-nums" }}>₹{saved}</span>
        <span style={{ ...label }}>saved / yr</span>
      </div>
      <div style={{ position: "absolute", left: 540, top: 186, fontFamily: C.mono, fontSize: 18, letterSpacing: "0.16em", color: C.fg, border: "1.5px solid rgba(255,255,255,.3)", borderRadius: 6, padding: "4px 10px" }}>EXAMPLE OUTPUT</div>
    </>
  );
};

// ---------- fit finder ----------
const Chip: React.FC<{ x: number; y: number; w: number; text: string; on: boolean; hit: number }> = ({ x, y, w, text, on, hit }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: w,
      height: FIT_UI.chipH,
      borderRadius: 12,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: C.sans,
      fontWeight: 700,
      fontSize: 24,
      color: on ? C.bg : C.fg,
      background: on ? (hit > 0.3 ? C.red : C.white) : "rgba(255,255,255,.07)",
      border: `1.5px solid ${on ? "transparent" : "rgba(255,255,255,.18)"}`,
      transform: `scale(${1 - 0.07 * Math.sin(hit * Math.PI)})`,
    }}
  >
    {text}
  </div>
);

const FitBody: React.FC<{ t: number }> = ({ t }) => {
  const hitOf = (a: number) => (t >= a ? 1 - clamp01((t - a) / 0.14) : 0);
  const rk = pop(t, TT.result, 0.24);
  return (
    <>
      {(["Waist", "Length"] as const).map((n, row) => (
        <div key={n} style={{ ...label, position: "absolute", left: CARD.pad, top: FIT_UI.rows[row], height: FIT_UI.chipH, display: "flex", alignItems: "center" }}>
          {n}
        </div>
      ))}
      {WAISTS.map((c, k) => (
        <Chip key={c.label} x={chipX(WAISTS, k)} y={FIT_UI.rows[0]} w={c.w} text={c.label} on={k === 1 && t >= TT.pickWaist} hit={k === 1 ? hitOf(TT.pickWaist) : 0} />
      ))}
      {LENGTHS.map((c, k) => (
        <Chip key={c.label} x={chipX(LENGTHS, k)} y={FIT_UI.rows[1]} w={c.w} text={c.label} on={k === 1 && t >= TT.pickLength} hit={k === 1 ? hitOf(TT.pickLength) : 0} />
      ))}
      <div style={{ position: "absolute", left: 640, top: 108, fontFamily: C.mono, fontSize: 18, letterSpacing: "0.16em", color: C.dim }}>YOUR FIT</div>
      <div
        style={{
          position: "absolute",
          left: 640,
          top: 140,
          display: "flex",
          alignItems: "center",
          gap: 10,
          fontFamily: C.sans,
          fontWeight: 800,
          fontSize: 34,
          letterSpacing: "-0.03em",
          whiteSpace: "nowrap",
          color: rk > 0 ? C.white : "rgba(255,255,255,.25)",
          transform: `scale(${rk > 0 ? 0.8 + 0.2 * rk : 1})`,
          transformOrigin: "0% 50%",
        }}
      >
        {rk > 0 ? (
          <>
            <span style={{ color: C.red }}>✓</span>32 / Regular
          </>
        ) : (
          "-- / --"
        )}
      </div>
    </>
  );
};

const BODIES = [QuizBody, CalcBody, FitBody];

const Card: React.FC<{ i: number; t: number; land: number }> = ({ i, t, land }) => {
  if (t < ghostEnd(i)) return null;
  const pose = cardPose(i, t);
  if (pose.op <= 0.01) return null;
  const tool = TOOLS[i];
  const r0 = TT.render[i];
  const done = r0 + TT.renderDur;
  const r = prog(t, r0, done, easeInOut);
  const { a } = wheel(t);
  const lit = a * clamp01(1 - Math.abs(pose.d));
  const tag = pop(t, done, 0.22);
  const Body = BODIES[i];
  return (
    <div
      style={{
        position: "absolute",
        left: 540 - CARD.w / 2,
        top: pose.cy - CARD.h / 2,
        width: CARD.w,
        height: CARD.h,
        transform: `perspective(1600px) rotateX(${pose.rx}deg) scale(${pose.s})`,
        opacity: pose.op,
        filter: pose.blur > 0.3 ? `blur(${pose.blur.toFixed(1)}px)` : undefined,
        zIndex: 10 - Math.round(Math.abs(pose.d) * 3),
        borderRadius: 28,
        background: C.panel,
        border: `1.5px solid rgba(255,255,255,${0.2 + 0.22 * lit})`,
        boxShadow: `0 40px 100px rgba(0,0,0,.65), 0 0 ${50 * lit}px rgba(255,255,255,${0.07 * lit})`,
      }}
    >
      {/* header: title (where the prompt's letters land) + CONCEPT */}
      <div style={{ position: "absolute", left: CARD.pad, top: CARD.titleTop, height: CARD.titleFs, display: "flex", alignItems: "center", gap: 22, opacity: t >= land ? 1 : 0 }}>
        <span style={{ fontFamily: C.mono, fontSize: CARD.titleFs, lineHeight: 1, color: C.white, whiteSpace: "pre" }}>{tool.title}</span>
        <span
          style={{
            fontFamily: C.mono,
            fontSize: 20,
            letterSpacing: "0.16em",
            color: C.fg,
            border: "1.5px solid rgba(255,255,255,.35)",
            borderRadius: 6,
            padding: "4px 10px",
            opacity: clamp01(tag * 2),
            transform: `scale(${0.7 + 0.3 * tag})`,
          }}
        >
          CONCEPT
        </span>
      </div>
      <ToolChip at={r0 - 0.06} resolve={TT.renderDur + 0.06} x={CARD.w - CARD.pad + 8} y={CARD.titleTop + CARD.titleFs / 2} anchor="r" size={24} name="render" arg={tool.arg} out={TT.chipsOut + 0.05 * i} />
      {/* body renders top to bottom behind a red scanline */}
      <div style={{ position: "absolute", left: 0, right: 0, top: BODY_TOP, bottom: 0, clipPath: `inset(0 0 ${((1 - r) * 100).toFixed(2)}% 0)` }}>
        <div style={{ position: "absolute", left: 0, top: -BODY_TOP, width: CARD.w, height: CARD.h }}>{r > 0 && <Body t={t} />}</div>
      </div>
      {r > 0 && r < 1 && <div style={{ position: "absolute", left: 16, right: 16, top: BODY_TOP + r * (CARD.h - BODY_TOP - 8), height: 3, background: C.red, boxShadow: "0 0 16px rgba(255,59,47,.9)" }} />}
      {/* a faint wireframe of the body while it waits to render */}
      {r < 1 && (
        <div style={{ position: "absolute", left: CARD.pad, right: CARD.pad, top: BODY_TOP + 16, bottom: 24, display: "flex", flexDirection: "column", gap: 14, opacity: 0.5, clipPath: `inset(${(r * 100).toFixed(2)}% 0 0 0)` }}>
          {[0.55, 0.85, 0.7].map((w, k) => (
            <div key={k} style={{ width: `${w * 100}%`, height: 12, borderRadius: 6, background: "rgba(255,255,255,.08)" }} />
          ))}
        </div>
      )}
    </div>
  );
};

export const ToolCards: React.FC<{ t: number; land: number }> = ({ t, land }) => (
  <>
    {[0, 1, 2].map((i) => (
      <Card key={i} i={i} t={t} land={land} />
    ))}
  </>
);
