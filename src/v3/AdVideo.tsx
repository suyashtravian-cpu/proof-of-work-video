// Paid ad (Instagram/Facebook, 9:16): "One person. Four jobs. Built with AI."
// Timing comes straight from the voiceover take (src/v3/vo.json). Music is added by the user,
// so the render carries voice + sound effects only. Safe zones: nothing key above y 270 or below y 1530.
import { AbsoluteFill, Audio, Sequence, random, staticFile, useCurrentFrame } from "remotion";
import { easeExpo, easeInOut, easeOut, tween } from "../components/anim";
import { Captions } from "../components/Captions";
import { CodeLine } from "../components/Code";
import { Grain } from "../components/Grain";
import type { Line } from "../script";
import { loadFonts } from "../fonts";
import { Particles } from "../fx/Particles";
import { CODE_FILES } from "../generated/code";
import { sec } from "../timing";
import { RecSpans } from "../v2/components/Rec";
import { SiteFrame } from "../v2/components/SiteFrame";
import { Sky } from "../v2/components/Sky";
import { theme2 as T } from "../v2/theme";
import VO from "./vo.json";

loadFonts();

export const LENGTH3 = 36.5;
const W = (text: string) => VO.find((l) => l.text === text)!;
// Start of the first word in `text` beginning with `w` (falls back to the line start).
const word = (text: string, w: string) => W(text).words.find((x) => x.w.toLowerCase().startsWith(w.toLowerCase()))?.s ?? W(text).t;
const LINES3: Line[] = VO.map((l) => ({ t: l.t, end: l.end, text: l.text, words: l.words }));

// Scene boundaries (video seconds) follow the voice.
const S = {
  hook: [0, 5.3],
  one: [5.3, 10.8],
  two: [10.8, 17.0],
  three: [17.0, 21.2],
  four: [21.2, 29.3],
  payoff: [29.3, 31.9],
  end: [31.9, LENGTH3],
} as const;

const big: React.CSSProperties = { fontFamily: T.display, fontWeight: 800, letterSpacing: "-0.045em", color: T.fg, lineHeight: 0.95 };
const label: React.CSSProperties = { fontFamily: T.mono, fontSize: 22, letterSpacing: "0.18em", color: T.lilacSoft };
const glass: React.CSSProperties = {
  background: "linear-gradient(160deg, rgba(40,36,90,.82), rgba(16,16,48,.88))",
  border: "1.5px solid rgba(228,220,255,.28)",
  borderRadius: 28,
  boxShadow: "0 40px 100px rgba(3,4,18,.7), 0 0 70px rgba(188,165,238,.25)",
};
const pop = (t: number, at: number, d = 0.35) => tween(t, at, at + d, 0, 1, easeExpo);

