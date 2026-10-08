import { AbsoluteFill, Easing, useCurrentFrame } from "remotion";
import { shakeAt } from "../../fx/shake";
import { AiCursor, type CursorKey } from "../kit/AiCursor";
import { Burst, Shockwave } from "../kit/fx";
import { Thinking } from "../kit/Thinking";
import { ToolChip } from "../kit/ToolChip";
import { DecodeNumber, SnapshotStamp } from "../kit/VerifiedStamp";
import { C, clamp01, easeExpo, easeIn3, easeInOut, kick, lerp, pop, prog } from "../kit/util";
import { T4 } from "./three-four/beats";
import { barH, Footage, footToContent, Window, type Seg, type View } from "./three-four/Window";

// 19.22-26.6  "Four. Campaigns that bring them in. | Meta, Google, Reddit, Amazon. | Clicks for pennies. Real sign-ups."
// After the ⌘K "launch campaign": the real Campaigns & Signals page (signals.mp4) opens on its
// "Then I put it in front of people." headline, the inner camera drops to the tabs, the agent thinks,
// then the AI cursor clicks the REAL tab as each channel is spoken, each with a click(tab) ✓ receipt.
// On "Clicks" the browser steps back and Reddit's 1,999 decodes big (shake + flash, ✓ snapshot stamp),
// "$0.03 / click" slams on "pennies", and "Real sign-ups" gets one clean notification.

const W = 1000;
const WIN = { x: 40, y: 384 };
const CONTENT_Y = WIN.y + barH(W);

const HEAD: View = { cx: 470, cy: 300, z: 1.55 };
const TABS: View = { cx: 720, cy: 500, z: 1.15 };

/** The six real tabs (footage px). Meta → 01 Moolank, Google → 02 Search, Reddit → 03 Reddit, Amazon → 06 Amazon. */
const TAB_Y = 452;
const tabAt = (fx: number) => {
  const p = footToContent(W, TABS, fx, TAB_Y + 8);
  return { x: WIN.x + p.x, y: CONTENT_Y + p.y };
};
const CH = [
  { key: "meta", fx: 180, foot: 1.63, c: T4.clicks.meta },
  { key: "google", fx: 396, foot: 4.33, c: T4.clicks.google },
  { key: "reddit", fx: 612, foot: 7.03, c: T4.clicks.reddit },
  { key: "amazon", fx: 1260, foot: 15.13, c: T4.clicks.amazon },
].map((ch) => ({ ...ch, ...tabAt(ch.fx) }));

// Footage: the page holds on the headline, then one short stretch per click, cut so each tab
// responds ~0.05 s after the AI cursor presses it (capture clicks measured on the tab pixels).
const RATE = 1.3;
const SEGS: Seg[] = [
  { at: 0.5, until: CH[0].c + 0.03, from: 0, rate: 0.55 },
  { at: CH[0].c + 0.03, until: CH[1].c - 0.05, from: 1.7, rate: RATE },
  { at: CH[1].c - 0.05, until: CH[2].c - 0.05, from: CH[1].foot - 0.05 * RATE, rate: RATE },
  { at: CH[2].c - 0.05, until: CH[3].c - 0.03, from: CH[2].foot - 0.05 * RATE, rate: RATE },
  { at: CH[3].c - 0.03, until: T4.end + 0.1, from: CH[3].foot - 0.03, rate: 1 },
];

const PATH: CursorKey[] = [
  { t: T4.cursorIn, x: 1010, y: 1130 },
  { t: CH[0].c - 0.08, x: CH[0].x, y: CH[0].y, arc: 140 },
  { t: CH[0].c, x: CH[0].x, y: CH[0].y, click: true },
  ...CH.slice(1).flatMap((ch): CursorKey[] => [
    { t: ch.c - 0.07, x: ch.x, y: ch.y, arc: -30 },
    { t: ch.c, x: ch.x, y: ch.y, click: true },
  ]),
  { t: CH[3].c + 0.42, x: 960, y: 1000, ease: easeIn3 },
];

const chipX = (x: number) => Math.min(880, Math.max(200, x));

const viewAt = (t: number): View => {
  const k = prog(t, T4.pan[0], T4.pan[1], easeInOut);
  const push = prog(t, T4.enter, T4.pan[0]);
  const head = { ...HEAD, z: HEAD.z + 0.08 * push, cx: HEAD.cx + 12 * push };
  return { cx: lerp(head.cx, TABS.cx, k), cy: lerp(head.cy, TABS.cy, k), z: lerp(head.z, TABS.z, k) };
};

