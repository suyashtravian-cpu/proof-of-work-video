import { theme } from "../theme";

// A 3D-tilted browser window with the real URL, holding any footage.
export const BrowserFrame: React.FC<{
  children: React.ReactNode;
  width?: number;
  rotateX?: number;
  rotateY?: number;
  scale?: number;
  y?: number;
  opacity?: number;
  url?: string;
  glow?: number;
}> = ({ children, width = 1000, rotateX = 0, rotateY = 0, scale = 1, y = 0, opacity = 1, url = "pilotaccess.com/proofofwork", glow = 0.25 }) => {
  const height = (width * 900) / 1440;
  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        width,
        opacity,
        transform: `translate(-50%, calc(-50% + ${y}px)) perspective(2400px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${scale})`,
        borderRadius: 18,
        overflow: "hidden",
        background: "#111",
        border: "1px solid #ffffff26",
        boxShadow: `0 60px 120px rgba(0,0,0,.75), 0 0 140px rgba(255,255,255,${glow * 0.18})`,
      }}
    >
      <div style={{ height: 46, display: "flex", alignItems: "center", gap: 9, padding: "0 18px", background: "#161616", borderBottom: "1px solid #ffffff14" }}>
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
          }}
        >
          🔒 {url}
        </div>
      </div>
      <div style={{ position: "relative", width, height, overflow: "hidden" }}>{children}</div>
    </div>
  );
};
