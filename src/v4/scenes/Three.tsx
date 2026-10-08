import { AbsoluteFill, Easing, useCurrentFrame } from "remotion";
import { Scramble } from "../../fx/Scramble";
import { shakeAt } from "../../fx/shake";
import { AiCursor, cursorAt, type CursorKey } from "../kit/AiCursor";
import { ToolChip } from "../kit/ToolChip";
import { C, clamp01, easeExpo, easeIn3, kick, lerp, pop, prog } from "../kit/util";
import { T3 } from "./three-four/beats";
import { barH, Brackets, contentH, Footage, Window } from "./three-four/Window";

// 15.45-19.22  "Three. Creative and content people actually stop for."
// After the ⌘K "create content": the AI cursor grabs the real creative (creative.mp4, the collage)
// on "Creative" and drops it on the stack; pulls the real experiment archive (lab-archive.mp4) in on
// "content" and slides it into the stack behind; the experiment counter decodes 01 → 10; on "stop"
// the cursor taps the reel and the camera punches in on the creative.

const W = 720;
const BAR = barH(W);
const H = BAR + contentH(W);
type Pose = { x: number; y: number; s: number; r: number };

const CRE_START: Pose = { x: 560, y: 610, s: 1.12, r: 3 };
const CRE_SLOT: Pose = { x: 540, y: 800, s: 1, r: -1.5 };
const ARC_START: Pose = { x: 860, y: 566, s: 0.95, r: 5 };
const ARC_SLOT: Pose = { x: 650, y: 642, s: 0.86, r: 3.5 };
/** Grab points on each title bar (window-local px from the window centre). */
const GRAB_CRE = { x: 150, y: -H / 2 + BAR / 2 };
const GRAB_ARC = { x: -40, y: -H / 2 + BAR / 2 };

const DRAG = Easing.bezier(0.5, 0, 0.2, 1);
const grabPoint = (p: Pose, off: { x: number; y: number }) => {
  const a = (p.r * Math.PI) / 180;
  const ox = off.x * p.s;
  const oy = off.y * p.s;
  return { x: p.x + ox * Math.cos(a) - oy * Math.sin(a), y: p.y + ox * Math.sin(a) + oy * Math.cos(a) };
};

// The reel's play button ("Everything's fine.") in the creative capture, footage px → screen at the slot.
const REEL = { x: CRE_SLOT.x - W / 2 + 790 * (W / 1440), y: CRE_SLOT.y - H / 2 + BAR + 605 * (W / 1440) };

const g1a = grabPoint(CRE_START, GRAB_CRE);
const g1b = grabPoint(CRE_SLOT, GRAB_CRE);
const g2a = grabPoint(ARC_START, GRAB_ARC);
const g2b = grabPoint(ARC_SLOT, GRAB_ARC);
const PATH: CursorKey[] = [
  { t: T3.enter + 0.04, x: 1010, y: 1120 },
  { t: T3.grab1 - 0.03, x: g1a.x, y: g1a.y, arc: 90 },
  { t: T3.grab1, x: g1a.x, y: g1a.y, down: true },
  { t: T3.drop1, x: g1b.x, y: g1b.y, ease: DRAG },
  { t: T3.drop1 + 0.03, x: g1b.x, y: g1b.y, down: false },
  { t: T3.grab2 - 0.03, x: g2a.x, y: g2a.y, arc: -80 },
  { t: T3.grab2, x: g2a.x, y: g2a.y, down: true },
  { t: T3.drop2, x: g2b.x, y: g2b.y, ease: DRAG },
  { t: T3.drop2 + 0.03, x: g2b.x, y: g2b.y, down: false },
  { t: T3.count[1], x: g2b.x + 60, y: g2b.y + 150 },
  { t: T3.stop, x: REEL.x, y: REEL.y, click: true, arc: 60 },
  { t: T3.stop + 0.3, x: 1000, y: 1120, ease: easeIn3 },
];

/** Window pose while the cursor drags it (the grab point stays under the cursor tip). */
const dragged = (t: number, a: number, b: number, from: Pose, to: Pose, off: { x: number; y: number }): Pose => {
  if (t <= a) return from;
  if (t >= b) return to;
  const p = DRAG(clamp01((t - a) / (b - a)));
  const s = lerp(from.s, to.s, p);
  const r = lerp(from.r, to.r, p);
  const c = cursorAt(PATH, t);
  const g = grabPoint({ x: 0, y: 0, s, r }, off);
  return { x: c.x - g.x, y: c.y - g.y, s, r };
};

const Placed: React.FC<{ p: Pose; lift?: number; children: React.ReactNode }> = ({ p, lift = 0, children }) => (
  <div
    style={{
      position: "absolute",
      left: p.x - W / 2,
      top: p.y - H / 2,
      width: W,
      transform: `rotate(${p.r}deg) scale(${p.s})`,
      transformOrigin: "50% 50%",
      filter: lift > 0.01 ? `drop-shadow(0 ${30 * lift}px ${40 * lift}px rgba(0,0,0,.6))` : undefined,
    }}
  >
    {children}
  </div>
);

