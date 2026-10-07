import { AbsoluteFill, Easing, OffthreadVideo, Sequence, useCurrentFrame } from "remotion";
import { easeExpo, tween } from "../components/anim";
import { clip } from "../footage";
import { FloatingCode } from "../fx/FloatingCode";
import { Particles } from "../fx/Particles";
import { Scramble } from "../fx/Scramble";
import { shakeAt } from "../fx/shake";
import { theme } from "../theme";
import { sec } from "../timing";
import { CYAN, DraggedFile, KLine, Slices, SpeedLines, Terminal, Tracker } from "./hook/bits";
import { HERO_AT, UploadHero } from "./hook/UploadHero";
import { affineFor, camAt, CARDS, layout, pickCard, PUNCH_AT, PUNCH_TARGET } from "./hook/wall";
import { WallCards } from "./hook/Wall";

// 0.0–6.0  "I stopped sending résumés. | Every application asks for the same thing. | Upload your résumé."
// ECU on a file being dragged into an upload field → whip back through an endless wall of
// identical application forms → FREEZE on "stopped" → `rm resume_final_v7.pdf` → the wall tilts
// and every upload field pulses red → punch through into one field → upload → push into the PDF,
// which becomes the résumé page the next scene opens on.

const FREEZE = 0.58;
const KILL = 1.38; // rm executes
const WAVES = [2.42, 3.52];
const WAVE_SPEED = 5200; // world px / s

const waveSrc = camAt(WAVES[0]);
const TRACK = [
  { at: 2.62, card: pickCard(2.62, 230, 1120, 170), label: "REQUIRED · RESUME.PDF" },
  { at: 2.86, card: pickCard(2.86, 640, 880, 150), label: "REQUIRED · RESUME.PDF" },
  { at: 3.1, card: pickCard(3.1, 820, 1290, 130), label: "REQUIRED · RESUME.PDF" },
];

const HERO_CARD = CARDS.findIndex((x) => x.X === 0 && x.Y === 0);
const pad4 = (n: number) => String(n).padStart(4, "0");

const Counter: React.FC<{ t: number; n: number }> = ({ t, n }) => {
  if (t >= HERO_AT) return null;
  const halted = t >= FREEZE && t < 2.0;
  const s = pad4(n);
  const lead = s.length - String(n).length;
  return (
    <div style={{ position: "absolute", left: 50, top: 118, padding: "12px 18px 14px", background: "rgba(8,8,8,.86)", border: "1.5px solid #ffffff26", borderRadius: 10, fontFamily: theme.mono }}>
      <div style={{ fontSize: 17, letterSpacing: "0.14em", color: "#ffffffa0", display: "flex", gap: 14, alignItems: "center" }}>
        <Scramble text="RÉSUMÉ REQUESTS IN VIEW" at={0} dur={0.4} />
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 16, marginTop: 4 }}>
        <span style={{ fontSize: 66, lineHeight: 1, color: halted ? theme.red : theme.fg, letterSpacing: "0.02em" }}>
          <span style={{ opacity: 0.3 }}>{s.slice(0, lead)}</span>
          {s.slice(lead)}
        </span>
        {halted && <span style={{ fontSize: 20, letterSpacing: "0.14em", color: theme.bg, background: theme.red, padding: "4px 8px" }}>■ STOPPED</span>}
      </div>
    </div>
  );
};

const CamReadout: React.FC<{ t: number; zoom: number; yaw: number }> = ({ t, zoom, yaw }) => {
  if (t >= HERO_AT) return null;
  return (
    <div style={{ position: "absolute", right: 50, top: 118, textAlign: "right", padding: "12px 18px", background: "rgba(8,8,8,.86)", border: "1.5px solid #ffffff26", borderRadius: 10, fontFamily: theme.mono, fontSize: 19, letterSpacing: "0.12em", color: "#ffffffb0", lineHeight: 1.5 }}>
      <div style={{ color: CYAN }}>
        <Scramble text="CAM // APPLY.WALL" at={0.05} dur={0.4} />
      </div>
      <div>
        ZOOM {zoom.toFixed(2)}× · YAW {yaw >= 0 ? "+" : "−"}
        {Math.abs(yaw).toFixed(1)}°
      </div>
    </div>
  );
};

