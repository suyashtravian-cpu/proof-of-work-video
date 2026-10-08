import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Scramble } from "../../fx/Scramble";
import { C, prog } from "../kit/util";
import { enterAt, SCENE_IDS, SCENE_LABEL, sceneLen, S, type SceneId } from "../timing";

/** Temporary stand-in for a scene still being designed: a labelled frame in the hero zone (y 300–1120). */
export const Placeholder: React.FC<{ id: SceneId; file: string; note: string }> = ({ id, file, note }) => {
  const t = useCurrentFrame() / 30;
  const t0 = enterAt(id);
  const k = prog(t, t0, t0 + 0.3);
  const scan = ((t * 0.6) % 1) * 820;
  const n = String(SCENE_IDS.indexOf(id) + 1).padStart(2, "0");
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 100, top: 300, width: 880, height: 820, border: `2px dashed ${C.line}`, borderRadius: 28, overflow: "hidden", opacity: k }}>
        <div style={{ position: "absolute", left: 0, right: 0, top: scan, height: 2, background: "rgba(255,59,47,.5)" }} />
        <div style={{ position: "absolute", left: 50, top: 50, fontFamily: C.mono, fontSize: 24, letterSpacing: "0.14em", color: C.red }}>
          <Scramble text={`${n} · ${SCENE_LABEL[id]}`} at={t0} dur={0.3} />
        </div>
        <div style={{ position: "absolute", left: 50, right: 50, top: 330, fontFamily: C.sans, fontWeight: 800, fontSize: 76, letterSpacing: "-0.045em", lineHeight: 1.02, color: C.white }}>{note}</div>
        <div style={{ position: "absolute", left: 50, bottom: 46, fontFamily: C.mono, fontSize: 22, color: C.dim }}>
          placeholder · {file} · {S[id][0].toFixed(2)}–{S[id][1].toFixed(2)}s · {t.toFixed(2)} / {sceneLen(id).toFixed(2)}
        </div>
      </div>
    </AbsoluteFill>
  );
};
