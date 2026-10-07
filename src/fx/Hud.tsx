import { AbsoluteFill, useCurrentFrame } from "remotion";
import { theme } from "../theme";
import { SCENES } from "../timeline";
import { TOTAL_SECONDS } from "../timing";
import { Scramble } from "./Scramble";

const pad = (n: number, w = 2) => String(Math.floor(n)).padStart(w, "0");

/** Persistent creator HUD: corner brackets, REC, timecode, frame count, scene label. Stays out of the caption band. */
export const Hud: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / 30;
  const i = SCENES.findIndex((s) => t >= s.from && t < s.to);
  const scene = SCENES[Math.max(0, i)];
  const label = `[${pad(i + 1)}/${pad(SCENES.length)}] ${scene.name.toUpperCase()}`;
  const mono: React.CSSProperties = { fontFamily: theme.mono, fontSize: 19, letterSpacing: "0.12em", color: "#ffffffb0", position: "absolute" };
  const B = 34;
  const corner = (x: number, y: number, sx: number, sy: number) => (
    <path d={`M${x + sx * B},${y} L${x},${y} L${x},${y + sy * B}`} fill="none" stroke="#ffffff66" strokeWidth={2} />
  );
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        {corner(36, 36, 1, 1)}
        {corner(1044, 36, -1, 1)}
        {corner(36, 1884, 1, -1)}
        {corner(1044, 1884, -1, -1)}
      </svg>
      <div style={{ ...mono, left: 60, top: 58, display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ width: 13, height: 13, borderRadius: 7, background: theme.red, opacity: Math.floor(t * 2) % 2 ? 0.25 : 1 }} />
        REC · PROOF_OF_WORK.MP4
      </div>
      <div style={{ ...mono, right: 60, top: 58 }}>
        {pad(t / 60)}:{pad(t % 60)}:{pad(f % 30)} / {TOTAL_SECONDS.toFixed(1)}s
      </div>
      <div style={{ ...mono, left: 60, bottom: 58 }}>
        <Scramble key={scene.name} text={label} at={scene.from} dur={0.4} />
      </div>
      <div style={{ ...mono, right: 60, bottom: 58 }}>F{pad(f, 4)} · 1080×1920</div>
    </AbsoluteFill>
  );
};