/** Reddit's real number, decoding big; ✓ snapshot stamp; "$0.03 / click" on "pennies". */
const Clicks: React.FC<{ t: number }> = ({ t }) => {
  if (t < T4.recede || t > T4.real + 0.2) return null;
  const k = pop(t, T4.recede, 0.24);
  const out = prog(t, T4.real - 0.1, T4.real + 0.14, easeIn3);
  const [sx, sy, sr] = shakeAt(t, [T4.land], 26, 0.32);
  const [px, py] = shakeAt(t, [T4.pennies], 12, 0.22);
  const landed = t >= T4.land;
  const punch = kick(t, T4.land, 0.07, 24, 9);
  const sub = pop(t, T4.land + 0.12, 0.22);
  const cent = prog(t, T4.pennies, T4.pennies + 0.18, easeExpo);
  const drift = prog(t, T4.land, T4.real, Easing.linear);
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: 448,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        transform: `translate(${sx + px}px, ${sy + py - out * 120}px) rotate(${sr}deg) scale(${(0.9 + 0.1 * k) * (1 + punch) * (1 + 0.025 * drift)})`,
        transformOrigin: "540px 230px",
        opacity: clamp01(k * 2) * (1 - out),
        filter: out > 0.05 ? `blur(${(out * 8).toFixed(1)}px)` : undefined,
      }}
    >
      <div style={{ fontFamily: C.mono, fontSize: 25, letterSpacing: "0.16em", color: "#ffffffb0", display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ width: 11, height: 11, borderRadius: 6, background: C.red }} />
        REDDIT ADS · iCreateEpic
      </div>
      <div style={{ position: "relative", marginTop: 8 }}>
        <DecodeNumber
          value="1,999"
          at={T4.recede}
          dur={T4.land - T4.recede}
          style={{
            fontFamily: C.sans,
            fontWeight: 800,
            fontSize: 268,
            lineHeight: 0.92,
            letterSpacing: "-0.05em",
            color: C.white,
            textShadow: landed ? `0 0 ${60 * Math.max(0, 1 - (t - T4.land) / 0.5)}px rgba(255,255,255,.55), 0 14px 50px rgba(0,0,0,.8)` : "0 14px 50px rgba(0,0,0,.8)",
          }}
        />
        <div style={{ position: "absolute", right: -18, bottom: -34 }}>
          <SnapshotStamp at={T4.snap} size={26} />
        </div>
      </div>
      <div style={{ marginTop: 56, fontFamily: C.sans, fontWeight: 700, fontSize: 46, letterSpacing: "-0.025em", color: C.fg, opacity: clamp01(sub * 2), transform: `translateY(${(1 - sub) * 16}px)` }}>
        clicks from <span style={{ color: C.white }}>$59.17</span> spend
      </div>
      {cent > 0 && (
        <div
          style={{
            marginTop: 30,
            transform: `rotate(-4deg) scale(${1.9 - 0.9 * cent})`,
            opacity: clamp01(cent * 3),
            background: C.red,
            color: "#fff",
            borderRadius: 14,
            padding: "8px 30px 12px",
            fontFamily: C.sans,
            fontWeight: 800,
            fontSize: 82,
            letterSpacing: "-0.04em",
            lineHeight: 1,
            whiteSpace: "nowrap",
            boxShadow: `0 0 ${70 * (1 - cent) + 30}px rgba(255,59,47,${0.35 + 0.4 * (1 - cent)}), 0 20px 50px rgba(0,0,0,.6)`,
          }}
        >
          $0.03 <span style={{ fontWeight: 600, opacity: 0.85 }}>/ click</span>
        </div>
      )}
    </div>
  );
};

