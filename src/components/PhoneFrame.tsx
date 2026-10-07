export const PhoneFrame: React.FC<{
  children: React.ReactNode;
  width?: number;
  rotateY?: number;
  rotateX?: number;
  scale?: number;
  x?: number;
  y?: number;
}> = ({ children, width = 540, rotateY = 0, rotateX = 0, scale = 1, x = 0, y = 0 }) => {
  const height = (width * 844) / 390;
  const bezel = 16;
  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        width: width + bezel * 2,
        height: height + bezel * 2,
        transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) perspective(2400px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${scale})`,
        borderRadius: 78,
        background: "linear-gradient(145deg,#3a3a3a,#111 40%,#2a2a2a)",
        padding: bezel,
        boxShadow: "0 70px 140px rgba(0,0,0,.8), inset 0 0 0 2px #555",
      }}
    >
      <div style={{ position: "relative", width, height, borderRadius: 62, overflow: "hidden", background: "#000" }}>
        {children}
        <div style={{ position: "absolute", top: 14, left: "50%", transform: "translateX(-50%)", width: 150, height: 42, borderRadius: 22, background: "#000" }} />
      </div>
    </div>
  );
};
