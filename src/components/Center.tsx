import { AbsoluteFill } from "remotion";
import { useUnit } from "./motion";

export const Center: React.FC<{ children: React.ReactNode; gap?: number }> = ({ children, gap = 3 }) => {
  const u = useUnit();
  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        textAlign: "center",
        gap: gap * u,
        padding: 8 * u,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};
