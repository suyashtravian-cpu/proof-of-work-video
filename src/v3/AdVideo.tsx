// Paid ad (Instagram/Facebook, 9:16): "One person. Four jobs. Built with AI."
// Voice: the approved take at 1.1x (public/v3/vo-fast.wav), timings in src/v3/vo-fast.json.
// Motion: the second video's language. Depth flights, whip cuts, tracking callouts, a camera that never stops.
// Voice + sound effects only. Safe zones: nothing key above y 270 or below y 1530.
import { AbsoluteFill, Audio, Sequence, interpolate, random, staticFile, useCurrentFrame } from "remotion";
import { Captions } from "../components/Captions";
import { CodeLine } from "../components/Code";
import { Grain } from "../components/Grain";
import { loadFonts } from "../fonts";
import { CODE_FILES } from "../generated/code";
import type { Line } from "../script";
import { sec } from "../timing";
import { RecSpans } from "../v2/components/Rec";
import { SiteFrame } from "../v2/components/SiteFrame";
import { Bracket, Flash, Ripple, Sparks, SpringLetters, Tag, clamp01, ease, lerp, prog, springAt, track } from "../v2/scenes/campaigns-lab/kit";
import { Numeral } from "../v2/scenes/campaigns-lab/Numeral";
import { Bokeh, Dust, GlassCards, SkyPlate, Streaks, Sweep } from "../v2/scenes/hook-intro/World";
import { DrawBox } from "../v2/scenes/manifesto-work/callouts";
import { DropBurst } from "../v2/scenes/manifesto-work/DropBurst";
import { EndBackdrop } from "../v2/scenes/onemind-cta-end/Backdrop";
import { theme2 as T } from "../v2/theme";
import { AdHook, HOOK } from "./AdHook";
import VO from "./vo-fast.json";

loadFonts();

// Voice ends at 30.96 s; the end card holds ~2.2 s more.
export const LENGTH3 = 33.2;
const FIT = 14.62; // "Fit finders" (measured in the audio; the aligner merged it into "calculators")
const word = (i: number, w: string) => VO[i].words.find((x) => x.w.toLowerCase().startsWith(w.toLowerCase()))?.s ?? VO[i].t;
const LINES3: Line[] = VO.map((l, i) =>
  i === 1
    ? { ...l, kinetic: true } // "1 person + AI" is the caption
    : i === 5
      ? { ...l, end: 15.3, words: [{ w: "Quizzes.", s: 13.145, e: 13.5 }, { w: "Calculators.", s: 13.75, e: 14.4 }, { w: "Fit", s: FIT, e: 14.85 }, { w: "finders.", s: 14.85, e: 15.3 }] }
      : { t: l.t, end: l.end, text: l.text, words: l.words },
);

// Scene boundaries (video seconds), each just before its line.
const S = {
  hook: [0, 4.8],
  one: [4.8, 9.75],
  two: [9.75, 15.45],
  three: [15.45, 19.22],
  four: [19.22, 26.6],
  payoff: [26.6, 28.95],
  end: [28.95, LENGTH3],
} as const;

const big: React.CSSProperties = { fontFamily: T.display, fontWeight: 800, letterSpacing: "-0.045em", color: T.fg, lineHeight: 0.95 };
const label: React.CSSProperties = { fontFamily: T.mono, fontSize: 22, letterSpacing: "0.18em", color: T.lilacSoft };
const glass: React.CSSProperties = {
  background: "linear-gradient(160deg, rgba(40,36,90,.86), rgba(16,16,48,.92))",
  border: "1.5px solid rgba(228,220,255,.28)",
  borderRadius: 28,
  boxShadow: "0 40px 100px rgba(3,4,18,.7), 0 0 70px rgba(188,165,238,.25)",
};
const shine: React.CSSProperties = {
  background: `linear-gradient(180deg, ${T.paper} 18%, ${T.lilacSoft} 55%, ${T.lilac} 100%)`,
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  filter: "drop-shadow(0 0 30px rgba(188,165,238,.65)) drop-shadow(0 16px 40px rgba(3,4,18,.7))",
};
const useT = () => useCurrentFrame() / 30;
/** Decaying punch (scale kick) after `at`. */
const kick = (t: number, at: number, amp = 0.08) => (t < at ? 0 : amp * Math.sin((t - at) * 20) * Math.exp(-(t - at) * 8));

