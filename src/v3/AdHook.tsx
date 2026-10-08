// The ad's opening, built from the second video's hook camera (src/v2/scenes/hook-intro):
// four job titles fly out of the floating-island sky at the lens and never sit still, then the
// camera pulls back through the clouds, the sky collapses into the site window, the titles get
// sucked into it and "1 person + AI" slams in on a burst.
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Sparks, Tag } from "../v2/scenes/campaigns-lab/kit";
import { HeroWindow } from "../v2/scenes/hook-intro/HeroWindow";
import { Clouds, OuterWorld } from "../v2/scenes/hook-intro/Stage";
import { Bokeh, Brackets, Dust } from "../v2/scenes/hook-intro/World";
import { clamp01, lerp, pullP, springT, tw } from "../v2/scenes/hook-intro/util";
import { DropBurst } from "../v2/scenes/manifesto-work/DropBurst";
import { theme2 as T } from "../v2/theme";
import VO from "./vo-fast.json";

const w1 = (p: string) => VO[1].words.find((x) => x.w.toLowerCase().startsWith(p.toLowerCase()))!.s;
export const HOOK = { one: w1("one"), with: w1("with"), ai: w1("AI") };
/** v2's hook clock runs D seconds behind ours, so its pull-back (1.45 to 2.05) lands exactly on "one". */
export const D = HOOK.one - 2.03;
const MERGE: [number, number] = [540, 640]; // the window centre once it has landed

type Job = { text: string; at: number; rest: [number, number]; from: [number, number, number, number, number]; color: string; ph: number };
const JOBS: Job[] = [
  { text: "BUILDER", at: -0.1, rest: [505, 500], from: [-260, -260, 24, 55, -10], color: T.paper, ph: 0 },
  { text: "DESIGNER", at: 0.34, rest: [575, 690], from: [560, 60, 0, -75, 12], color: T.lilac, ph: 2.1 },
  { text: "CREATOR", at: 0.72, rest: [505, 880], from: [-460, 320, -35, 45, -14], color: T.paper, ph: 4 },
  { text: "MARKETER", at: 1.06, rest: [575, 1070], from: [420, 420, -30, -45, 16], color: T.lilac, ph: 5.3 },
];

const jobStyle = (j: Job, i: number, t: number, q: number) => {
  const k = springT(t, j.at, 12, 0.7, 150);
  const live = clamp01((t - j.at - 0.35) / 0.4) * (1 - q);
  // Flight from the depth of the sky, overshooting toward the lens, then settling.
  let z = interpolate(k, [0, 1, 1.4], [-5200, 0, 420], { extrapolateRight: "clamp" }) + 130 * tw(t, 0, 2.2, 0, 1);
  let x = j.rest[0] + j.from[0] * (1 - k);
  let y = j.rest[1] + j.from[1] * (1 - k);
  let rx = j.from[2] * (1 - k);
  let ry = j.from[3] * (1 - k);
  let rz = j.from[4] * (1 - k);
  // ...and they never sit still; they get restless right before the merge.
  const shake = tw(t, 1.6, 2.2, 0, 1, (v) => v) * (1 - q);
  x += live * 18 * Math.sin(t * 1.6 + j.ph) + shake * 9 * Math.sin(t * 47 + i);
  y += live * 14 * Math.cos(t * 1.3 + j.ph);
  z += live * 90 * Math.sin(t * 1.2 + j.ph);
  ry += live * 13 * Math.sin(t * 0.95 + j.ph);
  rz += live * 2.4 * Math.sin(t * 1.4 + j.ph) + shake * 3 * Math.sin(t * 39 + i * 2);
  // The pull-back: every title is sucked into the one site window.
  x = lerp(x, MERGE[0], q);
  y = lerp(y, MERGE[1], q);
  z = lerp(z, 0, q);
  rx = lerp(rx, 0, q);
  ry = lerp(ry, 0, q);
  rz = lerp(rz, (i % 2 ? 1 : -1) * 50, q);
  const s = lerp(1, 0.08, q);
  const blur = Math.max(0, 1 - k) * 14 + q * 8;
  const op = clamp01(k * 4) * (1 - tw(t, D + 1.86, D + 2.04, 0, 1));
  return { transform: `translate3d(${x}px, ${y}px, ${z}px) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg) scale(${s}) translate(-50%, -50%)`, blur, op };
};

