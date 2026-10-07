import { AbsoluteFill, useCurrentFrame } from "remotion";
import { easeExpo, easeInOut, tween } from "../components/anim";
import { CodeLine } from "../components/Code";
import { CODE_FILES } from "../generated/code";
import { LINES } from "../script";
import { SCENES } from "../timeline";
import { TOTAL_SECONDS } from "../timing";
import { theme } from "../theme";

const START = SCENES.find((s) => s.name === "Twist")!.from;
const EDITOR_AT = 1.6;
const TERMINAL = [
  { at: 2.0, text: "$ node capture/run.mjs hero work signals lab-archive creative", dim: false },
  { at: 2.5, text: "hero         10.2s   612 frames   2880×1800 @ 60fps", dim: true },
  { at: 2.75, text: "work         14.3s   858 frames   2880×1800 @ 60fps", dim: true },
  { at: 3.0, text: "signals      17.6s  1056 frames   2880×1800 @ 60fps", dim: true },
  { at: 3.6, text: "$ npx remotion render ProofOfWorkVertical", dim: false },
  { at: 4.3, text: "Rendered 1425/1425 frames  →  out/proof-of-work.mp4", dim: true },
];

const Timeline: React.FC<{ t: number }> = ({ t }) => {
  const k = tween(t, 0.05, 0.5, 0, 1, easeExpo);
  const now = START + t;
  const x = (s: number) => (s / TOTAL_SECONDS) * 940;
  const tracks: [string, number][] = [
    ["VIDEO", 0],
    ["CAPTIONS", 1],
    ["SFX", 2],
  ];
  return (
    <div style={{ position: "absolute", left: 70, top: 640, width: 940, opacity: k, transform: `translateY(${(1 - k) * 60}px)` }}>
      <div style={{ fontFamily: theme.mono, fontSize: 22, color: theme.dim, letterSpacing: "0.12em", marginBottom: 24 }}>
        ProofOfWork.tsx · 1080×1920 · 30fps · {now.toFixed(2)}s
      </div>
      {tracks.map(([label, row]) => (
        <div key={label} style={{ position: "relative", height: 86, marginBottom: 14, borderTop: "1px solid #ffffff14" }}>
          <div style={{ position: "absolute", top: 8, left: 0, fontFamily: theme.mono, fontSize: 16, color: "#666" }}>{label}</div>
          {row === 0 &&
            SCENES.map((s, i) => (
              <div key={s.name} style={{ position: "absolute", top: 32, left: x(s.from), width: x(s.to - s.from) - 4, height: 48, borderRadius: 6, background: i % 2 ? "#2a2a2a" : "#3a3a3a", border: now >= s.from && now < s.to ? `2px solid ${theme.fg}` : "2px solid transparent", boxSizing: "border-box", overflow: "hidden", fontFamily: theme.mono, fontSize: 13, color: "#bbb", padding: "14px 6px", whiteSpace: "nowrap" }}>
                {s.name}
              </div>
            ))}
          {row === 1 &&
            LINES.map((l, i) => <div key={i} style={{ position: "absolute", top: 40, left: x(l.t), width: Math.max(4, x(l.end - l.t) - 2), height: 30, borderRadius: 4, background: l.kinetic ? theme.red : "#8c8b86" }} />)}
          {row === 2 &&
            Array.from({ length: 70 }, (_, i) => <div key={i} style={{ position: "absolute", top: 36 + ((i * 7) % 3) * 12, left: x((i * 0.68) % TOTAL_SECONDS), width: 3, height: 14, background: "#666" }} />)}
        </div>
      ))}
      <div style={{ position: "absolute", top: 40, bottom: 0, left: x(now), width: 3, background: theme.red, boxShadow: `0 0 18px ${theme.red}` }} />
    </div>
  );
};

const Editor: React.FC<{ t: number }> = ({ t }) => {
  const k = tween(t, EDITOR_AT, EDITOR_AT + 0.35, 0, 1, easeExpo);
  const file = CODE_FILES[t < 3.55 ? 0 : 1];
  const lines = file.text.split("\n");
  const scroll = tween(t, EDITOR_AT, 5.5, 0, 1, easeInOut) * Math.max(0, lines.length - 40) * 34;
  return (
    <div style={{ position: "absolute", left: 40, right: 40, top: 150, height: 1180, borderRadius: 22, background: "#0f0f0f", border: "1px solid #ffffff1c", overflow: "hidden", opacity: k, transform: `scale(${0.94 + k * 0.06})` }}>
      <div style={{ height: 58, display: "flex", alignItems: "flex-end", gap: 4, padding: "0 18px", background: "#141414", borderBottom: "1px solid #ffffff14" }}>
        {CODE_FILES.map((f) => (
          <div key={f.name} style={{ fontFamily: theme.mono, fontSize: 19, padding: "12px 18px", color: f === file ? theme.fg : "#666", background: f === file ? "#0f0f0f" : "transparent", borderRadius: "8px 8px 0 0" }}>
            {f.name}
          </div>
        ))}
      </div>
      <div style={{ position: "relative", padding: "18px 0", transform: `translateY(${-scroll}px)`, fontSize: 21, lineHeight: "34px" }}>
        {lines.map((l, i) => (
          <div key={i} style={{ display: "flex" }}>
            <span style={{ width: 70, textAlign: "right", paddingRight: 22, color: "#444", fontFamily: theme.mono, flexShrink: 0 }}>{i + 1}</span>
            <CodeLine text={l} />
          </div>
        ))}
      </div>
    </div>
  );
};

// 36.5–42.0  "Oh — and this video? I never opened an editor. AI wrote the whole edit, in code."
export const Twist: React.FC = () => {
  const t = useCurrentFrame() / 30;
  const glitch = t < 0.14 ? 1 - t / 0.14 : 0;
  const timelineOut = tween(t, EDITOR_AT - 0.1, EDITOR_AT + 0.2, 0, 1);
  return (
    <AbsoluteFill style={{ background: theme.bg }}>
      {timelineOut < 1 && (
        <div style={{ opacity: 1 - timelineOut }}>
          <Timeline t={t} />
        </div>
      )}
      {t >= EDITOR_AT - 0.1 && <Editor t={t} />}
      {t >= TERMINAL[0].at && (
        <div style={{ position: "absolute", left: 40, right: 40, top: 1560, height: 300, borderRadius: 18, background: "#0b0b0b", border: "1px solid #ffffff1c", padding: "22px 26px", boxSizing: "border-box", fontFamily: theme.mono, fontSize: 21, lineHeight: "40px" }}>
          {TERMINAL.filter((l) => t >= l.at).map((l, i) => {
            const chars = Math.round(tween(t, l.at, l.at + (l.dim ? 0.12 : 0.4), 0, l.text.length, (x) => x));
            return (
              <div key={i} style={{ color: l.dim ? "#9a9a94" : theme.fg, whiteSpace: "pre" }}>
                {l.text.slice(0, chars)}
              </div>
            );
          })}
        </div>
      )}
      <AbsoluteFill style={{ background: "#fff", opacity: glitch * 0.85, mixBlendMode: "difference" }} />
    </AbsoluteFill>
  );
};