/** Flies its children in from deep in the sky (overshooting toward the lens) and out past the camera. */
const Depth: React.FC<{
  t: number;
  at: number;
  out?: number;
  o: [number, number];
  from?: { x?: number; y?: number; rx?: number; ry?: number; rz?: number };
  dim?: number;
  children: React.ReactNode;
}> = ({ t, at, out = 1e9, o, from = {}, dim = 0, children }) => {
  if (t < at) return null;
  const k = springAt(t, at, 13, 0.6, 165);
  const ko = prog(t, out, out + 0.22, ease.in);
  if (ko >= 1) return null;
  const u = 1 - k;
  const z = interpolate(k, [0, 1, 1.3], [-3600, 0, 260], { extrapolateRight: "clamp" }) + ko * 1300;
  const blur = Math.max(0, u) * 16 + ko * 14;
  const f = [blur > 0.4 ? `blur(${blur.toFixed(1)}px)` : "", dim > 0.01 ? `brightness(${1 - dim})` : ""].join(" ").trim();
  return (
    <AbsoluteFill
      style={{
        transformOrigin: `${o[0]}px ${o[1]}px`,
        transform: `perspective(1500px) translate3d(${(from.x ?? 0) * u}px, ${(from.y ?? 0) * u}px, ${z}px) rotateX(${(from.rx ?? 0) * u}deg) rotateY(${(from.ry ?? 0) * u}deg) rotateZ(${(from.rz ?? 0) * u}deg)`,
        opacity: clamp01(k * 3) * (1 - ko),
        filter: f || undefined,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

/** Every shot: constant drift and push, a whip in (from below, blurred) and a whip out (up, blurred). */
const Shot: React.FC<{ dur: number; enter?: boolean; seed: number; children: React.ReactNode }> = ({ dur, enter = true, seed, children }) => {
  const t = useT();
  const ein = enter ? 1 - ease.expo(clamp01(t / 0.26)) : 0;
  const eout = ease.in(clamp01((t - dur + 0.16) / 0.16));
  const dir = seed % 2 ? 1 : -1;
  const x = 16 * Math.sin(t * 1.25 + seed) + dir * 70 * (ein - eout);
  const y = 12 * Math.cos(t * 1.05 + seed * 2) + 480 * ein - 560 * eout;
  const r = 0.5 * Math.sin(t * 0.9 + seed) + dir * 4 * (ein + eout);
  const s = (1.04 + 0.05 * (t / dur)) * (1 + 0.16 * ein + 0.12 * eout);
  const blur = 22 * (ein + eout);
  return (
    <AbsoluteFill
      style={{
        transformOrigin: "540px 900px",
        transform: `translate(${x}px, ${y}px) rotate(${r}deg) scale(${s})`,
        filter: blur > 0.4 ? `blur(${blur.toFixed(1)}px)` : undefined,
        opacity: 1 - 0.7 * eout,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

// ---------- 1/4 products: three live sites fly in through the sky and stack in depth ----------
const PRODUCTS: { name: string; span: [number, number]; at: number }[] = [
  { name: "Biltib", span: [22.4, 24.6], at: 0.12 },
  { name: "Moolank 365", span: [25.2, 26.0], at: 0.85 },
  { name: "iCreateEpic", span: [26.0, 27.4], at: 1.5 },
];
const FRONT = [0, -170, -6, 1, 0];
const SLOT = [
  [-300, -440, 26, 0.6, 0.35],
  [300, -440, -26, 0.6, 0.35],
];
const One: React.FC = () => {
  const t = useT();
  const b = S.one[0];
  const idea = word(3, "idea") - b;
  const live = word(3, "live") - b;
  const days = word(3, "days") - b;
  const not = word(3, "not") - b;
  const tilt = springAt(t, days - 0.2, 14, 0.7, 120);
  const dur = S.one[1] - b;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ transformOrigin: "540px 790px", transform: `translateY(${-110 * tilt}px) scale(${1 - 0.1 * tilt})` }}>
        {PRODUCTS.map((p, i) => {
          const next = PRODUCTS[i + 1];
          const m = next ? springAt(t, next.at, 14, 0.6, 140) : 0;
          const to = next ? SLOT[i] : FRONT;
          const [x, y, ry, sc, dim] = FRONT.map((v, j) => lerp(v, to[j], m));
          return (
            <Depth key={p.name} t={t} at={p.at} o={[540, 790]} from={{ x: (i - 1) * 380, y: 200, ry: (i % 2 ? -1 : 1) * 50, rz: (i - 1) * 8 }} dim={dim}>
              <SiteFrame width={880} x={x + 8 * Math.sin(t * 1.3 + i)} y={y + 10 * Math.cos(t * 1.1 + i)} rotateX={5} rotateY={ry + 4 * Math.sin(t * 1.2 + i * 2)} rotateZ={(i - 1) * -1.5} scale={sc} glow={0.8}>
                <RecSpans spans={[p.span]} durations={[dur - p.at]} from={p.at} />
              </SiteFrame>
            </Depth>
          );
        })}
      </AbsoluteFill>
      {PRODUCTS.map((p, i) => (
        <Tag key={p.name} x={540} y={1135} t={t} at={p.at + 0.2} out={PRODUCTS[i + 1]?.at ?? idea - 0.1} anchor="c" variant="glass" size={32}>
          {p.name} <span style={{ color: T.lilac }}>● live</span>
        </Tag>
      ))}
      <Tag x={330} y={1135} t={t} at={idea} out={days - 0.25} anchor="c" variant="glass" size={34}>
        Idea
      </Tag>
      {t > idea + 0.1 && t < days - 0.1 && (
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: 1 - prog(t, days - 0.3, days - 0.1) }}>
          <line x1={430} y1={1135} x2={430 + 200 * prog(t, idea + 0.15, live, ease.out)} y2={1135} stroke={T.lilac} strokeWidth={5} strokeLinecap="round" strokeDasharray="2 12" style={{ filter: `drop-shadow(0 0 8px ${T.lilac})` }} />
        </svg>
      )}
      <Tag x={750} y={1135} t={t} at={live} out={days - 0.25} anchor="c" variant="lilac" size={34}>
        Live ●
      </Tag>
      <Ripple x={750} y={1135} t={t} at={live} size={150} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 960, display: "flex", justifyContent: "center", transform: `scale(${1 + kick(t, days, 0.1)})` }}>
        <SpringLetters text="In days" t={t} at={days} size={170} stagger={0.03} color={T.lilacSoft} style={{ textShadow: `0 0 40px ${T.glow}, 0 14px 50px rgba(9,13,37,.9)` }} out={dur - 0.18} />
      </div>
      {t > not && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 1150, display: "flex", justifyContent: "center" }}>
          <div style={{ position: "relative" }}>
            <SpringLetters text="not months" t={t} at={not} size={66} stagger={0.02} color={T.dim} out={dur - 0.18} />
            <div style={{ position: "absolute", left: -10, top: "52%", height: 7, borderRadius: 4, background: T.lilac, boxShadow: `0 0 14px ${T.lilac}`, width: `calc(${prog(t, not + 0.15, not + 0.4, ease.out) * 100}% + 20px)` }} />
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

// ---------- 2/4 coded mini-tools (concepts, no real brands) ----------
const Card: React.FC<{ title: string; x: number; y: number; dim: number; children: React.ReactNode }> = ({ title, x, y, dim, children }) => (
  <div style={{ position: "absolute", left: x, top: y, width: 620, ...glass, padding: 30, filter: dim > 0.01 ? `brightness(${1 - dim})` : undefined }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
      <span style={{ fontFamily: T.sans, fontWeight: 800, fontSize: 36, color: T.fg }}>{title}</span>
      <span style={{ ...label, fontSize: 16, border: `1px solid ${T.lilac}`, borderRadius: 20, padding: "4px 10px" }}>CONCEPT</span>
    </div>
    {children}
  </div>
);
const Two: React.FC = () => {
  const t = useT();
  const b = S.two[0];
  const quiz = word(5, "quiz") - b;
  const calc = word(5, "calc") - b;
  const fitW = FIT - b;
  const decide = word(4, "decide") - b;
  const answered = Math.min(4, Math.max(0, Math.floor((t - 0.55) / 0.42)));
  const fit = prog(t, 1.0, decide, ease.inOut);
  const cost = Math.round(lerp(0, 1840, prog(t, 1.5, 2.7, ease.out)));
  // The camera whips to each tool as it is named.
  const cam = (i: number) =>
    track(t, [
      [0, [0, 0, 1][i]],
      [quiz - 0.1, [0, 0, 1.03][i]],
      [quiz + 0.12, [40, 230, 1.12][i], ease.expo],
      [calc - 0.1, [40, 230, 1.13][i]],
      [calc + 0.12, [30, -110, 1.12][i], ease.expo],
      [fitW - 0.1, [30, -110, 1.13][i]],
      [fitW + 0.12, [-90, 60, 1.12][i], ease.expo],
      [6, [-90, 60, 1.15][i]],
    ]);
  const spot = t < quiz ? -1 : t < calc ? 0 : t < fitW ? 2 : 1;
  const dimOf = (i: number) => (spot < 0 || spot === i ? 0 : 0.55);
  const tap = (i: number) => 0.55 + i * 0.42;
  return (
    <AbsoluteFill style={{ transformOrigin: "540px 900px", transform: `translate(${cam(0)}px, ${cam(1)}px) scale(${cam(2)})` }}>
      <Depth t={t} at={0.18} o={[370, 510]} from={{ x: -520, ry: 60, rz: -6 }}>
        <Card title="Quiz" x={60} y={380} dim={dimOf(0)}>
          <div style={{ fontFamily: T.sans, fontSize: 26, color: T.dim, marginBottom: 14 }}>Question {Math.min(5, answered + 1)} of 5</div>
          <div style={{ display: "flex", gap: 10 }}>
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} style={{ flex: 1, height: 12, borderRadius: 6, background: i < answered ? T.lilac : "rgba(228,220,255,.15)", boxShadow: i < answered ? `0 0 12px ${T.lilac}` : undefined }} />
            ))}
          </div>
          <div style={{ marginTop: 18, display: "flex", gap: 12 }}>
            {["Curly", "Wavy", "Straight"].map((a, i) => {
              const on = i === answered % 3;
              return (
                <div key={a} style={{ flex: 1, textAlign: "center", padding: "14px 0", borderRadius: 16, fontFamily: T.sans, fontWeight: 700, fontSize: 24, color: on ? T.bg : T.fg, background: on ? T.lilacSoft : "rgba(228,220,255,.08)", transform: `scale(${1 + (on ? kick(t, tap(answered - 1), 0.12) : 0)})` }}>
                  {a}
                </div>
              );
            })}
          </div>
        </Card>
        {[0, 1, 2, 3].map((i) => (
          <Ripple key={i} x={170 + ((i + 1) % 3) * 200} y={580} t={t} at={tap(i)} size={90} />
        ))}
      </Depth>
      <Depth t={t} at={0.62} o={[710, 835]} from={{ x: 520, ry: -60, rz: 6 }}>
        <Card title="Fit finder" x={400} y={690} dim={dimOf(1)}>
          {(
            [
              ["Waist", 0.62],
              ["Length", 0.4],
            ] as const
          ).map(([n, v]) => (
            <div key={n} style={{ marginBottom: 18 }}>
              <div style={{ fontFamily: T.sans, fontSize: 22, color: T.dim, marginBottom: 8 }}>{n}</div>
              <div style={{ position: "relative", height: 10, borderRadius: 5, background: "rgba(228,220,255,.15)" }}>
                <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${v * fit * 100}%`, borderRadius: 5, background: T.lilac }} />
                <div style={{ position: "absolute", top: -9, left: `calc(${v * fit * 100}% - 14px)`, width: 28, height: 28, borderRadius: 14, background: T.fg, boxShadow: `0 0 14px ${T.lilac}` }} />
              </div>
            </div>
          ))}
          <div style={{ fontFamily: T.sans, fontWeight: 800, fontSize: 30, color: T.lilacSoft, opacity: t > decide ? 1 : 0.25, transform: `scale(${1 + kick(t, decide, 0.14)})`, transformOrigin: "0% 50%" }}>✓ Your fit: 32 / Regular</div>
        </Card>
      </Depth>
      <Depth t={t} at={1.08} o={[390, 1105]} from={{ y: 520, rx: -55 }}>
        <Card title="Cost calculator" x={80} y={1000} dim={dimOf(2)}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
            <span style={{ ...big, fontSize: 84 }}>₹{cost.toLocaleString("en-IN")}</span>
            <span style={{ fontFamily: T.sans, fontSize: 24, color: T.dim }}>saved / year</span>
          </div>
          <div style={{ ...label, fontSize: 15, marginTop: 6, color: T.dim }}>EXAMPLE OUTPUT</div>
        </Card>
      </Depth>
      <Sparks cx={580} cy={980} t={t} at={decide} seed="fit" n={20} reach={300} />
      <Bracket x0={48} y0={368} x1={692} y1={648} t={t} at={quiz} out={calc - 0.1} />
      <Bracket x0={68} y0={988} x1={712} y1={1240} t={t} at={calc} out={fitW - 0.1} />
      <Bracket x0={388} y0={678} x1={1032} y1={985} t={t} at={fitW} />
    </AbsoluteFill>
  );
};

// ---------- 3/4 creative + playground ----------
const Three: React.FC = () => {
  const t = useT();
  const b = S.three[0];
  const cre = word(6, "creative") - b;
  const stop = word(6, "stop") - b;
  const dur = S.three[1] - b;
  const n = Math.min(10, Math.max(1, 1 + Math.floor((t - cre) / 0.16)));
  const stepAt = cre + (n - 1) * 0.16;
  const punch = kick(t, stop, 0.07) + kick(t, 1.62, 0.05);
  return (
    <AbsoluteFill>
      <Depth t={t} at={0.1} o={[540, 720]} from={{ y: 260, rx: 40 }}>
        <SiteFrame width={940} y={-240 + 10 * Math.sin(t * 1.4)} rotateX={6 * Math.cos(t * 1.1)} rotateY={-7 + 5 * Math.sin(t * 1.3)} scale={1 + punch} glow={1}>
          <RecSpans spans={[[43.8, 45.8], [54.0, 58.5]]} durations={[1.52, dur - 1.62]} from={0.1} />
        </SiteFrame>
      </Depth>
      <Flash t={t} at={1.62} dur={0.22} peak={0.4} />
      <DrawBox t={t} at={stop} x={58} y={392} w={964} h={658} s={1} />
      <Tag x={100} y={470} t={t} at={stop + 0.1} variant="lilac" size={30}>
        Stops the scroll
      </Tag>
      {t > cre && (
        <div style={{ position: "absolute", top: 1068, left: 0, right: 0, textAlign: "center" }}>
          <span style={{ ...big, ...shine, fontSize: 150, display: "inline-block", transform: `scale(${1 + kick(t, stepAt, 0.12)})` }}>{String(n).padStart(2, "0")}</span>
          <span style={{ ...big, fontSize: 64, color: T.dim }}>/10</span>
          <div style={{ ...label, marginTop: 6, opacity: prog(t, cre + 0.2, cre + 0.4) }}>ORIGINAL WEB EXPERIMENTS</div>
        </div>
      )}
      <Sparks cx={540} cy={1140} t={t} at={cre + 9 * 0.16} seed="ten" n={22} reach={380} />
    </AbsoluteFill>
  );
};

// ---------- 4/4 campaigns ----------
const CH = ["Meta", "Google", "Reddit", "Amazon"];
const Four: React.FC = () => {
  const t = useT();
  const b = S.four[0];
  const clicks = word(9, "clicks") - b;
  const pennies = word(9, "pennies") - b;
  const signups = word(9, "sign") - b;
  const camp = word(7, "campaigns") - b;
  const chart = prog(t, 0.35, camp + 1.3, ease.inOut);
  const pts = Array.from({ length: 24 }, (_, i) => [i * 26, 150 - Math.pow(i / 23, 1.6) * 120 - random(`c${i}`) * 18]);
  const shown = pts.slice(0, Math.max(2, Math.round(chart * pts.length)));
  const chAt = CH.map((c) => word(8, c) - b);
  const camY = track(t, [
    [0, 60],
    [chAt[0] - 0.15, 60],
    [chAt[0] + 0.15, -10, ease.expo],
    [clicks - 0.1, -10],
    [clicks + 0.15, 110, ease.expo],
    [7.4, 70],
  ]);
  const camS = track(t, [
    [0, 1.06],
    [chAt[0] - 0.15, 1.0],
    [clicks + 0.15, 1.08, ease.expo],
    [7.4, 1.04],
  ]);
  const shake = kick(t, pennies, 22);
  const tiles = 1 - prog(t, pennies - 0.1, pennies + 0.2, ease.in) * 0.55;
  return (
    <AbsoluteFill style={{ transformOrigin: "540px 760px", transform: `translate(${shake}px, ${camY + shake * 0.6}px) scale(${camS})` }}>
      <Depth t={t} at={0.2} o={[540, 560]} from={{ y: -300, rx: 50 }}>
        <div style={{ position: "absolute", left: 90, top: 370, width: 900, ...glass, padding: 30 }}>
          <div style={{ ...label, fontSize: 18, color: T.dim, marginBottom: 10 }}>REDDIT CAMPAIGN · SNAPSHOT</div>
          <svg width={840} height={160}>
            <polyline points={shown.map(([x, y]) => `${x * 1.35},${y}`).join(" ")} fill="none" stroke={T.lilac} strokeWidth={5} style={{ filter: `drop-shadow(0 0 10px ${T.lilac})` }} />
            {(() => {
              const [x, y] = shown[shown.length - 1];
              return <circle cx={x * 1.35} cy={y} r={9} fill={T.lilacSoft} />;
            })()}
          </svg>
          <div style={{ display: "flex", gap: 60, marginTop: 10, alignItems: "flex-end" }}>
            <div style={{ transform: `scale(${1 + kick(t, clicks, 0.12)})`, transformOrigin: "0% 100%" }}>
              <div style={{ fontFamily: T.sans, fontSize: 22, color: T.dim, marginBottom: 6 }}>Clicks</div>
              <Numeral value={chart * 1999} size={104} />
            </div>
            <div>
              <div style={{ fontFamily: T.sans, fontSize: 22, color: T.dim, marginBottom: 6 }}>Spend</div>
              <div style={{ ...big, fontSize: 84 }}>${(chart * 59.17).toFixed(2)}</div>
            </div>
          </div>
        </div>
      </Depth>
      <Bracket x0={100} y0={598} x1={400} y1={752} t={t} at={clicks} out={pennies - 0.1} />
      <div style={{ position: "absolute", left: 90, top: 800, width: 900, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, opacity: tiles }}>
        {CH.map((c, i) => {
          const at = chAt[i];
          const k = springAt(t, at, 11, 0.5, 190);
          const z = t < at ? 0 : interpolate(k, [0, 1, 1.3], [-2400, 0, 200], { extrapolateRight: "clamp" });
          return (
            <div key={c} style={{ position: "relative", perspective: 1200 }}>
              <div
                style={{
                  ...glass,
                  padding: "24px 30px",
                  opacity: t < at ? 0.12 : clamp01(k * 3),
                  transform: `translateZ(${z}px) rotateX(${(1 - Math.min(1, k)) * 50}deg)`,
                  borderColor: t >= at ? T.lilac : undefined,
                }}
              >
                <span style={{ ...big, fontSize: 64 }}>{c}</span>
              </div>
            </div>
          );
        })}
      </div>
      {CH.map((c, i) => (
        <Sparks key={c} cx={i % 2 ? 770 : 310} cy={i < 2 ? 855 : 984} t={t} at={chAt[i]} seed={`ch${i}`} n={16} reach={280} />
      ))}
      {t > pennies - 0.3 && (
        <div
          style={{
            position: "absolute",
            left: 540,
            top: 930,
            transform: `translate(-50%, -50%) translateY(${interpolate(springAt(t, pennies - 0.18, 12, 0.6, 200), [0, 1], [-900, 0])}px) rotate(${-6 + 3 * Math.sin(t * 2)}deg) scale(${1 + kick(t, pennies, 0.1)})`,
            ...glass,
            background: "linear-gradient(160deg, rgba(60,50,130,.95), rgba(20,18,58,.96))",
            border: `2px solid ${T.lilac}`,
            padding: "22px 44px",
            textAlign: "center",
          }}
        >
          <div style={{ ...big, ...shine, fontSize: 150 }}>$0.03</div>
          <div style={{ ...label, fontSize: 26, marginTop: 6 }}>PER CLICK</div>
        </div>
      )}
      <Sparks cx={540} cy={930} t={t} at={pennies} seed="pen" n={34} reach={620} />
      {[0, 0.26].map((d, i) =>
        t > signups + d ? (
          <div
            key={i}
            style={{
              position: "absolute",
              left: i ? 400 : 120,
              top: i ? 550 : 470,
              ...glass,
              borderRadius: 40,
              padding: "14px 26px",
              display: "flex",
              gap: 16,
              alignItems: "center",
              opacity: clamp01(springAt(t, signups + d, 11, 0.5, 190) * 2),
              transform: `translateX(${(1 - springAt(t, signups + d, 11, 0.5, 190)) * (i ? 300 : -300)}px)`,
            }}
          >
            <span style={{ width: 18, height: 18, borderRadius: 9, background: "#7be3b0", boxShadow: "0 0 18px #7be3b0" }} />
            <span style={{ fontFamily: T.sans, fontWeight: 800, fontSize: 34, color: T.fg }}>New sign-up</span>
          </div>
        ) : null,
      )}
    </AbsoluteFill>
  );
};

// ---------- payoff: this ad, as code ----------
const SRC = (CODE_FILES.find((f) => f.name === "AdVideo.tsx") ?? CODE_FILES[0]).text.split("\n");
const Payoff: React.FC = () => {
  const t = useT();
  const b = S.payoff[0];
  const ad = word(10, "ad") - b;
  const made = word(10, "made") - b;
  const scroll = interpolate(t, [0, made, 2.4], [0, 520, 1500], { extrapolateRight: "clamp", easing: ease.inOut });
  return (
    <AbsoluteFill>
      <Depth t={t} at={0.04} o={[540, 760]} from={{ y: 300, rx: 55 }}>
        <div style={{ position: "absolute", left: 60, right: 60, top: 340, height: 840, ...glass, overflow: "hidden", padding: "24px 0", transform: `perspective(2000px) rotateX(${4 * Math.sin(t * 1.5)}deg) rotateY(${-5 + 4 * Math.sin(t * 1.1)}deg)` }}>
          <div style={{ ...label, fontSize: 18, padding: "0 28px 14px" }}>AdVideo.tsx · THIS AD</div>
          <div style={{ transform: `translateY(${-scroll}px)`, fontSize: 19, lineHeight: "30px" }}>
            {SRC.slice(0, 110).map((l, i) => (
              <div key={i} style={{ display: "flex", padding: "0 24px" }}>
                <span style={{ width: 48, color: "#55537a", fontFamily: T.mono }}>{i + 1}</span>
                <CodeLine text={l.slice(0, 70)} />
              </div>
            ))}
          </div>
          <Sweep k={prog(t, made - 0.1, made + 0.6)} width={300} strength={0.25} angle={105} span={1300} />
        </div>
      </Depth>
      <Streaks T={t * 2} opacity={1 - prog(t, 0, 0.45)} cx={540} cy={760} />
      <DrawBox t={t} at={ad} until={made - 0.1} x={70} y={330} w={940} h={860} s={1} label="THIS AD" />
      <Tag x={540} y={345} t={t} at={made} anchor="c" variant="lilac" size={32}>
        Built with code + AI
      </Tag>
    </AbsoluteFill>
  );
};

// ---------- end card ----------
const End: React.FC = () => {
  const t = useT();
  const tap = word(12, "tap") - S.end[0];
  const btnK = springAt(t, 0.5, 11, 0.6, 170);
  const pulse = t > tap ? 0.05 * Math.max(0, Math.sin((t - tap) * 7)) : 0;
  return (
    <AbsoluteFill>
      <EndBackdrop t={t} />
      <AbsoluteFill style={{ alignItems: "center", transform: `translateY(${8 * Math.sin(t * 1.3)}px) scale(${1.03 - 0.03 * prog(t, 0, 4)})` }}>
        <Tag x={540} y={440} t={t} at={0.08} anchor="c" variant="glass" size={24}>
          One person · built with AI
        </Tag>
        <div style={{ position: "absolute", top: 510, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
          <SpringLetters text="Suyash Kashyap" t={t} at={0.16} size={120} stagger={0.025} />
        </div>
        <div style={{ position: "absolute", top: 660, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 18 }}>
          {["Products", "Tools", "Creative", "Campaigns"].map((w, i) => (
            <SpringLetters key={w} text={w} t={t} at={0.32 + i * 0.08} size={36} weight={500} color={T.lilacSoft} tracking="0" stagger={0.01} />
          ))}
        </div>
        <div style={{ position: "absolute", top: 820, transform: `perspective(1200px) translateZ(${interpolate(btnK, [0, 1, 1.3], [-2000, 0, 160], { extrapolateRight: "clamp" })}px) rotateX(${(1 - Math.min(1, btnK)) * 50}deg) scale(${1 + pulse})`, opacity: clamp01(btnK * 3) }}>
          <div style={{ position: "relative", overflow: "hidden", borderRadius: 60, padding: "26px 54px", background: T.lilacSoft, color: T.bg, fontFamily: T.display, fontWeight: 800, fontSize: 54, boxShadow: `0 0 80px ${T.glow}` }}>
            See what I can build ↗
            <Sweep k={((t - 0.9) % 1.3) / 0.6} width={140} strength={0.7} angle={110} span={900} />
          </div>
        </div>
        <div style={{ position: "absolute", top: 985, fontFamily: T.mono, fontSize: 30, color: T.fg, letterSpacing: "0.02em" }}>
          {"pilotaccess.com/suyashpow".slice(0, Math.round(prog(t, 0.75, 1.3, (x) => x) * 25))}
          <span style={{ opacity: Math.sin(t * 12) > 0 ? 1 : 0, color: T.lilac }}>|</span>
        </div>
        {t > tap && (
          <div style={{ position: "absolute", top: 1090, ...big, fontSize: 70, color: T.lilac, transform: `translateY(${Math.sin((t - tap) * 7) * 14}px) scale(${interpolate(springAt(t, tap, 10, 0.5, 200), [0, 1], [1.8, 1])})`, opacity: clamp01(springAt(t, tap, 10, 0.5, 200) * 3), textShadow: "0 10px 40px rgba(9,13,37,.9)" }}>
            Tap the link ↓
          </div>
        )}
      </AbsoluteFill>
      <Ripple x={540} y={872} t={t} at={tap} size={330} />
      <Ripple x={540} y={872} t={t} at={tap + 0.9} size={330} />
    </AbsoluteFill>
  );
};

// ---------- shared world behind scenes 1/4 to the payoff ----------
const CUTS = [S.one[0], S.two[0], S.three[0], S.four[0], S.payoff[0], S.end[0]];
const World: React.FC = () => {
  const t = useT();
  if (t < S.one[0] - 0.2 || t > S.end[0] + 0.3) return null;
  // The sky whips with every cut, alternating direction.
  const shift = CUTS.reduce((a, c, i) => a + (i % 2 ? -1 : 1) * 190 * ease.inOut(clamp01((t - c + 0.16) / 0.4)), 0);
  return (
    <AbsoluteFill>
      <SkyPlate T={t} zoom={1.3 + 0.03 * Math.sin(t * 0.5)} y={-60 + shift} />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(9,13,37,.8) 0%, rgba(9,13,37,.45) 40%, rgba(9,13,37,.55) 70%, rgba(9,13,37,.88) 100%)" }} />
      <GlassCards T={t} opacity={0.45} />
      <Dust T={t} opacity={0.5} speed={60} />
      <Bokeh T={t} opacity={0.5} />
    </AbsoluteFill>
  );
};

/** Warp streaks + flash on every cut. */
const Whips: React.FC = () => {
  const t = useT();
  const c = CUTS.find((x) => t > x - 0.18 && t < x + 0.3);
  if (c === undefined) return null;
  const k = clamp01((t - c + 0.18) / 0.48);
  return (
    <>
      <Streaks T={t * 3} opacity={Math.sin(k * Math.PI)} />
      {c >= S.payoff[0] && <Flash t={t} at={c} dur={0.28} peak={0.55} />}
    </>
  );
};

// ---------- 1/4 → 4/4 counter, slams with a burst on each step ----------
const STEPS = [S.one[0], S.two[0], S.three[0], S.four[0]];
const NAMES = ["PRODUCTS", "TOOLS", "CREATIVE", "CAMPAIGNS"];
const Progress: React.FC = () => {
  const t = useT();
  if (t < S.one[0] || t >= S.payoff[0]) return null;
  const n = STEPS.filter((s) => t >= s).length;
  const at = STEPS[n - 1];
  const k = springAt(t, at, 10, 0.5, 200);
  const nextAt = STEPS[n] ?? S.payoff[0];
  const fill = (n - 1 + clamp01((t - at) / (nextAt - at))) / 4;
  const exit = prog(t, S.payoff[0] - 0.16, S.payoff[0], ease.in);
  return (
    <>
      <AbsoluteFill style={{ opacity: 0.8 }}>
        <DropBurst t={t - at} cx={150} cy={320} />
      </AbsoluteFill>
      <div style={{ position: "absolute", top: 284, left: 80, right: 80, display: "flex", alignItems: "center", gap: 22, opacity: 1 - exit, transform: `translateY(${-80 * exit}px)` }}>
        <span style={{ ...big, fontSize: 72, color: T.lilac, width: 130, display: "inline-block", transform: `scale(${lerp(1.9, 1, k)}) rotate(${(1 - Math.min(1, k)) * -12}deg)`, transformOrigin: "30% 60%", textShadow: `0 0 30px ${T.glow}, 0 8px 30px rgba(3,4,18,.8)` }}>
          {n}/4
        </span>
        <div style={{ flex: 1, height: 10, borderRadius: 5, background: "rgba(228,220,255,.15)", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${fill * 100}%`, background: T.lilac, boxShadow: `0 0 16px ${T.lilac}` }} />
        </div>
        <SpringLetters key={n} text={NAMES[n - 1]} t={t} at={at + 0.08} size={26} font={T.mono} weight={500} tracking="0.16em" color={T.lilacSoft} stagger={0.018} />
      </div>
    </>
  );
};