const CODE = [
  [{ c: "for", k: 1 }, { c: " (const job of " }, { c: "applications", v: 1 }, { c: ") {" }],
  [{ c: "  job." }, { c: "require", f: 1 }, { c: "(" }, { c: '"resume.pdf"', s: 1 }, { c: ");  " }, { c: "// again", m: 1 }],
  [{ c: "}" }],
] as { c: string; k?: 1; v?: 1; f?: 1; s?: 1; m?: 1 }[][];

const CodePanel: React.FC<{ t: number }> = ({ t }) => {
  const at = 2.55;
  if (t < at) return null;
  const k = tween(t, at, at + 0.25, 0, 1, easeExpo);
  const out = tween(t, PUNCH_AT, PUNCH_AT + 0.16, 0, 1);
  const total = CODE.flat().reduce((n, s) => n + s.c.length, 0);
  let budget = Math.floor(tween(t, at + 0.15, 3.45, 0, total, Easing.linear));
  const flash = Math.max(0, 1 - Math.abs(t - WAVES[1] - 0.15) / 0.25);
  return (
    <div
      style={{
        position: "absolute",
        left: 60,
        top: 1528,
        width: 960,
        transform: `translateY(${(1 - k) * 80}px) scale(${1 + out * 0.4})`,
        opacity: k * (1 - out),
        background: "rgba(10,10,10,.9)",
        border: "1.5px solid #ffffff2a",
        borderRadius: 16,
        overflow: "hidden",
        fontFamily: theme.mono,
      }}
    >
      <div style={{ padding: "10px 20px", fontSize: 18, letterSpacing: "0.12em", color: theme.dim, borderBottom: "1.5px solid #ffffff18", display: "flex", justifyContent: "space-between" }}>
        <span>apply.ts</span>
        <span style={{ color: CYAN }}>● every form</span>
      </div>
      <div style={{ padding: "16px 24px 20px", fontSize: 31, lineHeight: 1.5, whiteSpace: "pre", color: theme.fg }}>
        {CODE.map((line, li) => (
          <div key={li} style={{ background: li === 1 ? `rgba(255,59,47,${0.12 + 0.5 * flash})` : undefined, margin: "0 -24px", padding: "0 24px" }}>
            {line.map((seg, si) => {
              const shown = seg.c.slice(0, Math.max(0, budget));
              budget -= seg.c.length;
              const color = seg.k ? "#c792ea" : seg.v ? CYAN : seg.f ? theme.fg : seg.s ? "#ffb4ad" : seg.m ? theme.dim : "#d8d7d2";
              return (
                <span key={si} style={{ color, fontWeight: seg.f ? 500 : undefined }}>
                  {shown}
                </span>
              );
            })}
            {li === CODE.length - 1 && <span style={{ background: Math.floor(t * 4) % 2 ? theme.fg : "transparent" }}> </span>}
          </div>
        ))}
      </div>
    </div>
  );
};

/** 2–3 frame subliminal flashes of the real site. */
const FLASHES = [
  { at: 2.07, frames: 3, name: "hero", from: 1.6 },
  { at: 4.26, frames: 2, name: "work", from: 3.2 },
];

