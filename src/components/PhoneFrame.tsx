// A phone shell in light 3D: titanium-ish bezel, side buttons, dynamic island, and an optional
// moving glass sheen (`glare`, any number; it scrolls the reflection) and back-glow (`glow`, 0-1).
export const PhoneFrame: React.FC<{
  children: React.ReactNode;
  width?: number;
  rotateY?: number;
  rotateX?: number;
  rotateZ?: number;
  scale?: number;
  x?: number;
  y?: number;
  glare?: number;
  glow?: number;
  glowColor?: string;
}> = ({ children, width = 540, rotateY = 0, rotateX = 0, rotateZ = 0, scale = 1, x = 0, y = 0, glare, glow = 0, glowColor = "#33e1ff" }) => {
  const height = (width * 844) / 390;
  const bezel = Math.round(width * 0.034);
  const r = width * 0.145;
  const btn = (side: "left" | "right", top: number, h: number) => (
    <div style={{ position: "absolute", [side]: -5, top, width: 6, height: h, borderRadius: 3, background: "linear-gradient(90deg,#2a2a2a,#5a5a5a,#2a2a2a)" }} />
  );
  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        width: width + bezel * 2,
        height: height + bezel * 2,
        transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) perspective(2400px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg) scale(${scale})`,
        borderRadius: r + bezel,
        background: "linear-gradient(145deg,#4a4a4a,#111 38%,#1c1c1c 62%,#3a3a3a)",
        padding: bezel,
        boxSizing: "border-box",
        boxShadow: `0 70px 140px rgba(0,0,0,.8), inset 0 0 0 2px #5c5c5c, inset 0 0 0 5px #151515${glow > 0 ? `, 0 0 ${120 * glow}px ${glowColor}55` : ""}`,
      }}
    >
      {btn("left", height * 0.2, height * 0.07)}
      {btn("left", height * 0.3, height * 0.11)}
      {btn("right", height * 0.26, height * 0.15)}
      <div style={{ position: "relative", width, height, borderRadius: r, overflow: "hidden", background: "#000" }}>
        {children}
        <div style={{ position: "absolute", top: width * 0.026, left: "50%", transform: "translateX(-50%)", width: width * 0.29, height: width * 0.08, borderRadius: width * 0.04, background: "#000" }} />
        {glare !== undefined && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              background: `linear-gradient(115deg, rgba(255,255,255,0) ${glare * 100 - 30}%, rgba(255,255,255,.13) ${glare * 100 - 12}%, rgba(255,255,255,0) ${glare * 100}%)`,
            }}
          />
        )}
        <div style={{ position: "absolute", inset: 0, borderRadius: r, boxShadow: "inset 0 0 0 1.5px rgba(255,255,255,.08)", pointerEvents: "none" }} />
      </div>
    </div>
  );
};
