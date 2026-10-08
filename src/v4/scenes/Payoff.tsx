import { AbsoluteFill, Easing, useCurrentFrame } from "remotion";
import { Scramble } from "../../fx/Scramble";
import { shakeAt } from "../../fx/shake";
import { Mini } from "../../scenes/twist-ship/Mini";
import { AiCursor, type CursorKey } from "../kit/AiCursor";
import { ToolChip } from "../kit/ToolChip";
import { C, clamp01, easeExpo, easeIn3, easeInOut, lerp, prog } from "../kit/util";
import { S, type SceneId } from "../timing";
import { Four } from "./Four";
import { Hook } from "./Hook";
import { One } from "./One";
import { AD_CODE, MonoCode } from "./three-four/MonoCode";
import { TP } from "./three-four/beats";
import { Three } from "./Three";
import { Two } from "./Two";

// 26.6-28.95  "And this ad? Made the same way."
// Video 1's twist, for this ad: a film strip of the ad's own earlier scenes (real scenes, frozen)
// rewinds to 00:00 → "VIDEO EDITOR · NEVER OPENED" slams on → the strip flips over into the ad's
// source, src/v4/AdFrontier.tsx, where the AI cursor writes this very scene's line on "Made".

// ---------- film strip ----------
const SLOTS: { id: SceneId; Scene: React.FC; at: number; name: string }[] = [
  { id: "hook", Scene: Hook, at: 4.3, name: "HOOK" },
  { id: "one", Scene: One, at: 3.4, name: "PRODUCTS" },
  { id: "two", Scene: Two, at: 4.0, name: "TOOLS" },
  { id: "three", Scene: Three, at: 2.5, name: "CREATIVE" },
  { id: "four", Scene: Four, at: 5.6, name: "CAMPAIGNS" },
];
const SC = 0.25;
const TW = 1080 * SC;
const TH = 1920 * SC;
const PITCH = 300;
const STRIP_Y = 640;
const NOW = SLOTS.length;

const tc = (s: number) => {
  const m = Math.floor(s / 60);
  const r = s - m * 60;
  const f = Math.floor((r % 1) * 30);
  return `${String(m).padStart(2, "0")}:${String(Math.floor(r)).padStart(2, "0")}:${String(f).padStart(2, "0")}`;
};
const REW = Easing.bezier(0.6, 0, 0.25, 1);
const focusAt = (t: number) => lerp(NOW, 0, REW(clamp01((t - TP.rewind[0]) / (TP.rewind[1] - TP.rewind[0]))));
const headAt = (t: number) => lerp(S.payoff[0], 0, REW(clamp01((t - TP.rewind[0]) / (TP.rewind[1] - TP.rewind[0]))));