export const Hook: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / 30;
  const cam = camAt(Math.min(t, HERO_AT - 0.001));
  const placed = t < HERO_AT ? layout(cam) : [];
  const inView = placed.filter((p) => p.onScreen).length;

  // camera shake on impacts (whole wall layer)
  const [sx, sy, sr] = shakeAt(t, [FREEZE, KILL, WAVES[1]], 26, 0.32);

  // per-card state: ripple pulses + drag-over on the hero card
  const hotAfter = tween(t, WAVES[1] + 0.25, WAVES[1] + 0.6, 0, 0.32);
  const state = (id: number) => {
    const c = CARDS[id];
    const dist = Math.hypot(c.X - waveSrc.lx, c.Y - waveSrc.ly);
    let pulse = 0;
    for (const w of WAVES) {
      const dt = t - w - dist / WAVE_SPEED;
      pulse += Math.exp(-((dt / 0.11) ** 2));
    }
    const passed = t - WAVES[1] - dist / WAVE_SPEED > 0 ? hotAfter : 0;
    const drag = id === HERO_CARD && t < 0.62 ? tween(t, 0.05, 0.22, 0, 1) : 0;
    return { pulse: Math.min(1, pulse), hot: passed, drag };
  };
  const relD = cam.D;
  const fog = (depth: number) => Math.max(0.1, Math.min(1, 1.6 - 0.6 * (depth / relD)));

  // freeze look: dim + desaturate the wall while the type plays over it
  const dim = tween(t, FREEZE, FREEZE + 0.06, 0, 0.62) * tween(t, 1.95, 2.35, 1, 0) + tween(t, 2.3, 2.6, 0, 0.22) * tween(t, PUNCH_AT, PUNCH_AT + 0.15, 1, 0);

  // dragged file in screen space
  const dragK = tween(t, 0, 0.3, 0, 1, Easing.out(Easing.quad));
  const whipK = tween(t, 0.3, FREEZE, 0, 1, Easing.bezier(0.75, 0, 0.18, 1));
  const floatK = Math.sin(t * 3.2) * 6;
  const fx = 880 + (610 - 880) * dragK + (540 - 610) * whipK;
  const fy = 1380 + (1060 - 1380) * dragK + (930 - 1060) * whipK + (t > FREEZE ? floatK : 0);
  const fscale = 1.08 - 0.08 * dragK - 0.12 * whipK;
  const frot = -7 + 4 * dragK + 3 * whipK;

  // speed of the whip / punch for streaks
  const whipSpeed = Math.sin(Math.PI * tween(t, 0.3, FREEZE, 0, 1));
  const punchSpeed = tween(t, PUNCH_AT, 4.4, 0, 1, Easing.in(Easing.quad));

  const invert = (t >= FREEZE && t < FREEZE + 0.07) || (t >= KILL && t < KILL + 0.04);
  const whiteFlash = Math.max(0, 1 - Math.abs(t - HERO_AT) / 0.12) * (t >= HERO_AT - 0.04 ? 1 : 0);

  const targetM = t >= PUNCH_AT - 0.1 && t < HERO_AT ? affineFor(cam, PUNCH_TARGET.X, PUNCH_TARGET.Y) : null;

  return (
    <AbsoluteFill style={{ background: theme.bg, overflow: "hidden" }}>
      {t < HERO_AT && (
        <>
          <FloatingCode count={22} opacity={0.12} seed="hk" speed={2.2} />
          <AbsoluteFill style={{ transform: `translate(${sx}px, ${sy}px) rotate(${cam.roll + sr}deg)`, transformOrigin: "540px 960px" }}>
            <WallCards placed={placed} state={state} fog={fog} />
            <AbsoluteFill style={{ background: "#050505", opacity: dim }} />
            {TRACK.map((tr, i) => (
              <Tracker
                key={i}
                m={affineFor(cam, tr.card.X, tr.card.Y)}
                t={t}
                at={tr.at}
                until={PUNCH_AT}
                label={t >= WAVES[1] ? "SAME FIELD" : tr.label}
                labelAt={t >= WAVES[1] ? WAVES[1] + i * 0.05 : tr.at}
                color={t >= WAVES[1] ? theme.red : CYAN}
                seed={`tr${i}`}
              />
            ))}
            {targetM && t >= PUNCH_AT && (
              <Tracker m={targetM} t={t} at={PUNCH_AT} until={HERO_AT} label="TARGET LOCKED" labelAt={PUNCH_AT} color={theme.fg} seed="tgt" />
            )}
          </AbsoluteFill>
          {/* top + bottom scrims keep the HUD and the type legible */}
          <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(5,5,5,.9) 0%, rgba(5,5,5,.55) 30%, rgba(5,5,5,0) 42%, rgba(5,5,5,0) 74%, rgba(5,5,5,.75) 100%)", opacity: tween(t, 0.3, 0.55, 0.15, 1) }} />
          <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(5,5,5,.92) 0%, rgba(5,5,5,.8) 30%, rgba(5,5,5,0) 46%)", opacity: tween(t, 2.15, 2.4, 0, 1) * tween(t, PUNCH_AT, PUNCH_AT + 0.15, 1, 0) }} />
          <Particles count={40} opacity={0.4} seed="hkp" />
          <SpeedLines t={t} amount={whipSpeed} dir={-1} seed="whip" />
          <SpeedLines t={t} amount={punchSpeed} dir={1} seed="punch" />
          <DraggedFile t={t} x={fx} y={fy} scale={fscale} rot={frot} killAt={KILL} trail={1 - dragK + whipSpeed} />
          <Terminal t={t} at={0.74} out={1.98} typeFrom={0.84} typeTo={1.28} enterAt={1.34} />
          <CodePanel t={t} />
          {/* "I stopped sending résumés." */}
          <KLine t={t} words={[{ w: "I", at: 0.2 }, { w: "stopped", at: FREEZE }]} size={210} top={262} out={1.98} />
          <KLine t={t} words={[{ w: "sending", at: 0.95 }, { w: "résumés.", at: 1.18, strikeAt: KILL + 0.02 }]} size={124} top={492} out={1.98} />
          {/* "Every application asks for the same thing." */}
          <KLine t={t} words={[{ w: "Every", at: 2.3 }, { w: "application", at: 2.52 }]} size={118} top={236} out={PUNCH_AT} />
          <KLine t={t} words={[{ w: "asks", at: 3.02 }, { w: "for", at: 3.2 }]} size={118} top={364} out={PUNCH_AT} />
          <KLine
            t={t}
            words={[
              { w: "the", at: 3.36 },
              { w: "same", at: WAVES[1], color: theme.red },
              { w: "thing.", at: 3.76, color: theme.red },
            ]}
            size={128}
            top={500}
            out={PUNCH_AT}
          />
          <Counter t={t} n={inView} />
          <CamReadout t={t} zoom={1000 / cam.D} yaw={cam.yaw} />
        </>
      )}

      <UploadHero t={t} />

      {FLASHES.map((fl) => (
        <Sequence key={fl.at} from={sec(fl.at)} durationInFrames={fl.frames} layout="none">
          <AbsoluteFill style={{ background: "#000" }}>
            <div style={{ position: "absolute", left: fl.name === "hero" ? -30 : -120, right: -120, top: 600, height: 760, transform: `rotate(${fl.name === "hero" ? -3 : 3}deg) scale(1.04)` }}>
              <OffthreadVideo src={clip(fl.name)} trimBefore={sec(fl.from)} muted style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "0% 50%", filter: "contrast(1.35) brightness(1.1)" }} />
            </div>
            <AbsoluteFill style={{ background: "repeating-linear-gradient(0deg, rgba(0,0,0,.35) 0px, rgba(0,0,0,.35) 2px, transparent 2px, transparent 5px)" }} />
            <div style={{ position: "absolute", left: 70, top: 470, fontFamily: theme.mono, fontSize: 26, letterSpacing: "0.16em", color: theme.bg, background: CYAN, padding: "6px 12px" }}>
              ▶ PILOTACCESS.COM/PROOFOFWORK
            </div>
          </AbsoluteFill>
        </Sequence>
      ))}

      <Slices t={t} at={[FREEZE, KILL, 2.0, PUNCH_AT + 0.2, HERO_AT]} />
      {invert && <AbsoluteFill style={{ background: "#fff", mixBlendMode: "difference" }} />}
      <AbsoluteFill style={{ background: "#fff", opacity: whiteFlash * 0.85 }} />
      <AbsoluteFill style={{ background: "#fff", opacity: Math.max(0, 1 - Math.abs(t - FREEZE) / 0.05) * 0.5 }} />
    </AbsoluteFill>
  );
};

