import { AbsoluteFill, useCurrentFrame } from "remotion";
import { easeExpo, easeInOut, easeOut, tween } from "../components/anim";
import { CodeLine } from "../components/Code";
import { Callout } from "../fx/Callout";
import { FloatingCode } from "../fx/FloatingCode";
import { GridBg } from "../fx/GridBg";
import { Particles } from "../fx/Particles";
import { Scramble } from "../fx/Scramble";
import { shakeAt } from "../fx/shake";
import { CODE_FILES } from "../generated/code";
import { LINES } from "../script";
import { SFX } from "../sfx";
import { SCENES } from "../timeline";
import { TOTAL_SECONDS, sec } from "../timing";
import { theme } from "../theme";
import { Bet } from "./Bet";
import { Hook } from "./Hook";
import { Prompt } from "./Prompt";
import { Proof } from "./Proof";
import { Resume } from "./Resume";
import { Skills } from "./Skills";
import { Ide } from "./twist-ship/Ide";
import { Mini } from "./twist-ship/Mini";
import { fmtTc, Nle, NLE_H, NLE_W } from "./twist-ship/Nle";

const CYAN = "#33e1ff";
const START = SCENES.find((s) => s.name === "Twist")!.from;
const sceneLen = (name: string) => {
  const s = SCENES.find((x) => x.name === name)!;
  return s.to - s.from;
};

// Real earlier scenes, frozen on a poster frame (scene-relative seconds).
const SLOTS: { Scene: React.FC; name: string; at: number }[] = [
  { Scene: Hook, name: "Hook", at: 1.5 },
  { Scene: Resume, name: "Résumé", at: 4.6 },
  { Scene: Prompt, name: "Prompt", at: 2.3 },
  { Scene: Proof, name: "Proof", at: 2.3 },
  { Scene: Skills, name: "Skills", at: 2.0 },
  { Scene: Bet, name: "Bet", at: sceneLen("Bet") - 2 / 30 },
];
const S = 0.25; // thumbnail scale: 270 × 480
const TW = 1080 * S;
const TH = 1920 * S;
const PITCH = 300;

// Beats (scene-relative seconds)
const REWIND = 0.42; // zoom-out done, tape starts rewinding
const LANDED = 1.2; // rewind lands on frame 0
const NOW_AT = 1.22; // playhead whips forward to the real current time
const OUT = 1.5; // strip leaves, timeline rises
const STAMP = 1.95; // "never opened"
const FLIP = 2.3; // timeline flips over: it's code
const IDE_AT = 3.25; // "AI wrote the whole edit, in code."

const focusAt = (t: number) => (t < LANDED ? tween(t, REWIND, LANDED, 5, 0, easeInOut) : tween(t, LANDED, OUT - 0.02, 0, 3, easeInOut));
const zoomAt = (t: number) =>
  t < REWIND ? tween(t, 0, REWIND, 4, 1, easeExpo) : t < LANDED ? tween(t, REWIND, LANDED, 1, 0.9) : tween(t, LANDED, OUT - 0.02, 0.9, 0.5, easeInOut);
const tcAt = (t: number) => {
  if (t < REWIND) return START;
  if (t < LANDED) return tween(t, REWIND, LANDED, START, 0, easeInOut);
  return tween(t, NOW_AT, NOW_AT + 0.22, 0, START + t, easeExpo);
};