const Strip: React.FC<{ t: number }> = ({ t }) => {
  const f = focusAt(t);
  const v = Math.abs(focusAt(t + 1 / 30) - f) * 30; // slots per second
  const blur = Math.min(7, Math.max(0, v - 2) * 0.9);
  const dim = prog(t, TP.stamp, TP.stamp + 0.1) * 0.55;
  const z = 1.06 - 0.06 * prog(t, 0, TP.rewind[1], easeExpo) + 0.03 * prog(t, TP.rewind[1], TP.flip[0]);
  return (
    <div style={{ position: "absolute", left: 0, top: STRIP_Y, transform: `translateX(540px) scale(${z})`, filter: `${blur > 0.3 ? `blur(${blur.toFixed(1)}px) ` : ""}brightness(${1 - dim})` }}>
      <div style={{ position: "absolute", transform: `translateX(${-f * PITCH}px)` }}>
        <div style={{ position: "absolute", left: -PITCH * 2, top: -TH / 2 - 56, width: PITCH * (NOW + 5), height: TH + 112, background: "#101010", borderTop: "1px solid #ffffff1c", borderBottom: "1px solid #ffffff1c" }}>
          {[12, TH + 70].map((y) => (
            <div key={y} style={{ position: "absolute", left: 0, right: 0, top: y, height: 30, backgroundImage: "repeating-linear-gradient(90deg, #2a2a2a 0 22px, transparent 22px 44px)", borderRadius: 4 }} />
          ))}
        </div>
        {[...SLOTS, null].map((slot, k) => {
          if (Math.abs(k - f) * PITCH > 540 + TW) return null;
          const on = Math.abs(k - f) < 0.5;
          return (
            <div key={k} style={{ position: "absolute", left: k * PITCH - TW / 2, top: -TH / 2, width: TW, height: TH }}>
              {slot ? (
                <div style={{ outline: `2px solid ${on ? C.white : "#ffffff30"}` }}>
                  <Mini Scene={slot.Scene} frame={Math.round(slot.at * 30)} scale={SC} label={slot.name} />
                </div>
              ) : (
                <div style={{ width: TW, height: TH, boxSizing: "border-box", border: `4px dashed ${C.red}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, background: "#140706" }}>
                  <div style={{ fontFamily: C.sans, fontWeight: 800, fontSize: 190, color: C.red, lineHeight: 0.9 }}>?</div>
                  <div style={{ fontFamily: C.mono, fontSize: 22, letterSpacing: "0.14em", color: C.fg }}>THIS AD</div>
                </div>
              )}
              <div style={{ position: "absolute", left: 0, right: 0, top: TH + 74, display: "flex", justifyContent: "space-between", fontFamily: C.mono, fontSize: 17, letterSpacing: "0.08em", color: slot ? "#9a9a9a" : C.red }}>
                <span>
                  {String(k + 1).padStart(2, "0")} {slot ? slot.name : "NOW"}
                </span>
                <span>{tc(slot ? S[slot.id][0] : S.payoff[0])}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const RewindHud: React.FC<{ t: number }> = ({ t }) => {
  const k = prog(t, 0.08, 0.24, easeExpo) * (1 - prog(t, TP.stamp - 0.06, TP.stamp + 0.06));
  if (k <= 0) return null;
  const [a, b] = TP.rewind;
  const mid = (a + b) / 2;
  const speed = t < mid ? lerp(1, 32, prog(t, a, mid, easeInOut)) : lerp(32, 4, prog(t, mid, b));
  const landed = t >= b;
  return (
    <div style={{ position: "absolute", left: 80, right: 80, top: 950, display: "flex", alignItems: "baseline", justifyContent: "space-between", opacity: k, fontFamily: C.mono, fontSize: 38, letterSpacing: "0.04em" }}>
      <span style={{ color: landed ? C.red : C.fg }}>{landed ? "■ 00:00:00" : `◀◀ REWIND ×${Math.max(1, Math.round(speed))}`}</span>
      <span style={{ color: landed ? C.red : "#bdbdbd", fontVariantNumeric: "tabular-nums" }}>{tc(headAt(t))}</span>
    </div>
  );
};

const NeverOpened: React.FC<{ t: number }> = ({ t }) => {
  if (t < TP.stamp) return null;
  const k = prog(t, TP.stamp, TP.stamp + 0.16, easeExpo);
  return (
    <div
      style={{
        position: "absolute",
        left: 540,
        top: STRIP_Y,
        transform: `translate(-50%, -50%) rotate(-7deg) scale(${2.2 - 1.2 * k})`,
        opacity: clamp01(k * 2),
        border: `8px solid ${C.red}`,
        borderRadius: 14,
        padding: "10px 32px 16px",
        background: "rgba(8,8,8,.86)",
        textAlign: "center",
        whiteSpace: "nowrap",
        boxShadow: `0 0 ${60 + 80 * (1 - k)}px rgba(255,59,47,.35)`,
      }}
    >
      <div style={{ fontFamily: C.mono, fontSize: 24, letterSpacing: "0.3em", color: C.red }}>VIDEO EDITOR</div>
      <div style={{ fontFamily: C.sans, fontWeight: 800, fontSize: 108, letterSpacing: "-0.045em", lineHeight: 1, color: C.red }}>NEVER OPENED</div>
    </div>
  );
};

// ---------- the ad's own source ----------
const ED = { x: 60, y: 404, w: 960 };
const TITLE = 58;
const PAD = 18;
const FS = 30;
const LH = 50;
const CHW = FS * 0.6;
const GUT = 86;
const ENTER = TP.made + 0.04; // ↵ opens the new line
const TYPED = AD_CODE.lines[AD_CODE.self];
const above = AD_CODE.self - 1; // the line the cursor clicks the end of
const lineTop = (i: number) => ED.y + TITLE + PAD + i * LH;
const caretX = (chars: number) => ED.x + GUT + chars * CHW;
const typedCount = (t: number) => Math.floor(prog(t, TP.type[0], TP.type[1]) * TYPED.length + 1e-6);

const CURSOR: CursorKey[] = (() => {
  const indent = TYPED.length - TYPED.trimStart().length;
  const keys: CursorKey[] = [
    { t: TP.flip[1] - 0.12, x: 1090, y: 1180 },
    { t: TP.made - 0.02, x: caretX(AD_CODE.lines[above].length) + 8, y: lineTop(above) + 34, arc: 120 },
    { t: TP.made, x: caretX(AD_CODE.lines[above].length) + 8, y: lineTop(above) + 34, click: true },
    { t: TP.type[0] - 0.02, x: caretX(indent) + 8, y: lineTop(AD_CODE.self) + 34, type: TP.type[1] - TP.type[0] + 0.04 },
  ];
  const n = TYPED.length - indent;
  for (let k = 1; k <= n; k += 2) {
    keys.push({ t: lerp(TP.type[0], TP.type[1], (indent + k) / TYPED.length), x: caretX(indent + k) + 8, y: lineTop(AD_CODE.self) + 34, ease: (x) => x });
  }
  keys.push({ t: TP.chip + 0.3, x: caretX(TYPED.length) + 330, y: lineTop(AD_CODE.self) + 120 });
  return keys;
})();

const Editor: React.FC<{ t: number }> = ({ t }) => {
  const open = prog(t, ENTER, ENTER + 0.08, easeExpo);
  const typed = typedCount(t);
  const typing = t >= TP.type[0] && t < TP.type[1] + 0.05;
  const caretOn = typing || Math.floor(t * 4) % 2 === 0;
  const hot = prog(t, TP.type[0] - 0.05, TP.type[0] + 0.1);
  const rows = AD_CODE.lines.length;
  return (
    <div style={{ width: ED.w, borderRadius: 20, background: "#0b0b0b", border: "1.5px solid #ffffff26", overflow: "hidden", boxShadow: "0 60px 140px rgba(0,0,0,.8)" }}>
      <div style={{ height: TITLE, display: "flex", alignItems: "center", gap: 10, padding: "0 22px", background: "#141414", borderBottom: "1px solid #ffffff14", fontFamily: C.mono, fontSize: 21, color: "#9a9a9a" }}>
        {[C.red, "#4a4a4a", "#4a4a4a"].map((c, i) => (
          <span key={i} style={{ width: 13, height: 13, borderRadius: 7, background: c }} />
        ))}
        <span style={{ marginLeft: 12, color: C.fg }}>
          <Scramble text="src/v4/AdFrontier.tsx" at={TP.flip[1] - 0.1} dur={0.25} />
        </span>
        <span style={{ marginLeft: "auto", color: C.red, letterSpacing: "0.1em", fontSize: 18 }}>● AI-WRITTEN</span>
      </div>
      <div style={{ position: "relative", height: PAD * 2 + rows * LH }}>
        {AD_CODE.lines.map((l, i) => {
          const isSelf = i === AD_CODE.self;
          // before ↵ the scene's own line does not exist yet: the lines below sit one row up
          const y = PAD + (i > AD_CODE.self ? i - 1 + open : isSelf ? i : i) * LH;
          const num = AD_CODE.first + (i > AD_CODE.self ? i - 1 + (open > 0.5 ? 1 : 0) : i);
          if (isSelf && open <= 0) return null;
          return (
            <div key={i} style={{ position: "absolute", left: 0, right: 0, top: y, height: LH, display: "flex", alignItems: "center", fontSize: FS, opacity: isSelf ? open : 1 }}>
              {isSelf && <div style={{ position: "absolute", inset: 0, background: `rgba(255,59,47,${0.14 * hot})`, borderLeft: `5px solid rgba(255,59,47,${hot})` }} />}
              <span style={{ position: "relative", width: GUT - 22, textAlign: "right", marginRight: 22, flex: "none", fontFamily: C.mono, fontSize: 22, color: isSelf ? C.red : "#474747" }}>{num}</span>
              <span style={{ position: "relative" }}>
                <MonoCode text={l} upTo={isSelf ? typed : undefined} />
                {isSelf && t < TP.chip + 0.3 && (
                  <span style={{ display: "inline-block", width: 4, height: FS + 4, marginLeft: 1, verticalAlign: "middle", background: C.red, opacity: caretOn ? 1 : 0 }} />
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const Payoff: React.FC = () => {
  const t = useCurrentFrame() / 30;
  const [sx, sy, sr] = shakeAt(t, [TP.stamp], 22, 0.3);
  const [mx, my] = shakeAt(t, [TP.made], 8, 0.18);
  const flipA = prog(t, TP.flip[0], (TP.flip[0] + TP.flip[1]) / 2, easeIn3); // strip turns away
  const flipB = prog(t, (TP.flip[0] + TP.flip[1]) / 2, TP.flip[1], easeExpo); // code turns in
  const showStrip = t < (TP.flip[0] + TP.flip[1]) / 2;
  const flash = Math.max(0, 1 - Math.abs(t - TP.stamp) / 0.1) * 0.35;
  const drift = prog(t, TP.flip[1], TP.end);
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `translate(${sx + mx}px, ${sy + my}px) rotate(${sr}deg)` }}>
        {showStrip && (
          <AbsoluteFill style={{ transformOrigin: `540px ${STRIP_Y}px`, transform: `perspective(1800px) rotateY(${flipA * 90}deg)`, opacity: 1 - 0.4 * flipA }}>
            <Strip t={t} />
            <NeverOpened t={t} />
          </AbsoluteFill>
        )}
        <RewindHud t={t} />
        {!showStrip && (
          // editor, receipt and cursor share one 3D transform so the cursor stays on the caret
          <AbsoluteFill
            style={{
              transformOrigin: `540px ${ED.y + 300}px`,
              transform: `perspective(1800px) rotateY(${(1 - flipB) * -90 + lerp(-3, -1, drift)}deg) rotateX(${lerp(3, 1, drift)}deg) scale(${1 + 0.03 * drift})`,
            }}
          >
            <div style={{ position: "absolute", left: ED.x, top: ED.y }}>
              <Editor t={t} />
            </div>
            <ToolChip at={TP.chip} x={caretX(TYPED.length) + 34} y={lineTop(AD_CODE.self) + LH / 2} name="write" arg="payoff" took="0.4s" resolve={0.16} />
            <AiCursor path={CURSOR} until={TP.chip + 0.32} />
          </AbsoluteFill>
        )}
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "#fff", opacity: flash, pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};