// ---------- 0: hook ----------
const JOBS = ["BUILDER", "DESIGNER", "CREATOR", "MARKETER"];
const Hook: React.FC = () => {
  const t = useCurrentFrame() / 30;
  const merge = tween(t, 2.75, 3.25, 0, 1, easeInOut);
  const one = pop(t, 3.1, 0.4);
  return (
    <AbsoluteFill>
      {JOBS.map((j, i) => {
        const at = 0.15 + i * 0.5;
        const k = pop(t, at);
        if (t < at) return null;
        const y0 = 430 + i * 190;
        return (
          <div key={j} style={{ position: "absolute", left: 0, right: 0, top: y0 + (900 - y0) * merge, display: "flex", justifyContent: "center", opacity: (1 - merge) * k + merge * (1 - one) }}>
            <div style={{ ...glass, padding: "26px 48px", transform: `scale(${(0.6 + 0.4 * k) * (1 - 0.5 * merge)}) rotate(${(i % 2 ? 1 : -1) * (1 - k) * 8}deg)`, display: "flex", alignItems: "center", gap: 22 }}>
              <span style={{ ...label, fontSize: 24, color: T.dim }}>0{i + 1}</span>
              <span style={{ ...big, fontSize: 88 }}>{j}</span>
            </div>
          </div>
        );
      })}
      <div style={{ position: "absolute", top: 330, left: 0, right: 0, textAlign: "center", opacity: pop(t, 0.1) * (1 - merge), ...label }}>
        4 HIRES. 4 SALARIES. 4 CALENDARS.
      </div>
      {t > 3.0 && (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
          <div style={{ position: "absolute", width: 520, height: 520, borderRadius: "50%", background: `radial-gradient(circle, ${T.glow} 0%, transparent 70%)`, transform: `scale(${0.4 + one * 1.2})`, opacity: one }} />
          <div style={{ textAlign: "center", transform: `scale(${1.3 - 0.3 * one})`, opacity: one }}>
            <div style={{ ...big, fontSize: 170 }}>1 person</div>
            <div style={{ ...big, fontSize: 120, color: T.lilac, marginTop: 8 }}>+ AI</div>
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

// ---------- 1/4 products ----------
const PRODUCTS: { name: string; span: [number, number] }[] = [
  { name: "Biltib", span: [22.4, 24.6] },
  { name: "Moolank 365", span: [25.2, 26.0] },
  { name: "iCreateEpic", span: [26.0, 27.4] },
];
const One: React.FC = () => {
  const t = useCurrentFrame() / 30;
  return (
    <AbsoluteFill>
      {PRODUCTS.map((p, i) => {
        const at = 0.3 + i * 0.45;
        const k = pop(t, at, 0.5);
        if (t < at) return null;
        const live = pop(t, 2.0 + i * 0.2);
        return (
          <div key={p.name}>
            <SiteFrame width={760} x={(i - 1) * 150} y={-170 + (i - 1) * 250} rotateY={-14 + i * 4} rotateX={6} rotateZ={(i - 1) * -3} scale={0.6 + 0.4 * k} opacity={k} glow={0.7}>
              <RecSpans spans={[p.span]} durations={[5.5 - at]} />
            </SiteFrame>
            <div style={{ position: "absolute", left: 120 + i * 40, top: 420 + i * 250, opacity: live, transform: `translateX(${(1 - live) * -40}px)`, display: "flex", gap: 12, alignItems: "center" }}>
              <span style={{ ...glass, borderRadius: 40, padding: "8px 18px", fontFamily: T.sans, fontWeight: 700, fontSize: 28, color: T.fg }}>{p.name}</span>
              <span style={{ borderRadius: 40, padding: "8px 14px", background: T.lilac, color: T.bg, fontFamily: T.mono, fontSize: 20, letterSpacing: "0.12em", opacity: 0.6 + 0.4 * Math.abs(Math.sin(t * 4)) }}>● LIVE</span>
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ---------- 2/4 coded mini-tools (concepts) ----------
const Tool: React.FC<{ title: string; at: number; t: number; x: number; y: number; children: React.ReactNode }> = ({ title, at, t, x, y, children }) => {
  const k = pop(t, at, 0.45);
  if (t < at) return null;
  return (
    <div style={{ position: "absolute", left: x, top: y, width: 620, ...glass, padding: 30, transform: `perspective(1600px) rotateY(${(1 - k) * 30}deg) scale(${0.7 + 0.3 * k})`, opacity: k }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <span style={{ fontFamily: T.sans, fontWeight: 800, fontSize: 34, color: T.fg }}>{title}</span>
        <span style={{ ...label, fontSize: 16, border: `1px solid ${T.lilac}`, borderRadius: 20, padding: "4px 10px" }}>CONCEPT</span>
      </div>
      {children}
    </div>
  );
};
const Two: React.FC = () => {
  const t = useCurrentFrame() / 30;
  const answered = Math.min(4, Math.max(0, Math.floor((t - 0.8) / 0.55)));
  const fit = tween(t, 2.6, 3.6, 0, 1, easeInOut);
  const cost = Math.round(tween(t, 3.4, 4.6, 0, 1840, easeOut));
  return (
    <AbsoluteFill>
      <Tool title="Quiz" at={0.2} t={t} x={70} y={300}>
        <div style={{ fontFamily: T.sans, fontSize: 26, color: T.dim, marginBottom: 14 }}>Question {Math.min(5, answered + 1)} of 5</div>
        <div style={{ display: "flex", gap: 10 }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} style={{ flex: 1, height: 12, borderRadius: 6, background: i < answered ? T.lilac : "rgba(228,220,255,.15)" }} />
          ))}
        </div>
        <div style={{ marginTop: 18, display: "flex", gap: 12 }}>
          {["Curly", "Wavy", "Straight"].map((a, i) => (
            <div key={a} style={{ flex: 1, textAlign: "center", padding: "14px 0", borderRadius: 16, fontFamily: T.sans, fontWeight: 700, fontSize: 24, color: i === answered % 3 ? T.bg : T.fg, background: i === answered % 3 ? T.lilacSoft : "rgba(228,220,255,.08)" }}>{a}</div>
          ))}
        </div>
      </Tool>
      <Tool title="Fit finder" at={word("Quizzes. Calculators. Fit finders.", "Fit") - S.two[0] - 1.6} t={t} x={390} y={690}>
        {[["Waist", 0.62], ["Length", 0.4]].map(([n, v]) => (
          <div key={n as string} style={{ marginBottom: 18 }}>
            <div style={{ fontFamily: T.sans, fontSize: 22, color: T.dim, marginBottom: 8 }}>{n}</div>
            <div style={{ position: "relative", height: 10, borderRadius: 5, background: "rgba(228,220,255,.15)" }}>
              <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${(v as number) * fit * 100}%`, borderRadius: 5, background: T.lilac }} />
              <div style={{ position: "absolute", top: -9, left: `calc(${(v as number) * fit * 100}% - 14px)`, width: 28, height: 28, borderRadius: 14, background: T.fg }} />
            </div>
          </div>
        ))}
        <div style={{ fontFamily: T.sans, fontWeight: 800, fontSize: 30, color: T.lilacSoft, opacity: fit > 0.98 ? 1 : 0.25 }}>✓ Your fit: 32 / Regular</div>
      </Tool>
      <Tool title="Cost calculator" at={word("Quizzes. Calculators. Fit finders.", "Calc") - S.two[0] - 0.9} t={t} x={110} y={1030}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
          <span style={{ ...big, fontSize: 84 }}>₹{cost.toLocaleString("en-IN")}</span>
          <span style={{ fontFamily: T.sans, fontSize: 24, color: T.dim }}>saved / year</span>
        </div>
        <div style={{ ...label, fontSize: 15, marginTop: 6, color: T.dim }}>EXAMPLE OUTPUT</div>
      </Tool>
    </AbsoluteFill>
  );
};

// ---------- 3/4 creative + playground ----------
const Three: React.FC = () => {
  const t = useCurrentFrame() / 30;
  const k = pop(t, 0.1, 0.5);
  const n = Math.min(10, Math.max(1, Math.floor(tween(t, 1.6, 4.0, 1, 10.99, (x) => x))));
  return (
    <AbsoluteFill>
      <SiteFrame width={900} y={-140} rotateX={8} rotateY={-6} scale={0.85 + 0.15 * k} opacity={k}>
        <RecSpans spans={[[43.8, 45.8], [54.0, 58.5]]} durations={[1.6, 2.6]} />
      </SiteFrame>
      <div style={{ position: "absolute", top: 940, left: 0, right: 0, textAlign: "center", opacity: pop(t, 1.6) }}>
        <span style={{ ...big, fontSize: 130, color: T.lilac }}>{String(n).padStart(2, "0")}</span>
        <span style={{ ...big, fontSize: 60, color: T.dim }}>/10</span>
        <div style={{ ...label, marginTop: 6 }}>ORIGINAL WEB EXPERIMENTS</div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- 4/4 campaigns ----------
const CH = ["Meta", "Google", "Reddit", "Amazon"];
const Four: React.FC = () => {
  const t = useCurrentFrame() / 30;
  const base = S.four[0];
  const pennies = word("Clicks for pennies. Real sign-ups.", "pennies") - base;
  const signups = word("Clicks for pennies. Real sign-ups.", "sign") - base;
  const drop = tween(t, pennies - 0.25, pennies + 0.15, -500, 0, easeExpo);
  const chart = tween(t, 0.4, 3.0, 0, 1, easeInOut);
  const pts = Array.from({ length: 24 }, (_, i) => [i * 26, 150 - Math.pow(i / 23, 1.6) * 120 - random(`c${i}`) * 18]);
  const shown = pts.slice(0, Math.max(2, Math.round(chart * pts.length)));
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 90, top: 380, width: 900, ...glass, padding: 30, opacity: pop(t, 0.1) }}>
        <div style={{ ...label, fontSize: 18, color: T.dim, marginBottom: 10 }}>REDDIT CAMPAIGN · SNAPSHOT</div>
        <svg width={840} height={170}>
          <polyline points={shown.map(([x, y]) => `${x * 1.35},${y}`).join(" ")} fill="none" stroke={T.lilac} strokeWidth={5} style={{ filter: `drop-shadow(0 0 10px ${T.lilac})` }} />
        </svg>
        <div style={{ display: "flex", gap: 40, marginTop: 6 }}>
          {[["Clicks", Math.round(chart * 1999).toLocaleString("en-US")], ["Spend", `$${(chart * 59.17).toFixed(2)}`]].map(([a, b]) => (
            <div key={a}>
              <div style={{ fontFamily: T.sans, fontSize: 22, color: T.dim }}>{a}</div>
              <div style={{ ...big, fontSize: 56 }}>{b}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ position: "absolute", left: 90, top: 760, width: 900, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {CH.map((c) => {
          const at = word("Meta, Google, Reddit, Amazon.", c) - base;
          const k = pop(t, at, 0.3);
          return (
            <div key={c} style={{ ...glass, padding: "26px 30px", opacity: t < at ? 0.15 : k, transform: `scale(${t < at ? 0.92 : 0.9 + 0.1 * k})`, borderColor: t >= at ? T.lilac : undefined }}>
              <span style={{ ...big, fontSize: 64 }}>{c}</span>
            </div>
          );
        })}
      </div>
      {t > pennies - 0.3 && (
        <div style={{ position: "absolute", right: 70, top: 640, transform: `translateY(${drop}px) rotate(${-8 + 8 * pop(t, pennies)}deg)`, ...glass, background: T.lilacSoft, padding: "18px 28px" }}>
          <div style={{ ...big, fontSize: 72, color: T.bg }}>$0.03</div>
          <div style={{ fontFamily: T.mono, fontSize: 20, color: T.ink, letterSpacing: "0.1em" }}>PER CLICK</div>
        </div>
      )}
      {t > signups && (
        <div style={{ position: "absolute", left: 90, top: 1070, ...glass, padding: "16px 26px", opacity: pop(t, signups), display: "flex", gap: 16, alignItems: "center" }}>
          <span style={{ width: 18, height: 18, borderRadius: 9, background: "#7be3b0", boxShadow: "0 0 18px #7be3b0" }} />
          <span style={{ fontFamily: T.sans, fontWeight: 800, fontSize: 36, color: T.fg }}>New sign-up</span>
        </div>
      )}
    </AbsoluteFill>
  );
};

// ---------- payoff: the ad rewinds into its own code ----------
const SRC = (CODE_FILES.find((f) => f.name === "AdVideo.tsx") ?? CODE_FILES[0]).text.split("\n");
const Payoff: React.FC = () => {
  const t = useCurrentFrame() / 30;
  const k = pop(t, 0.15, 0.4);
  const scroll = tween(t, 0.2, 2.6, 0, 900, easeInOut);
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 60, right: 60, top: 300, height: 900, ...glass, overflow: "hidden", padding: "24px 0", opacity: k, transform: `scale(${1.15 - 0.15 * k})` }}>
        <div style={{ ...label, fontSize: 18, padding: "0 28px 14px" }}>AdVideo.tsx · THIS AD</div>
        <div style={{ transform: `translateY(${-scroll}px)`, fontSize: 19, lineHeight: "30px" }}>
          {SRC.slice(0, 80).map((l, i) => (
            <div key={i} style={{ display: "flex", padding: "0 24px" }}>
              <span style={{ width: 48, color: "#55537a", fontFamily: T.mono }}>{i + 1}</span>
              <CodeLine text={l.slice(0, 70)} />
            </div>
          ))}
        </div>
      </div>
      <AbsoluteFill style={{ background: "#fff", opacity: Math.max(0, 1 - t / 0.12) * 0.6 }} />
    </AbsoluteFill>
  );
};

// ---------- end card ----------
const End: React.FC = () => {
  const t = useCurrentFrame() / 30;
  const tap = word("Tap the link.", "Tap") - S.end[0];
  const pulse = 1 + 0.06 * Math.max(0, Math.sin((t - tap) * 7)) * (t > tap ? 1 : 0);
  return (
    <AbsoluteFill style={{ alignItems: "center" }}>
      <div style={{ position: "absolute", top: 420, textAlign: "center", opacity: pop(t, 0.1), transform: `translateY(${(1 - pop(t, 0.1)) * 40}px)` }}>
        <div style={label}>ONE PERSON · BUILT WITH AI</div>
        <div style={{ ...big, fontSize: 118, marginTop: 18 }}>Suyash Kashyap</div>
        <div style={{ fontFamily: T.sans, fontWeight: 500, fontSize: 36, color: T.lilacSoft, marginTop: 14 }}>Products · Tools · Creative · Campaigns</div>
      </div>
      <div style={{ position: "absolute", top: 860, opacity: pop(t, 0.5), transform: `scale(${pulse})` }}>
        <div style={{ borderRadius: 60, padding: "26px 54px", background: T.lilacSoft, color: T.bg, fontFamily: T.display, fontWeight: 800, fontSize: 52, boxShadow: `0 0 80px ${T.glow}` }}>
          See what I can build ↗
        </div>
      </div>
      <div style={{ position: "absolute", top: 1010, fontFamily: T.mono, fontSize: 28, color: T.dim, opacity: pop(t, 0.8) }}>pilotaccess.com/suyashpow</div>
      {t > tap && (
        <div style={{ position: "absolute", top: 1120, ...big, fontSize: 64, color: T.lilac, transform: `translateY(${Math.sin(t * 6) * 12}px)`, opacity: pop(t, tap) }}>
          Tap the link ↓
        </div>
      )}
    </AbsoluteFill>
  );
};

// ---------- 1/4 → 4/4 progress (keeps people watching) ----------
const Progress: React.FC = () => {
  const t = useCurrentFrame() / 30;
  const steps = [S.one[0], S.two[0], S.three[0], S.four[0]];
  const n = steps.filter((s) => t >= s).length;
  if (t < S.one[0] || t >= S.payoff[0]) return null;
  const k = pop(t, steps[n - 1], 0.35);
  return (
    <div style={{ position: "absolute", top: 290, left: 90, right: 90, display: "flex", alignItems: "center", gap: 24 }}>
      <span style={{ ...big, fontSize: 64, color: T.lilac, transform: `scale(${1.4 - 0.4 * k})` }}>{n}/4</span>
      <div style={{ flex: 1, height: 10, borderRadius: 5, background: "rgba(228,220,255,.15)", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${((n - 1 + k) / 4) * 100}%`, background: T.lilac, boxShadow: `0 0 16px ${T.lilac}` }} />
      </div>
    </div>
  );
};

const SCENES: [readonly [number, number], React.FC][] = [
  [S.hook, Hook], [S.one, One], [S.two, Two], [S.three, Three], [S.four, Four], [S.payoff, Payoff], [S.end, End],
];

// Sound effects only, on the visual hits. Music is added by the user.
type Cue = [string, number, number];
const SFX: Cue[] = [
  ...[0.15, 0.65, 1.15, 1.65].map((a): Cue => ["click", a, 0.5]),
  ["whoosh", 2.75, 0.5], ["hit", 3.1, 0.7],
  ...[S.one[0], S.two[0], S.three[0], S.four[0]].map((a): Cue => ["hit", a, 0.45]),
  ...[5.6, 6.05, 6.5].map((a): Cue => ["whoosh", a, 0.25]),
  ...CH.map((c): Cue => ["click", word("Meta, Google, Reddit, Amazon.", c), 0.45]),
  ["hit", word("Clicks for pennies. Real sign-ups.", "pennies"), 0.6],
  ["shimmer", word("Clicks for pennies. Real sign-ups.", "sign"), 0.5],
  ["whoosh", S.payoff[0], 0.5], ["shimmer", S.end[0] + 0.5, 0.5],
  ["hit", word("Tap the link.", "Tap"), 0.5],
];

export const AdVideo: React.FC = () => (
  <AbsoluteFill style={{ background: T.bg }}>
    <Sky opacity={0.45} blur={4} />
    <Particles count={50} color={T.lilacSoft} opacity={0.35} seed="ad" />
    {SCENES.map(([[a, b], C], i) => (
      <Sequence key={i} from={sec(a)} durationInFrames={sec(b) - sec(a)}>
        <C />
      </Sequence>
    ))}
    <Progress />
    <Captions lines={LINES3} y={1270} font={T.display} accent={T.lilacSoft} />
    <Grain />
    <Audio src={staticFile("v3/vo.mp3")} />
    {SFX.map(([f, at, v], i) => (
      <Sequence key={i} from={sec(at)} layout="none">
        <Audio src={staticFile(`sfx/${f}.wav`)} volume={v} />
      </Sequence>
    ))}
  </AbsoluteFill>
);