const Counter: React.FC<{ t: number }> = ({ t }) => {
  const [a, b] = T3.count;
  if (t < a - 0.08 || t > T3.punch + 0.15) return null;
  const k = pop(t, a - 0.08, 0.22);
  const e = prog(t, T3.punch, T3.punch + 0.15, easeIn3);
  const n = Math.min(10, 1 + Math.floor(((t - a) / (b - a)) * 9 + 1e-6));
  const last = a + ((b - a) * (n - 1)) / 9;
  const punch = Math.max(0, 1 - (t - last) / 0.12);
  const done = t >= b;
  const s = String(Math.max(1, n)).padStart(2, "0");
  return (
    <div
      style={{
        position: "absolute",
        left: 540,
        top: 284,
        transform: `translateX(-50%) translateY(${(1 - k) * 24 - e * 30}px) scale(${0.92 + 0.08 * k})`,
        opacity: clamp01(k * 2) * (1 - e),
        display: "flex",
        alignItems: "center",
        gap: 26,
      }}
    >
      <div
        style={{
          fontFamily: C.sans,
          fontWeight: 800,
          fontSize: 128,
          lineHeight: 1,
          letterSpacing: "-0.045em",
          color: C.white,
          fontVariantNumeric: "tabular-nums",
          transform: `scale(${1 + 0.1 * punch + kick(t, b, 0.1)})`,
          transformOrigin: "100% 60%",
          textShadow: done ? `0 0 ${30 * Math.max(0, 1 - (t - b) / 0.4)}px rgba(255,59,47,.8)` : undefined,
        }}
      >
        <span style={{ opacity: s[0] === "0" ? 0.28 : 1 }}>{s[0]}</span>
        {s[1]}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, fontFamily: C.mono, fontSize: 23, letterSpacing: "0.14em", color: C.fg }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#ffffffa0" }}>
          <span style={{ width: 11, height: 11, borderRadius: 6, background: C.red, opacity: done ? 1 : Math.floor(t * 8) % 2 ? 0.35 : 1 }} />
          ORIGINAL WEB
        </div>
        <Scramble text="EXPERIMENTS" at={a} dur={0.3} />
      </div>
    </div>
  );
};

export const Three: React.FC = () => {
  const t = useCurrentFrame() / 30;
  const cre = dragged(t, T3.grab1, T3.drop1, CRE_START, CRE_SLOT, GRAB_CRE);
  const arcIn = prog(t, T3.archIn, T3.archIn + 0.3, easeExpo);
  const arcStart: Pose = { ...ARC_START, x: lerp(1420, ARC_START.x, arcIn), r: lerp(14, ARC_START.r, arcIn) };
  const arc = t < T3.grab2 ? arcStart : dragged(t, T3.grab2, T3.drop2, ARC_START, ARC_SLOT, GRAB_ARC);
  const creThump = kick(t, T3.drop1, 0.035, 26, 10);
  const arcThump = kick(t, T3.drop2, 0.03, 26, 10);
  const lift1 = t >= T3.grab1 && t < T3.drop1 ? 1 : 0;
  const lift2 = t >= T3.grab2 && t < T3.drop2 ? 1 : 0;

  // punch-in on "stop": the stack snaps toward the camera, centred on the creative
  const pk = prog(t, T3.punch, T3.punch + 0.12, easeExpo);
  const creep = prog(t, T3.punch + 0.12, T3.end, Easing.linear);
  const camS = 1 + 0.36 * pk + 0.05 * creep + kick(t, T3.punch, 0.035, 30, 9);
  const camY = -78 * pk;
  const [sx, sy, sr] = shakeAt(t, [T3.punch], 26, 0.32);
  const [dx, dy] = shakeAt(t, [T3.drop1, T3.drop2], 7, 0.18);
  const flash = Math.max(0, 1 - Math.abs(t - T3.punch) / 0.12) * 0.5;
  const arcDim = 0.2 + 0.55 * pk;
  const lock = prog(t, T3.punch + 0.04, T3.punch + 0.22, easeExpo);

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          transformOrigin: `${CRE_SLOT.x}px ${CRE_SLOT.y}px`,
          transform: `translate(${sx + dx}px, ${sy + dy + camY}px) rotate(${sr}deg) scale(${camS})`,
        }}
      >
        {t >= T3.archIn && (
          <Placed p={{ ...arc, s: arc.s * (1 + arcThump) }} lift={lift2}>
            <Window w={W} url="pilotaccess.com/suyashpow · archive" dim={t >= T3.drop2 ? arcDim * prog(t, T3.drop2 - 0.1, T3.drop2 + 0.1) : 0}>
              <Footage name="lab-archive" w={W} segs={[{ at: T3.archIn - 0.05, until: T3.end + 0.1, from: 11.2 }]} />
            </Window>
          </Placed>
        )}
        <Placed p={{ ...cre, s: cre.s * (1 + creThump) }} lift={lift1}>
          <Window w={W} url="pilotaccess.com/suyashpow · creative" glow={0.25 + 0.5 * pk}>
            <Footage name="creative" w={W} segs={[{ at: 0.5, until: T3.end + 0.1, from: 5.0 }]} />
          </Window>
        </Placed>
        <Brackets x={CRE_SLOT.x - W / 2 - 14} y={CRE_SLOT.y - H / 2 - 14} w={W + 28} h={H + 28} k={lock} len={40} stroke={4} />
      </AbsoluteFill>
      <Counter t={t} />
      <ToolChip at={T3.drop1} out={T3.grab2 + 0.12} x={CRE_SLOT.x - W / 2} y={1084} name="stack" arg="creative" took="0.4s" resolve={0.16} />
      <ToolChip at={T3.drop2} out={T3.count[0] - 0.12} x={CRE_SLOT.x - W / 2} y={1084} name="stack" arg="archive" took="0.4s" resolve={0.16} />
      <AiCursor path={PATH} until={T3.stop + 0.3} />
      <AbsoluteFill style={{ background: "#fff", opacity: flash, pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};
