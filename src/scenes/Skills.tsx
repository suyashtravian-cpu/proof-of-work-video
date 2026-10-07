import { AbsoluteFill, Easing, Img, interpolate, random, useCurrentFrame } from "remotion";
import { easeExpo, easeInOut, easeOut, tween } from "../components/anim";
import { Slam } from "../components/Slam";
import { fullPage } from "../footage";
import { FloatingCode } from "../fx/FloatingCode";
import { GridBg } from "../fx/GridBg";
import { Particles } from "../fx/Particles";
import { Scramble } from "../fx/Scramble";
import { shakeAt } from "../fx/shake";
import { theme } from "../theme";
import { CYAN, PlaneCam, planeTransform, projectRect } from "./skills-bet/plane";
import { TrackQuad } from "./skills-bet/TrackQuad";

export const SKILLS = ["AI-assisted building", "Product marketing", "Paid social", "Search ads", "SEO", "Content & copy", "Creative strategy"];
export const STRIKE_AT = (i: number) => 0.55 + i * 0.1;
const COLLAPSE_AT = 1.22;
const EXIT_AT = 1.46;
const PROOF_AT = 1.68;
const OF_AT = 2.12;

// Editor geometry
const ED_X = 60;
const ED_Y = 250;
const ED_W = 960;
const FS = 36;
const CW = FS * 0.6; // JetBrains Mono advance
const LH = 68;
const GUTTER = 78;

type Row = { text: string; kind: "comment" | "code" | "skill"; i?: number };
const ROWS: Row[] = [
  { text: "// skills.ts: the résumé way", kind: "comment" },
  { text: "const skills = [", kind: "code" },
  ...SKILLS.map((s, i): Row => ({ text: `  "${s}",`, kind: "skill", i })),
  { text: "];", kind: "code" },
  { text: "export default skills; // trust me", kind: "code" },
];

// Page fly-through: snap-scroll keys (time, page y under focus). Fast whips, slow holds.
const KEYS: [number, number][] = [
  [EXIT_AT, 260],
  [1.88, 1440],
  [2.2, 1545],
  [2.38, 2420],
  [2.62, 2520],
  [2.78, 3400],
  [3.3, 3520],
];
const scrollAt = (t: number) =>
  interpolate(
    t,
    KEYS.map((k) => k[0]),
    KEYS.map((k) => k[1]),
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) },
  );

const camAt = (t: number): PlaneCam => {
  const enter = tween(t, EXIT_AT, EXIT_AT + 0.4, 0, 1, easeExpo);
  return {
    d: 1400,
    rx: 66 - enter * 14,
    rz: -16 + enter * 5 + (t - EXIT_AT) * 2.2,
    s: 0.92,
    cx: 540 + Math.sin(t * 1.3) * 18,
    cy: 1150 + (1 - enter) * 1300,
    tz: -120,
    scroll: scrollAt(t),
    pageW: 1200,
  };
};

// Real sections of the full-page capture (page px): [x, y, w, h, label, from, until]
const TARGETS: [number, number, number, number, string, number, number, string?][] = [
  [50, 1585, 960, 300, "LIVE BUILD · BILTIB", 1.8, 2.28],
  [50, 2300, 1100, 720, "CONVERSION LAB · 4 CONCEPTS", 2.26, 2.72],
  [610, 3540, 540, 290, "112 READING-REVEAL EVENTS", 2.7, 3.3, theme.red],
];

const keyword = (s: string) =>
  s
    .split(/(const |export default |\/\/.*$)/)
    .filter(Boolean)
    .map((part, j) =>
      part === "const " || part === "export default " ? (
        <span key={j} style={{ color: CYAN }}>{part}</span>
      ) : part.startsWith("//") ? (
        <span key={j} style={{ color: theme.dim }}>{part}</span>
      ) : (
        <span key={j}>{part}</span>
      ),
    );

