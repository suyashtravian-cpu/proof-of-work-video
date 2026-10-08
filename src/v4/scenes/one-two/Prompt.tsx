import { C, clamp01, easeInOut, lerp, pop, prog } from "../../kit/util";
import { TT } from "./beats";
import { FLYERS, flyerAt, P, P_CW, PROMPT, PROMPT_LEN, SEND, trioRect } from "./toolsLayout";

// The prompt panel the agent types into, and the morph: on `TT.morph` the panel splits into three
// card outlines while every glyph of the prompt flies. "quiz", "calculator" and "fit finder" land as
// the three card titles; the rest of the prompt dissolves into the card bodies (it becomes the UI).

/** Card i's outline finishes splitting off the panel at this time (the card itself takes over). */
export const ghostEnd = (i: number) => TT.morph + 0.2 + 0.03 * i;

export const PromptPanel: React.FC<{ t: number }> = ({ t }) => {
  if (t >= TT.morph + 0.12) return null;
  const n = Math.floor(prog(t, TT.type[0], TT.type[1]) * PROMPT_LEN + 1e-6);
  const l1 = PROMPT[0].slice(0, n);
  const l2 = PROMPT[1].slice(0, Math.max(0, n - PROMPT[0].length));
  const typing = t >= TT.type[0] && t < TT.type[1] + 0.05;
  const focused = t >= TT.focusInput;
  const caretOn = t < TT.send && (typing || Math.floor(t * 5) % 2 === 0) && focused;
  const caretRow = n > PROMPT[0].length ? 1 : 0;
  const caretCol = caretRow ? l2.length : l1.length;
  const sent = t >= TT.send;
  const press = sent ? Math.max(0, 1 - (t - TT.send) / 0.2) : 0;
  const ready = n >= PROMPT_LEN;
  const fade = 1 - prog(t, TT.morph, TT.morph + 0.1);
  const glow = focused ? 0.5 + 0.5 * prog(t, TT.focusInput, TT.focusInput + 0.15) : 0;
  return (
    <>
      {/* panel */}
      <div
        style={{
          position: "absolute",
          left: P.x,
          top: P.y,
          width: P.w,
          height: P.h,
          borderRadius: 26,
          background: C.panel,
          border: `1.5px solid ${focused ? `rgba(255,255,255,${0.14 + 0.2 * glow})` : C.line}`,
          boxShadow: `0 50px 120px rgba(0,0,0,.75), 0 0 ${40 * glow}px rgba(255,255,255,${0.06 * glow})`,
          opacity: fade,
        }}
      >
        <div style={{ height: P.head, display: "flex", alignItems: "center", gap: 14, padding: "0 30px", borderBottom: `1.5px solid ${C.line}`, fontFamily: C.mono, fontSize: 20, letterSpacing: "0.14em", color: C.dim }}>
          <span style={{ color: C.red, fontSize: 28 }}>›</span>
          PROMPT
          <span style={{ marginLeft: "auto", letterSpacing: "0.06em" }}>⌘ ↵</span>
        </div>
      </div>
      {/* the prompt text (hands over to the flyers on the morph) */}
      {t < TT.morph && (
        <div style={{ position: "absolute", left: P.left, top: P.top, fontFamily: C.mono, fontSize: P.fs, lineHeight: `${P.lh}px`, color: C.white, whiteSpace: "pre" }}>
          <div>{l1 || (focused ? "" : <span style={{ color: "#ffffff40" }}>What should we build?</span>)}</div>
          <div>{l2}</div>
          {caretOn && <div style={{ position: "absolute", left: caretCol * P_CW + 2, top: caretRow * P.lh + 12, width: 4, height: P.lh - 24, background: C.red }} />}
        </div>
      )}
      {/* send */}
      <div
        style={{
          position: "absolute",
          left: SEND.x - SEND.r,
          top: SEND.y - SEND.r,
          width: SEND.r * 2,
          height: SEND.r * 2,
          borderRadius: SEND.r,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: press > 0 ? C.red : ready ? C.white : "rgba(255,255,255,.16)",
          transform: `scale(${(1 - 0.14 * Math.sin(press * Math.PI)) * (1 + 0.12 * pop(t, TT.type[1], 0.2) * (1 - prog(t, TT.type[1] + 0.2, TT.type[1] + 0.3)))})`,
          opacity: fade,
        }}
      >
        <svg width={30} height={30} viewBox="0 0 24 24">
          <path d="M12 19 V5 M5 12 L12 5 L19 12" fill="none" stroke={press > 0 ? "#fff" : C.bg} strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </>
  );
};

/** The panel's outline splitting into the three card outlines. */
export const Ghosts: React.FC<{ t: number }> = ({ t }) => {
  if (t < TT.morph || t >= ghostEnd(2)) return null;
  return (
    <>
      {[0, 1, 2].map((i) => {
        if (t >= ghostEnd(i)) return null;
        const m = prog(t, TT.morph + 0.03 * i, ghostEnd(i), easeInOut);
        const r = trioRect(i);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: lerp(P.x, r.x, m),
              top: lerp(P.y, r.y, m),
              width: lerp(P.w, r.w, m),
              height: lerp(P.h, r.h, m),
              borderRadius: lerp(26, 22, m),
              background: C.panel,
              border: `1.5px solid rgba(255,255,255,${0.2 + 0.25 * Math.sin(Math.PI * m)})`,
              boxShadow: "0 40px 100px rgba(0,0,0,.6)",
            }}
          />
        );
      })}
    </>
  );
};

/** Every glyph of the prompt in flight. Title glyphs flash red mid-flight and land white. */
export const Flyers: React.FC<{ t: number; land: number }> = ({ t, land }) => {
  if (t < TT.morph || t >= land + 0.02) return null;
  return (
    <>
      {FLYERS.map((fl, i) => {
        const { p, x, y, rot } = flyerAt(fl, t);
        if (!fl.title && p >= 1) return null;
        const fs = fl.title ? lerp(P.fs, P.fs * 0.766, p) : lerp(P.fs, P.fs * 0.3, p);
        const hot = fl.title ? Math.sin(Math.PI * p) : 0;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              transform: `translate(-50%, -50%) rotate(${rot}deg)`,
              fontFamily: C.mono,
              fontSize: fs,
              lineHeight: 1,
              color: hot > 0.4 ? C.red : C.white,
              opacity: fl.title ? 1 : clamp01(1.4 - p * 1.4),
              textShadow: hot > 0.2 ? `0 0 ${16 * hot}px rgba(255,59,47,.8)` : undefined,
              whiteSpace: "pre",
            }}
          >
            {fl.ch}
          </div>
        );
      })}
    </>
  );
};