const FilmStrip: React.FC<{ t: number }> = ({ t }) => {
  const z = zoomAt(t);
  const focus = focusAt(t);
  const v = Math.abs(focusAt(t + 1 / 30) - focus) * 30;
  const cy = tween(t, 0, REWIND, 960, 520, easeExpo);
  const exit = tween(t, OUT, OUT + 0.35, 0, 1, Easing2);
  const slots = [...SLOTS.map((s) => s.name), "NOW"];
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        transform: `translate(540px, ${cy - exit * 1300}px) perspective(1600px) rotateX(${exit * 38}deg) scale(${z})`,
        opacity: 1 - exit,
        filter: v > 2 ? `blur(${Math.min(5, (v - 2) * 0.7)}px)` : undefined,
      }}
    >
      <div style={{ position: "absolute", transform: `translateX(${-focus * PITCH}px)` }}>
        {/* film base + sprockets */}
        <div
          style={{
            position: "absolute",
            left: -PITCH,
            top: -TH / 2 - 56,
            width: PITCH * (slots.length + 1),
            height: TH + 112,
            background: "#111",
            borderTop: "1px solid #ffffff1c",
            borderBottom: "1px solid #ffffff1c",
          }}
        >
          {[10, TH + 70].map((y) => (
            <div key={y} style={{ position: "absolute", left: 0, right: 0, top: y, height: 30, backgroundImage: "repeating-linear-gradient(90deg, #2b2b2b 0 22px, transparent 22px 44px)", borderRadius: 4 }} />
          ))}
        </div>
        {slots.map((name, k) => {
          const dist = Math.abs(k - focus) * PITCH * z;
          if (dist > 540 + TW * z) return null;
          const slotT = k < SCENES.length ? SCENES[k].from : START;
          const isNow = name === "NOW";
          return (
            <div key={name} style={{ position: "absolute", left: k * PITCH - TW / 2, top: -TH / 2, width: TW, height: TH }}>
              {isNow ? (
                <div style={{ width: TW, height: TH, boxSizing: "border-box", border: `4px dashed ${theme.red}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, background: "#160807" }}>
                  <div style={{ fontFamily: theme.sans, fontWeight: 800, fontSize: 190, color: theme.red, lineHeight: 0.9 }}>?</div>
                  <div style={{ fontFamily: theme.mono, fontSize: 22, letterSpacing: "0.14em", color: theme.fg }}>THIS VIDEO</div>
                </div>
              ) : (
                <div style={{ outline: `2px solid ${Math.round(focus) === k && t > REWIND ? theme.fg : "#ffffff30"}` }}>
                  <Mini Scene={SLOTS[k].Scene} frame={Math.max(0, Math.round(SLOTS[k].at * 30))} scale={S} label={name} />
                </div>
              )}
              <div style={{ position: "absolute", left: 0, right: 0, top: TH + 72, display: "flex", justifyContent: "space-between", fontFamily: theme.mono, fontSize: 17, letterSpacing: "0.08em", color: isNow ? theme.red : "#9a9a94" }}>
                <span>
                  {String(k + 1).padStart(2, "0")} {name.toUpperCase()}
                </span>
                <span>{fmtTc(slotT)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

function Easing2(x: number) {
  return x * x * x;
}

const RewindHud: React.FC<{ t: number }> = ({ t }) => {
  if (t < 0.25 || t > OUT + 0.15) return null;
  const k = tween(t, 0.25, 0.45, 0, 1, easeExpo) * (1 - tween(t, OUT, OUT + 0.15, 0, 1));
  const rewinding = t < LANDED;
  const speed = Math.round(tween(t, REWIND, (REWIND + LANDED) / 2, 1, 32, easeInOut) * (t < (REWIND + LANDED) / 2 ? 1 : tween(t, (REWIND + LANDED) / 2, LANDED, 1, 0.25)));
  return (
    <div style={{ position: "absolute", left: 60, right: 60, top: 850, display: "flex", alignItems: "baseline", justifyContent: "space-between", opacity: k, fontFamily: theme.mono }}>
      <div style={{ fontSize: 40, letterSpacing: "0.06em", color: rewinding ? theme.fg : theme.red }}>
        {rewinding ? `◀◀ REWIND ×${Math.max(1, speed)}` : <Scramble text="▶ THIS VIDEO" at={NOW_AT} dur={0.25} />}
      </div>
      <div style={{ fontSize: 40, color: rewinding ? "#cfcec8" : theme.red }}>{fmtTc(tcAt(t))}</div>
    </div>
  );
};

const timelineCode = (CODE_FILES.find((f) => f.name === "timeline.ts")?.text ?? "").split("\n");
const sceneLines = timelineCode.map((l, i) => (/name: "/.test(l) ? i : -1)).filter((i) => i >= 0);
const twistLine = timelineCode.findIndex((l) => /"Twist"/.test(l));

const CodeBack: React.FC<{ t: number }> = ({ t }) => {
  const sweep = tween(t, FLIP + 0.5, FLIP + 0.85, 0, sceneLines.length - 1, easeOut);
  const cur = sceneLines[Math.round(sweep)] ?? -1;
  const landed = t >= FLIP + 0.85;
  return (
    <div style={{ width: NLE_W, height: 790, borderRadius: 18, background: "#0b0b0b", border: "1px solid #ffffff26", overflow: "hidden", boxShadow: "0 40px 90px rgba(0,0,0,.7)" }}>
      <div style={{ height: 52, display: "flex", alignItems: "center", gap: 10, padding: "0 18px", background: "#151515", borderBottom: "1px solid #ffffff14", fontFamily: theme.mono, fontSize: 18, color: "#bdbcb6" }}>
        {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
          <div key={c} style={{ width: 12, height: 12, borderRadius: 6, background: c }} />
        ))}
        <span style={{ marginLeft: 10, color: theme.fg }}>src/timeline.ts</span>
        <span style={{ marginLeft: "auto", color: CYAN }}>{timelineCode.length} lines</span>
      </div>
      <div style={{ padding: "14px 0" }}>
        {timelineCode.slice(0, 21).map((l, i) => {
          const hot = i === cur && !landed;
          const me = landed && i === twistLine;
          return (
            <div key={i} style={{ position: "relative", display: "flex", alignItems: "center", height: 34, fontSize: 21.5, background: me ? "rgba(255,59,47,.18)" : hot ? "rgba(51,225,255,.14)" : undefined, borderLeft: `4px solid ${me ? theme.red : hot ? CYAN : "transparent"}` }}>
              <span style={{ width: 52, textAlign: "right", paddingRight: 16, color: me ? theme.red : "#444", fontFamily: theme.mono, flexShrink: 0 }}>{i + 1}</span>
              <CodeLine text={l} />
              {me && (
                <span style={{ position: "absolute", right: 16, fontFamily: theme.mono, fontSize: 18, color: "#fff", background: theme.red, padding: "3px 10px", borderRadius: 5 }}>
                  <Scramble text="◀ THIS SCENE" at={FLIP + 0.85} dur={0.25} />
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const TimelinePanel: React.FC<{ t: number }> = ({ t }) => {
  if (t < 0.28) return null;
  const enter = tween(t, 0.28, 0.62, 0, 1, easeExpo);
  const rise = tween(t, OUT, OUT + 0.38, 0, 1, easeInOut);
  const top = 950 + (1 - enter) * 500 - rise * 740;
  const flip = tween(t, FLIP, FLIP + 0.42, 0, 180, easeInOut);
  const through = tween(t, IDE_AT - 0.12, IDE_AT + 0.18, 0, 1, Easing2);
  const head = tcAt(t);
  const nowLabel = t >= NOW_AT + 0.1 ? "NOW" : undefined;
  const hot = t >= NOW_AT ? Math.max(0, 1 - (t - NOW_AT) / 0.4) : 0;
  const stamp = tween(t, STAMP, STAMP + 0.16, 0, 1, easeExpo);
  return (
    <div
      style={{
        position: "absolute",
        left: (1080 - NLE_W) / 2,
        top,
        width: NLE_W,
        opacity: enter * (1 - through),
        transform: `perspective(2200px) rotateY(${flip < 90 ? flip : flip - 180}deg) scale(${1 + through * 0.9})`,
        transformOrigin: "50% 30%",
      }}
    >
      {flip < 90 ? (
        <div style={{ position: "relative" }}>
          <Nle head={head} label={nowLabel} hot={hot} />
          {stamp > 0 && (
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: NLE_H / 2 + 10,
                transform: `translate(-50%, -50%) rotate(-7deg) scale(${2.2 - 1.2 * stamp})`,
                opacity: Math.min(1, stamp * 2),
                border: `8px solid ${theme.red}`,
                borderRadius: 14,
                padding: "10px 30px 16px",
                background: "rgba(8,8,8,.82)",
                textAlign: "center",
                whiteSpace: "nowrap",
                boxShadow: `0 0 60px rgba(255,59,47,.35)`,
              }}
            >
              <div style={{ fontFamily: theme.mono, fontSize: 22, letterSpacing: "0.3em", color: theme.red }}>VIDEO EDITOR</div>
              <div style={{ fontFamily: theme.sans, fontWeight: 800, fontSize: 104, letterSpacing: "-0.045em", lineHeight: 1, color: theme.red }}>NEVER OPENED</div>
            </div>
          )}
        </div>
      ) : (
        <CodeBack t={t} />
      )}
    </div>
  );
};

const DIFF = [
  { at: STAMP + 0.05, sign: "-", text: "open an editor, drag clips by hand", color: "#9a9a94", strike: STAMP + 0.3 },
  { at: FLIP + 0.3, sign: "+", text: "describe the edit, AI writes the code", color: CYAN, strike: 0 },
];

const Diff: React.FC<{ t: number }> = ({ t }) => {
  const out = tween(t, IDE_AT - 0.08, IDE_AT + 0.08, 0, 1);
  if (t < DIFF[0].at || out >= 1) return null;
  return (
    <div style={{ position: "absolute", left: 60, top: 1068, opacity: 1 - out }}>
      {DIFF.map((d) => {
        if (t < d.at) return null;
        const k = tween(t, d.at, d.at + 0.2, 0, 1, easeExpo);
        const chars = Math.round(tween(t, d.at, d.at + 0.3, 0, d.text.length, (x) => x));
        const s = d.strike ? tween(t, d.strike, d.strike + 0.2, 0, 1, easeOut) : 0;
        return (
          <div key={d.sign} style={{ position: "relative", display: "flex", gap: 20, fontFamily: theme.mono, fontSize: 33, lineHeight: "62px", color: d.color, opacity: k, transform: `translateX(${(1 - k) * -30}px)` }}>
            <span style={{ color: d.sign === "-" ? theme.red : CYAN }}>{d.sign}</span>
            <span style={{ position: "relative", whiteSpace: "pre" }}>
              {d.text.slice(0, chars)}
              {s > 0 && <span style={{ position: "absolute", left: -6, top: "52%", height: 5, width: `calc(${s * 100}% + 12px)`, background: theme.red }} />}
            </span>
          </div>
        );
      })}
    </div>
  );
};

const TERM = [
  { at: 1.62, cmd: true, text: "$ cat src/timeline.ts" },
  { at: 2.5, cmd: false, text: `→ ${SCENES.length} scenes · ${LINES.length} voice lines · ${SFX.length} sound cues` },
  { at: IDE_AT, cmd: true, text: "$ npx remotion render ProofOfWorkVertical" },
  { at: IDE_AT + 0.42, cmd: false, text: "" },
];

const Terminal: React.FC<{ t: number }> = ({ t }) => {
  if (t < 1.5) return null;
  const k = tween(t, 1.5, 1.75, 0, 1, easeExpo);
  const frame = sec(START) + Math.round(t * 30);
  const total = sec(TOTAL_SECONDS);
  const shown = TERM.filter((l) => t >= l.at).slice(-4);
  return (
    <div style={{ position: "absolute", left: 40, right: 40, top: 1640, height: 172, borderRadius: 16, background: "rgba(11,11,11,.94)", border: "1px solid #ffffff22", padding: "14px 22px", boxSizing: "border-box", fontFamily: theme.mono, fontSize: 21, lineHeight: "36px", opacity: k, transform: `translateY(${(1 - k) * 60}px)`, overflow: "hidden" }}>
      {shown.map((l, i) => {
        if (l.text === "") {
          const p = frame / total;
          const bars = 22;
          const full = Math.round(p * bars);
          return (
            <div key={i} style={{ whiteSpace: "pre", color: "#cfcec8" }}>
              <span style={{ color: CYAN }}>rendering </span>
              {"█".repeat(full)}
              <span style={{ color: "#3a3a3a" }}>{"█".repeat(bars - full)}</span>
              {`  frame ${frame}/${total}`}
            </div>
          );
        }
        const chars = Math.round(tween(t, l.at, l.at + (l.cmd ? 0.35 : 0.12), 0, l.text.length, (x) => x));
        return (
          <div key={i} style={{ whiteSpace: "pre", color: l.cmd ? theme.fg : "#9a9a94" }}>
            {l.text.slice(0, chars)}
          </div>
        );
      })}
    </div>
  );
};

// "Oh — and this video?  I never opened an editor.  AI wrote the whole edit, in code."
export const Twist: React.FC = () => {
  const t = useCurrentFrame() / 30;
  const [sx, sy, sr] = shakeAt(t, [0, STAMP, IDE_AT + 0.12], 18, 0.3);
  const flash = Math.max(0, 1 - t / 0.12) * 0.6 + Math.max(0, 1 - Math.abs(t - STAMP) / 0.08) * 0.18;
  return (
    <AbsoluteFill style={{ background: theme.bg, overflow: "hidden" }}>
      <GridBg opacity={0.1} speed={t < LANDED ? -3 : 1} horizon={1180} />
      <FloatingCode count={20} opacity={0.08} seed="tw" speed={t < LANDED && t > REWIND ? -3 : 1} />
      <Particles count={40} opacity={0.25} seed="twp" />
      <AbsoluteFill style={{ transform: `translate(${sx}px, ${sy}px) rotate(${sr}deg)` }}>
        {t < OUT + 0.4 && <FilmStrip t={t} />}
        <RewindHud t={t} />
        {t < IDE_AT + 0.2 && <TimelinePanel t={t} />}
        <Diff t={t} />
        <Callout x={40} y={212} w={1000} h={790} at={FLIP + 0.6} until={IDE_AT - 0.05} label="THE TIMELINE IS CODE" color={CYAN} />
        {t >= IDE_AT - 0.05 && <Ide at={IDE_AT} />}
        <Callout x={30} y={122} w={1020} h={1298} at={IDE_AT + 0.3} until={IDE_AT + 1.15} label="THE SOURCE OF THIS VIDEO" />
        <Terminal t={t} />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "#fff", opacity: flash, pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};
