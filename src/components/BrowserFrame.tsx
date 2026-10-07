import { theme } from "../theme";

const Lock: React.FC = () => (
  <svg width={13} height={15} viewBox="0 0 13 15" style={{ marginRight: 9, flex: "none" }}>
    <rect x={1} y={6.5} width={11} height={8} rx={2} fill="#bdbcb6" />
    <path d="M3.5,6.5 V4.5 a3,3 0 0 1 6,0 V6.5" fill="none" stroke="#bdbcb6" strokeWidth={1.8} />
  </svg>
);

// A 3D-tilted browser window with the real URL, holding any footage.
// x / z / rotateZ / dim / live / zIndex are optional extras; the original props behave as before.
export const BrowserFrame: React.FC<{
  children: React.ReactNode;
  width?: number;
  rotateX?: number;
  rotateY?: number;
  rotateZ?: number;
  scale?: number;
  x?: number;
  y?: number;
  z?: number;
  opacity?: number;
  url?: string;
  glow?: number;
  /** 0..1 black veil over the whole window (for windows pushed back in depth). */
  dim?: number;
  /** Red LIVE badge at the right of the address bar. */
  live?: boolean;
  zIndex?: number;
  perspective?: number;
}> = ({
  children,
  width = 1000,
  rotateX = 0,
  rotateY = 0,
  rotateZ = 0,
  scale = 1,
  x = 0,
  y = 0,
  z = 0,
  opacity = 1,
  url = "pilotaccess.com/proofofwork",
  glow = 0.25,
  dim = 0,
  live = false,
  zIndex,
  perspective = 2400,
}) => {
  const height = (width * 900) / 1440;
  const k = width / 1000;
  const bar = 46;
  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        width,
        opacity,
        zIndex,
        transform: `translate(-50%, calc(-50% + ${y}px)) perspective(${perspective}px) translate3d(${x}px, 0px, ${z}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg) scale(${scale})`,
        borderRadius: 18 * Math.max(0.7, k),
        overflow: "hidden",
        background: "#111",
        border: "1px solid #ffffff26",
        boxShadow: `0 60px 120px rgba(0,0,0,.75), 0 0 140px rgba(255,255,255,${glow * 0.18})`,
      }}
    >
      <div style={{ height: bar, display: "flex", alignItems: "center", gap: 9, padding: "0 18px", background: "#161616", borderBottom: "1px solid #ffffff14" }}>
        {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
          <div key={c} style={{ width: 13, height: 13, borderRadius: 7, background: c }} />
        ))}
        <div
          style={{
            marginLeft: 18,
            flex: 1,
            height: 28,
            borderRadius: 8,
            background: "#0c0c0c",
            color: "#bdbcb6",
            fontFamily: theme.mono,
            fontSize: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
        >
          <Lock />
          {url}
          {live && (
            <div style={{ position: "absolute", right: 10, display: "flex", alignItems: "center", gap: 6, fontSize: 12, letterSpacing: "0.14em", color: theme.red }}>
              <span style={{ width: 8, height: 8, borderRadius: 4, background: theme.red }} />
              LIVE
            </div>
          )}
        </div>
      </div>
      <div style={{ position: "relative", width, height, overflow: "hidden" }}>{children}</div>
      {dim > 0 && <div style={{ position: "absolute", inset: 0, background: "#000", opacity: dim, pointerEvents: "none" }} />}
    </div>
  );
};