const Jobs: React.FC<{ t: number; q: number }> = ({ t, q }) => {
  if (t > D + 2.1) return null;
  return (
    <div style={{ position: "absolute", inset: 0, perspective: 1200, perspectiveOrigin: "540px 900px", pointerEvents: "none" }}>
      {JOBS.map((j, i) => {
        if (t < j.at - 0.02) return null;
        const { transform, blur, op } = jobStyle(j, i, t, q);
        return (
          <div
            key={j.text}
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              transformOrigin: "0 0",
              transform,
              opacity: op,
              fontFamily: T.display,
              fontWeight: 800,
              fontSize: 158,
              lineHeight: 1,
              letterSpacing: "-0.04em",
              whiteSpace: "nowrap",
              color: j.color,
              filter: blur > 0.3 ? `blur(${blur.toFixed(1)}px)` : undefined,
              textShadow: `0 18px 70px rgba(9,13,37,.65), 0 0 50px ${j.color === T.lilac ? "rgba(188,165,238,.45)" : "rgba(228,220,255,.22)"}`,
            }}
          >
            {j.text}
          </div>
        );
      })}
    </div>
  );
};

// "1 person + AI" snaps in under the window, word by word on the voice.
const RESULT = [
  { text: "1 person", at: HOOK.one + 0.02, x: 540, y: 1040, size: 176, color: T.paper },
  { text: "+", at: HOOK.with, x: 430, y: 1190, size: 130, color: T.lilacSoft },
  { text: "AI", at: HOOK.ai, x: 585, y: 1190, size: 150, color: T.lilac },
];
const Result: React.FC<{ t: number }> = ({ t }) => {
  if (t < HOOK.one) return null;
  const hit = t > HOOK.ai ? Math.exp(-(t - HOOK.ai) * 9) * Math.sin((t - HOOK.ai) * 40) * 10 : 0;
  return (
    <>
      {RESULT.map((w, i) => {
        const k = springT(t, w.at, 12, 0.6, 190);
        if (k <= 0) return null;
        const blur = Math.max(0, 1 - k) * 18;
        return (
          <div
            key={w.text}
            style={{
              position: "absolute",
              left: w.x,
              top: w.y + Math.sin(t * 1.8 + i * 1.4) * 8 + hit * (i ? 0 : 0.6),
              transform: `translate(-50%, -50%) scale(${interpolate(k, [0, 1], [2, 1])}) rotate(${(1 - Math.min(1, k)) * (i % 2 ? 9 : -9) + (i === 2 ? hit : 0)}deg)`,
              opacity: clamp01(k * 3),
              fontFamily: T.display,
              fontWeight: 800,
              fontSize: w.size,
              lineHeight: 1,
              letterSpacing: "-0.045em",
              whiteSpace: "nowrap",
              color: w.color,
              filter: blur > 0.3 ? `blur(${blur.toFixed(1)}px)` : undefined,
              textShadow: `0 12px 50px rgba(9,13,37,.85), 0 0 40px ${i ? "rgba(188,165,238,.6)" : "rgba(228,220,255,.25)"}`,
            }}
          >
            {w.text}
          </div>
        );
      })}
      <Brackets x={150} y={945} w={780} h={320} opacity={tw(t, HOOK.ai + 0.08, HOOK.ai + 0.2, 0, 1)} arm={34} stroke={5} />
      <Sparks cx={585} cy={1190} t={t} at={HOOK.ai} n={28} seed="hook-ai" reach={420} />
    </>
  );
};

export const AdHook: React.FC = () => {
  const t = useCurrentFrame() / 30;
  const T2 = t - D;
  const q = pullP(T2);
  const roll = -2.6 * Math.sin(Math.PI * q) + 0.5 * Math.sin(t * 1.3);
  const settle = tw(t, HOOK.one, 4.9, 0, 1, (v) => v);
  return (
    <AbsoluteFill style={{ background: T.bg, overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `rotate(${roll}deg) scale(${1 + Math.abs(roll) * 0.02 + 0.04 * settle})` }}>
        <OuterWorld T={T2} />
        <AbsoluteFill style={{ transformOrigin: "540px 760px", transform: `translateY(${-120 * q}px) scale(${1 - 0.14 * q}) rotate(${0.8 * q * Math.sin(t * 1.5)}deg)` }}>
          <HeroWindow T={Math.min(T2, 3.1)} offset={-D} />
        </AbsoluteFill>
        <Clouds T={T2} />
        <Dust T={T2} opacity={0.5} />
        <Bokeh T={T2} opacity={0.6} />
        <Jobs t={t} q={q} />
      </AbsoluteFill>
      {[
        ["4 hires", 0.05, 225],
        ["4 salaries", 0.55, 540],
        ["4 calendars", 1.05, 860],
      ].map(([s, at, x]) => (
        <Tag key={s as string} x={x as number} y={312} t={t} at={at as number} out={2.05} anchor="c" variant="glass" size={30}>
          {s}
        </Tag>
      ))}
      <Result t={t} />
      {t >= HOOK.one && <DropBurst t={t - HOOK.one} cx={MERGE[0]} cy={MERGE[1]} />}
    </AbsoluteFill>
  );
};
