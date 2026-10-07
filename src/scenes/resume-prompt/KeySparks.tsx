import { random } from "remotion";
import { theme } from "../../theme";

const CYAN = "#33e1ff";
export type Stroke = { age: number; seed: number; heavy: boolean };

/** Sparks that spit out of the caret on each keystroke. Rendered as a child of the caret element. */
export const KeySparks: React.FC<{ strokes: Stroke[] }> = ({ strokes }) => (
  <svg width={2} height={2} style={{ position: "absolute", left: 1, top: 22, overflow: "visible", pointerEvents: "none" }}>
    {strokes.map((s) => {
      const n = s.heavy ? 10 : 4;
      const life = s.heavy ? 0.28 : 0.2;
      if (s.age > life) return null;
      const fade = 1 - s.age / life;
      return (
        <g key={s.seed}>
          {s.age < 0.07 && <circle r={(s.heavy ? 26 : 14) * (1 - s.age / 0.07)} fill={s.heavy ? "#fff" : CYAN} opacity={0.5} />}
          {Array.from({ length: n }, (_, i) => {
            const a = -Math.PI / 2 + (random(`ks${s.seed}${i}`) - 0.5) * Math.PI * 1.5;
            const v = (s.heavy ? 560 : 380) * (0.45 + random(`kv${s.seed}${i}`));
            const at = (age: number) => [Math.cos(a) * v * age, Math.sin(a) * v * age + 1100 * age * age];
            const [x1, y1] = at(Math.max(0, s.age - 0.03));
            const [x2, y2] = at(s.age);
            const color = s.heavy ? (i % 3 === 0 ? theme.red : "#fff") : i % 2 ? CYAN : "#fff";
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={s.heavy ? 4 : 3} strokeLinecap="round" opacity={fade} />;
          })}
        </g>
      );
    })}
  </svg>
);