/** "Real sign-ups": one clean notification. Illustrative (no number, no campaign attached). */
const Notice: React.FC<{ t: number }> = ({ t }) => {
  const at = T4.real;
  if (t < at - 0.02) return null;
  const k = pop(t, at - 0.02, 0.26);
  const ring = clamp01((t - at) / 0.5);
  const float = 5 * Math.sin((t - at) * 4);
  return (
    <div
      style={{
        position: "absolute",
        left: 540,
        top: 640 + float,
        width: 800,
        transform: `translate(-50%, -50%) translateY(${(1 - k) * -90}px) scale(${0.88 + 0.12 * k})`,
        opacity: clamp01(k * 2.5),
        display: "flex",
        alignItems: "center",
        gap: 28,
        padding: "26px 34px",
        borderRadius: 34,
        background: "rgba(18,18,18,.97)",
        border: "1.5px solid #ffffff30",
        boxShadow: "0 40px 100px rgba(0,0,0,.7), 0 0 60px rgba(255,255,255,.06)",
      }}
    >
      <div style={{ position: "relative", width: 84, height: 84, flex: "none" }}>
        <div style={{ position: "absolute", inset: 0, borderRadius: 42, background: C.red, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontFamily: C.sans, fontWeight: 800, fontSize: 46 }}>✓</div>
        {ring < 1 && <div style={{ position: "absolute", left: -ring * 40, top: -ring * 40, width: 84 + ring * 80, height: 84 + ring * 80, borderRadius: "50%", border: `3px solid ${C.red}`, opacity: 1 - ring }} />}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: C.sans, fontWeight: 800, fontSize: 54, letterSpacing: "-0.035em", color: C.white, lineHeight: 1.05 }}>New sign-up</div>
        <div style={{ fontFamily: C.mono, fontSize: 22, letterSpacing: "0.1em", color: C.dim, marginTop: 6 }}>just now</div>
      </div>
      <span style={{ width: 16, height: 16, borderRadius: 8, background: C.red, opacity: Math.floor((t - at) * 4) % 2 ? 0.35 : 1, boxShadow: `0 0 14px ${C.redGlow}` }} />
    </div>
  );
};

export const Four: React.FC = () => {
  const t = useCurrentFrame() / 30;
  const view = viewAt(t);
  const rec = prog(t, T4.recede - 0.02, T4.recede + 0.3, easeExpo);
  const press = CH.reduce((a, ch) => a + kick(t, ch.c, 0.006, 30, 12), 0);
  const flash = Math.max(0, 1 - Math.abs(t - T4.land) / 0.14) * 0.55;
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      {/* the browser, its chips and the cursor share one transform so clicks stay on the tabs */}
      {rec < 1 && (
        <AbsoluteFill
          style={{
            transformOrigin: "540px 720px",
            transform: `translateY(${4 * Math.sin(t * 1.6) + rec * 70}px) rotate(${0.25 * Math.sin(t * 1.1)}deg) scale(${(1 - press) * (1 - 0.16 * rec)})`,
            opacity: 1 - 0.84 * rec,
            filter: rec > 0.03 ? `blur(${(rec * 6).toFixed(1)}px)` : undefined,
          }}
        >
          <div style={{ position: "absolute", left: WIN.x, top: WIN.y }}>
            <Window w={W} url="pilotaccess.com/suyashpow · signals" live glow={0.3}>
              <Footage name="signals" w={W} segs={SEGS} view={view} />
            </Window>
          </div>
          {CH.map((ch, i) => (
            <ToolChip key={ch.key} at={ch.c} out={i < 3 ? CH[i + 1].c - 0.05 : T4.recede} x={chipX(ch.x)} y={350} anchor="c" name="click" arg={`tab: ${ch.key}`} resolve={0.16} />
          ))}
          {/* Amazon is a team project: the receipt says so */}
          {t >= CH[3].c + 0.08 && t < T4.recede + 0.15 && (
            <div
              style={{
                position: "absolute",
                left: chipX(CH[3].x) - 166,
                top: 350,
                transform: `translate(-100%, -50%) scale(${0.85 + 0.15 * pop(t, CH[3].c + 0.08, 0.2)})`,
                transformOrigin: "100% 50%",
                opacity: clamp01(pop(t, CH[3].c + 0.08, 0.2) * 2) * (1 - prog(t, T4.recede, T4.recede + 0.15)),
                fontFamily: C.mono,
                fontSize: 19,
                letterSpacing: "0.16em",
                color: C.fg,
                border: `1.5px solid ${C.line}`,
                background: "rgba(10,10,10,.86)",
                borderRadius: 8,
                padding: "6px 12px",
                whiteSpace: "nowrap",
              }}
            >
              TEAM PROJECT
            </div>
          )}
          <AiCursor path={PATH} until={CH[3].c + 0.42} />
        </AbsoluteFill>
      )}
      <Thinking at={T4.think} dur={CH[0].c - T4.think - 0.04} y={350} text="thinking · planning 4 channels…" />
      <Shockwave t={t} at={T4.land} cx={540} cy={600} size={0.7} />
      <Burst t={t} at={T4.land} cx={540} cy={600} count={70} seed="four1999" reach={0.75} />
      <Clicks t={t} />
      <Notice t={t} />
      <AbsoluteFill style={{ background: "#fff", opacity: flash, pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};
