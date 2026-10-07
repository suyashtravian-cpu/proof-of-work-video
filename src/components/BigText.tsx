import { usePop, useUnit } from "./motion";

export const BigText: React.FC<{
  children: React.ReactNode;
  delay?: number;
  size?: number;
  color?: string;
  weight?: number;
}> = ({ children, delay = 0, size = 9, color, weight = 800 }) => {
  const p = usePop(delay);
  const u = useUnit();
  return (
    <div
      style={{
        fontSize: size * u,
        fontWeight: weight,
        letterSpacing: "-0.04em",
        lineHeight: 1.02,
        color,
        opacity: p,
        transform: `translateY(${(1 - p) * 6 * u}px) scale(${0.92 + p * 0.08})`,
        filter: `blur(${(1 - p) * 8}px)`,
      }}
    >
      {children}
    </div>
  );
};