const SCENES: [readonly [number, number], React.FC][] = [
  [S.hook, AdHook],
  [S.one, One],
  [S.two, Two],
  [S.three, Three],
  [S.four, Four],
  [S.payoff, Payoff],
  [S.end, End],
];

// Sound effects only, on the visual hits.
type Cue = [string, number, number];
const SFX: Cue[] = [
  ...[0, 0.34, 0.72, 1.06].map((a): Cue => ["whoosh", a, 0.35]),
  ["riser", HOOK.one - 1.6, 0.35],
  ["whoosh", HOOK.one - 0.55, 0.5],
  ["hit", HOOK.one, 0.85],
  ["shatter", HOOK.one, 0.35],
  ["click", HOOK.with, 0.6],
  ["hit", HOOK.ai, 0.55],
  ...CUTS.map((a): Cue => ["whoosh", a - 0.16, 0.45]),
  ...STEPS.map((a): Cue => ["hit", a, 0.5]),
  ...PRODUCTS.map((p): Cue => ["whoosh", S.one[0] + p.at, 0.25]),
  ["click", word(3, "live"), 0.6],
  ["hit", word(3, "days"), 0.4],
  ...[0.18, 0.62, 1.08].map((a): Cue => ["whoosh", S.two[0] + a, 0.25]),
  ...[word(5, "quiz"), word(5, "calc"), FIT].map((a): Cue => ["click", a, 0.6]),
  ["shimmer", word(6, "creative"), 0.35],
  ["hit", word(6, "stop"), 0.5],
  ...CH.map((c): Cue => ["click", word(8, c), 0.55]),
  ["click", word(9, "clicks"), 0.5],
  ["hit", word(9, "pennies"), 0.65],
  ["shimmer", word(9, "sign"), 0.5],
  ["shimmer", word(10, "made"), 0.4],
  ["shimmer", S.end[0] + 0.5, 0.45],
  ["hit", word(12, "tap"), 0.5],
];

export const AdVideo: React.FC = () => (
  <AbsoluteFill style={{ background: T.bg }}>
    <World />
    {SCENES.map(([[a, b], C], i) => (
      <Sequence key={i} from={sec(a)} durationInFrames={sec(b) - sec(a)}>
        <Shot dur={b - a} enter={i > 0} seed={i}>
          <C />
        </Shot>
      </Sequence>
    ))}
    <Whips />
    <Progress />
    <Captions lines={LINES3} y={1270} font={T.display} accent={T.lilacSoft} />
    <Grain />
    <Audio src={staticFile("v3/vo-fast.wav")} />
    {SFX.map(([f, at, v], i) => (
      <Sequence key={i} from={sec(at)} layout="none">
        <Audio src={staticFile(`sfx/${f}.wav`)} volume={v} />
      </Sequence>
    ))}
  </AbsoluteFill>
);
