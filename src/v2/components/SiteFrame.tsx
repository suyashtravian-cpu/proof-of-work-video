import { theme2 } from "../theme";
import { REC_H, REC_W } from "./Rec";

/** A floating glass browser window for the recording, lilac rim light, real URL. */
export const SiteFrame: React.FC<{
  children: React.ReactNode;
  width?: number;
  x?: number;
  y?: number;
  rotateX?: number;
  rotateY?: number;
  rotateZ?: number;
  scale?: number;
  opacity?: number;
  glow?: number;
  chrome?: boolean;
}> = ({ children, width = 980, x = 0, y = 0, rotateX = 0, rotateY = 0, rotateZ = 0, scale = 1, opacity = 1, glow = 1, chrome = true }) => {
  const height = (width * REC_H) / REC_W;
  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        width,
        opacity,
        transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) perspective(2400px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg) scale(${scale})`,
        borderRadius: 22,
        overflow: "hidden",
        background: theme2.bg,
        border: "1.5px solid rgba(228,220,255,.28)",
        boxShadow: `0 50px 120px rgba(3,4,18,.75), 0 0 ${90 * glow}px rgba(188,165,238,${0.35 * glow})`,
      }}
    >
      {chrome && (
        <div style={{ height: 40, display: "flex", alignItems: "center", gap: 8, padding: "0 16px", background: "rgba(20,20,54,.92)", borderBottom: "1px solid rgba(228,220,255,.12)" }}>
          {["#ff6b8a", "#ffc46b", "#7be3b0"].map((c) => (
            <div key={c} style={{ width: 11, height: 11, borderRadius: 6, background: c, opacity: 0.9 }} />
          ))}
          <div style={{ marginLeft: 14, flex: 1, height: 24, borderRadius: 12, background: "rgba(9,13,37,.9)", color: theme2.dim, fontFamily: theme2.mono, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", letterSpacing: "0.02em" }}>
            pilotaccess.com/suyashpow
          </div>
        </div>
      )}
      <div style={{ position: "relative", width, height, overflow: "hidden" }}>{children}</div>
    </div>
  );
};