const Editor: React.FC<{ t: number }> = ({ t }) => {
  const struck = SKILLS.filter((_, i) => t >= STRIKE_AT(i)).length;
  const lastStruck = struck - 1;
  const blink = Math.floor(t * 4) % 2 === 0;
  let lineNo = 0;
  return (
    <div
      style={{
        width: ED_W,
        background: "linear-gradient(180deg, #121212, #0b0b0b)",
        border: "1.5px solid #ffffff2a",
        borderRadius: 18,
        boxShadow: `0 60px 140px rgba(0,0,0,.85), 0 0 0 1px #000, 0 0 80px ${CYAN}12`,
        overflow: "hidden",
      }}
    >
      {/* title bar */}
      <div style={{ height: 66, display: "flex", alignItems: "center", gap: 12, padding: "0 24px", borderBottom: "1px solid #ffffff18", background: "#161616" }}>
        {[theme.red, "#3a3a3a", "#3a3a3a"].map((c, i) => (
          <span key={i} style={{ width: 16, height: 16, borderRadius: 8, background: c }} />
        ))}
        <div style={{ marginLeft: 18, fontFamily: theme.mono, fontSize: 22, color: theme.fg, padding: "8px 16px", background: "#0b0b0b", borderRadius: 8, border: "1px solid #ffffff1c" }}>skills.ts</div>
        <div style={{ fontFamily: theme.mono, fontSize: 22, color: "#5c5b57", padding: "8px 12px", textDecoration: "line-through" }}>resume.pdf</div>
        <div style={{ marginLeft: "auto", fontFamily: theme.mono, fontSize: 22, color: struck ? theme.red : theme.dim, letterSpacing: "0.06em" }}>
          {struck ? `−${struck} lines` : "TS · UTF-8"}
        </div>
      </div>
      <div style={{ padding: "22px 0 26px" }}>
        {ROWS.map((r, ri) => {
          const isSkill = r.kind === "skill";
          const i = r.i ?? 0;
          const sAt = STRIKE_AT(i);
          const k = isSkill ? tween(t, sAt, sAt + 0.11, 0, 1, easeOut) : 0;
          const collapse = isSkill ? tween(t, COLLAPSE_AT + (SKILLS.length - 1 - i) * 0.028, COLLAPSE_AT + (SKILLS.length - 1 - i) * 0.028 + 0.09, 0, 1, easeInOut) : 0;
          const appear = tween(t, ri * 0.03, ri * 0.03 + 0.2, 0, 1, easeExpo);
          const jolt = isSkill && t >= sAt && t < sAt + 0.12 ? (random(`jolt${i}${Math.floor(t * 30)}`) - 0.5) * 22 : 0;
          if (!(isSkill && collapse >= 1)) lineNo++;
          const textW = r.text.length * CW;
          const cursorHere = isSkill ? i === lastStruck && t < COLLAPSE_AT : ri === ROWS.length - 1 && struck === 0;
          return (
            <div
              key={ri}
              style={{
                position: "relative",
                height: LH * (1 - collapse),
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                background: k > 0 ? `rgba(255,59,47,${0.16 * k * (1 - collapse)})` : undefined,
                opacity: appear,
                transform: `translateX(${(1 - appear) * 60 + jolt}px)`,
              }}
            >
              <div style={{ width: GUTTER, textAlign: "right", paddingRight: 22, boxSizing: "border-box", fontFamily: theme.mono, fontSize: 24, color: k > 0 ? theme.red : "#4a4a47" }}>
                {k > 0 ? "−" : lineNo}
              </div>
              <div style={{ position: "relative", fontFamily: theme.mono, fontSize: FS, whiteSpace: "pre", color: k > 0 ? "#77746e" : r.kind === "comment" ? theme.dim : theme.fg }}>
                {r.kind === "comment" ? r.text : keyword(r.text)}
                {isSkill && k > 0 && (
                  <div style={{ position: "absolute", left: CW * 2 - 6, top: "52%", height: 6, width: (textW - CW * 3 + 12) * k, background: theme.red, boxShadow: `0 0 18px ${theme.red}` }} />
                )}
                {isSkill && t >= sAt + 0.03 && (
                  <span style={{ color: theme.red }}>
                    {"  "}
                    <Scramble text="// deleted" at={sAt + 0.03} dur={0.14} seed={`del${i}`} />
                  </span>
                )}
                {cursorHere && <span style={{ display: "inline-block", width: CW, height: FS * 1.1, marginLeft: 4, verticalAlign: "middle", background: blink ? CYAN : "transparent" }} />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Lint output under the editor: one error per struck claim, newest at the bottom.
const Problems: React.FC<{ t: number }> = ({ t }) => {
  const errs = SKILLS.map((sk, i) => ({ sk, i, at: STRIKE_AT(i) })).filter((e) => t >= e.at);
  const shown = errs.slice(-4);
  return (
    <div style={{ width: ED_W, marginTop: 18, background: "#0d0d0d", border: "1.5px solid #ffffff22", borderRadius: 14, padding: "14px 22px", boxSizing: "border-box", height: 250, overflow: "hidden", fontFamily: theme.mono }}>
      <div style={{ display: "flex", gap: 18, fontSize: 20, letterSpacing: "0.12em", color: theme.dim, marginBottom: 10 }}>
        <span style={{ color: theme.fg }}>PROBLEMS</span>
        <span style={{ color: errs.length ? theme.red : theme.dim }}>{errs.length}</span>
        <span>OUTPUT</span>
        <span>TERMINAL</span>
      </div>
      {errs.length === 0 && <div style={{ fontSize: 23, color: "#5c5b57" }}>$ tsc --noEmit skills.ts</div>}
      {shown.map((e) => {
        const k = tween(t, e.at, e.at + 0.1, 0, 1, easeExpo);
        return (
          <div key={e.i} style={{ fontSize: 23, lineHeight: "44px", whiteSpace: "pre", opacity: k, transform: `translateX(${(1 - k) * 40}px)` }}>
            <span style={{ color: theme.red }}>error </span>
            <span style={{ color: "#5c5b57" }}>L{e.i + 3} </span>
            <span style={{ color: theme.fg }}>"{e.sk}"</span>
            <span style={{ color: theme.dim }}>: claim without proof</span>
          </div>
        );
      })}
    </div>
  );
};

// Speed lines whose length follows the page's scroll velocity (the speed ramp made visible).
const SpeedLines: React.FC<{ t: number; v: number }> = ({ t, v }) => {
  if (v < 8) return null;
  const a = Math.min(1, (v - 8) / 60);
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
      {Array.from({ length: 26 }, (_, i) => {
        const x = random(`sl${i}`) * 1080;
        const y = (random(`sly${i}`) * 2400 - ((t * 3200 * (0.6 + random(`slz${i}`))) % 2400) + 2400) % 2400 - 240;
        const len = 60 + v * 6 * (0.4 + random(`sll${i}`));
        return <line key={i} x1={x} y1={y} x2={x - len * 0.18} y2={y + len} stroke={i % 7 === 0 ? CYAN : theme.fg} strokeWidth={i % 3 === 0 ? 3 : 1.5} opacity={0.35 * a} />;
      })}
    </svg>
  );
};

// 28.1–31.4 (global 29.3–32.6)  "Not a list of skills." | "Proof of them." (kinetic)
export const Skills: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / 30;
  const struck = SKILLS.filter((_, i) => t >= STRIKE_AT(i)).length;
  const [sx, sy, sr] = shakeAt(t, [...SKILLS.map((_, i) => STRIKE_AT(i))], 5, 0.16);
  const [hx, hy, hr] = shakeAt(t, [PROOF_AT, OF_AT], 20, 0.3);

  // Editor in 3D: flies in from depth, drifts, then gets punched into the distance.
  const enter = tween(t, 0, 0.38, 0, 1, easeExpo);
  const exit = tween(t, EXIT_AT, EXIT_AT + 0.24, 0, 1, Easing.in(Easing.cubic));
  const edZ = -1300 * (1 - enter) - 2600 * exit;
  const edRY = -38 * (1 - enter) - 9 + t * 4 + exit * 30;
  const edRX = 18 * (1 - enter) + 6 - t * 1.6 + exit * 35;

  const page = t >= EXIT_AT;
  const cam = camAt(t);
  const v = Math.abs(scrollAt(t + 1 / 30) - scrollAt(t));
  const flash = Math.max(0, 1 - Math.abs(t - (EXIT_AT + 0.16)) / 0.08) * 0.55 + Math.max(0, 1 - (t - PROOF_AT) / 0.1) * (t >= PROOF_AT ? 0.25 : 0);
  const ghost = t >= PROOF_AT && t < PROOF_AT + 0.16 ? 1 - (t - PROOF_AT) / 0.16 : 0;

  return (
    <AbsoluteFill style={{ background: theme.bg, overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `translate(${sx + hx}px, ${sy + hy}px) rotate(${sr + hr}deg)` }}>
        {!page || t < EXIT_AT + 0.25 ? (
          <AbsoluteFill style={{ opacity: page ? 1 - tween(t, EXIT_AT, EXIT_AT + 0.25, 0, 1) : 1 }}>
            <GridBg opacity={0.1} speed={1.4} horizon={1250} />
            <FloatingCode count={22} opacity={0.12} seed="skills" speed={1.6} />
            <Particles count={40} opacity={0.3} seed="skp" />
          </AbsoluteFill>
        ) : null}

        {/* the page, flying past in depth */}
        {page && (
          <AbsoluteFill style={{ perspective: cam.d, perspectiveOrigin: "540px 960px" }}>
            <div style={{ position: "absolute", left: 0, top: 0, width: 1200, height: 9148, transformOrigin: "0 0", transform: planeTransform(cam), boxShadow: "0 0 200px rgba(255,255,255,.08)" }}>
              <Img src={fullPage} style={{ width: 1200, height: 9148, display: "block" }} />
              <div style={{ position: "absolute", inset: 0, background: "rgba(8,8,8,.28)" }} />
            </div>
          </AbsoluteFill>
        )}
        {page && (
          <AbsoluteFill
            style={{
              background:
                "linear-gradient(180deg, rgba(8,8,8,.97) 0%, rgba(8,8,8,.9) 30%, rgba(8,8,8,.55) 44%, rgba(8,8,8,0) 58%, rgba(8,8,8,0) 88%, rgba(8,8,8,.7) 100%)",
            }}
          />
        )}
        {page && t < 1.85 && (
          <div style={{ position: "absolute", left: 0, right: 0, top: 1380, height: 320, background: "linear-gradient(180deg, rgba(8,8,8,0), rgba(8,8,8,.88) 25%, rgba(8,8,8,.88) 75%, rgba(8,8,8,0))", opacity: 1 - tween(t, 1.7, 1.85, 0, 1) }} />
        )}
        {page && <SpeedLines t={t} v={v} />}
        {page && TARGETS.map(([x, y, w, h, label, a, b, col]) => <TrackQuad key={label} q={projectRect(cam, x, y, w, h)} at={a} until={b} label={label} color={col} />)}

        {/* the skills list, as literal code */}
        {t < EXIT_AT + 0.26 && (
          <AbsoluteFill style={{ perspective: 1700 }}>
            <div
              style={{
                position: "absolute",
                left: ED_X,
                top: ED_Y,
                transform: `translateZ(${edZ}px) rotateX(${edRX}deg) rotateY(${edRY}deg)`,
                opacity: 1 - tween(t, EXIT_AT + 0.12, EXIT_AT + 0.26, 0, 1),
              }}
            >
              <Editor t={t} />
              <Problems t={t} />
            </div>
          </AbsoluteFill>
        )}

        {/* "Proof of them." slams over the flying page */}
        {page && (
          <AbsoluteFill style={{ alignItems: "center", paddingTop: 300, textAlign: "center", textShadow: "0 12px 60px rgba(0,0,0,.95)" }}>
            <div style={{ position: "relative" }}>
              {ghost > 0 && (
                <>
                  <Slam at={PROOF_AT} size={300} color={theme.red} style={{ position: "absolute", left: 0, top: 0, transform: `translate(${-18 * ghost}px, ${6 * ghost}px)`, opacity: 0.8 * ghost, filter: "none" }}>
                    Proof
                  </Slam>
                  <Slam at={PROOF_AT} size={300} color={CYAN} style={{ position: "absolute", left: 0, top: 0, transform: `translate(${18 * ghost}px, ${-6 * ghost}px)`, opacity: 0.8 * ghost, filter: "none" }}>
                    Proof
                  </Slam>
                </>
              )}
              <Slam at={PROOF_AT} size={300} style={{ position: "relative", ...(t >= PROOF_AT + 0.28 ? { transform: `scale(${1 + (t - PROOF_AT - 0.28) * 0.035})` } : {}) }}>
                Proof
              </Slam>
            </div>
            <Slam at={OF_AT} size={160} style={{ marginTop: 4, ...(t >= OF_AT + 0.28 ? { transform: `scale(${1 + (t - OF_AT - 0.28) * 0.03})` } : {}) }}>
              of them<span style={{ color: theme.red }}>.</span>
            </Slam>
          </AbsoluteFill>
        )}
      </AbsoluteFill>

      {/* lint readout (stays clear of the HUD strip) */}
      <div style={{ position: "absolute", left: 60, right: 60, top: 150, display: "flex", gap: 26, alignItems: "center", fontFamily: theme.mono, fontSize: 24, letterSpacing: "0.1em", color: theme.fg }}>
        <span style={{ width: 12, height: 12, borderRadius: 6, background: page ? CYAN : theme.red, opacity: Math.floor(t * 6) % 2 ? 0.4 : 1 }} />
        {!page ? (
          <>
            <Scramble text="LINT skills.ts" at={0.05} dur={0.3} />
            <span style={{ color: theme.dim }}>CLAIMS</span>
            <span style={{ color: struck ? theme.red : theme.fg }}>{String(SKILLS.length - struck).padStart(2, "0")}</span>
            <span style={{ color: theme.dim }}>EVIDENCE</span>
            <span style={{ color: theme.red }}>00</span>
          </>
        ) : (
          <>
            <Scramble key="get" text="GET pilotaccess.com/proofofwork" at={EXIT_AT} dur={0.35} />
            <span style={{ marginLeft: "auto", color: CYAN }}>
              <Scramble key="live" text="EVIDENCE: LIVE" at={EXIT_AT + 0.2} dur={0.3} />
            </span>
          </>
        )}
      </div>

      <AbsoluteFill style={{ background: "#fff", opacity: flash, pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};
