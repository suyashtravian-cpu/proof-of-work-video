import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Scramble } from "../../fx/Scramble";
import { LENGTH, S, SCENE_IDS, SCENE_LABEL, sceneAt } from "../timing";
import { C } from "./util";

const pad = (n: number, w = 2) => String(Math.floor(n)).padStart(w, "0");

/** v1's creator HUD, lighter: corners only, ~40% opacity, scene label decodes on each cut. */
export const Hud: React.FC<{ opacity?: number }> = ({ opacity = 0.4 }) => {
  const f = useCurrentFrame();
  const t = f / 30;
  const id = sceneAt(t);
  const i = SCENE_IDS.indexOf(id);
  const label = `[${pad(i + 1)}/${pad(SCENE_IDS.length)}] ${SCENE_LABEL[id]}`;
  const mono: React.CSSProperties = { fontFamily: C.mono, fontSize: 18, letterSpacing: "0.12em", color: C.white, position: "absolute", whiteSpace: "pre" };
  const B = 30;
  const corner = (x: number, y: number, sx: number, sy: number) => <path d={`M${x + sx * B},${y} L${x},${y} L${x},${y + sy * B}`} fill="none" stroke={C.white} strokeWidth={2} />;
  return (
    <AbsoluteFill style={{ pointerEvents: "none", opacity }}>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        {corner(36, 36, 1, 1)}
        {corner(1044, 36, -1, 1)}
        {corner(36, 1884, 1, -1)}
        {corner(1044, 1884, -1, -1)}
      </svg>
      <div style={{ ...mono, left: 58, top: 56, display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ width: 11, height: 11, borderRadius: 6, background: C.red, opacity: Math.floor(t * 2) % 2 ? 0.3 : 1 }} />
        REC · AGENT RUN
      </div>
      <div style={{ ...mono, right: 58, top: 56 }}>
        {pad(t / 60)}:{pad(t % 60)}:{pad(f % 30)} / {LENGTH.toFixed(1)}s
      </div>
      <div style={{ ...mono, left: 58, bottom: 56 }}>
        <Scramble key={id} text={label} at={S[id][0]} dur={0.35} />
      </div>
      <div style={{ ...mono, right: 58, bottom: 56 }}>F{pad(f, 4)} · 1080×1920</div>
    </AbsoluteFill>
  );
};
