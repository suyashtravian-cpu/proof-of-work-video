import { AbsoluteFill, random, useCurrentFrame } from "remotion";
import { easeExpo, easeInOut, easeOut, tween } from "../components/anim";
import { Paper, PAPER_H, PAPER_W } from "../components/Paper";
import { Slam } from "../components/Slam";
import { theme } from "../theme";

const SLAMS = [
  { at: 2.8, text: "how I think." },
  { at: 4.1, text: "what I can build." },
  { at: 5.4, text: "what I can actually do." },
];

// A jagged crack path from a seed point, drawn progressively.
const crack = (seed: string, x: number, y: number, len: number) => {
  let px = x;
  let py = y;
  let d = `M${px},${py}`;
  const ang = random(seed) * Math.PI * 2;
  for (let i = 0; i < 9; i++) {
    px += Math.cos(ang + (random(seed + i) - 0.5) * 1.4) * (len / 9);
    py += Math.sin(ang + (random(seed + "y" + i) - 0.5) * 1.4) * (len / 9);
    d += ` L${px.toFixed(1)},${py.toFixed(1)}`;
  }
  return d;
};
const CRACKS = SLAMS.flatMap((s, i) =>
  [0, 1, 2, 3].map((j) => ({ at: s.at, d: crack(`c${i}${j}`, 200 + i * 180 + j * 20, 300 + i * 180, 300 + j * 60) })),
);

// 6.0–13.0  "But a résumé only tells you where I've worked. Not how I think. Not what I can build. Not what I can actually do."
export const Resume: React.FC = () => {
  const t = useCurrentFrame() / 30;
  const zoom = tween(t, 0.1, 2.0, 0, 1, easeInOut);
  const focus = tween(t, 0.6, 1.3, 0, 1, easeOut);
  const back = tween(t, 2.55, 3.0, 0, 1, easeExpo);
  const current = [...SLAMS].reverse().find((s) => t >= s.at);
  const shake = current ? Math.max(0, 1 - (t - current.at) / 0.25) * 14 : 0;
  const shakeX = (random(`sx${Math.floor(t * 30)}`) - 0.5) * shake;
  const shakeY = (random(`sy${Math.floor(t * 30)}`) - 0.5) * shake;
  const scale = (1 + zoom * 0.55) * (1 - back * 0.5);
  const y = -zoom * 250 * (1 - back) + back * 120;
  return (
    <AbsoluteFill style={{ background: theme.bg, transform: `translate(${shakeX}px, ${shakeY}px)` }}>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div
          style={{
            position: "relative",
            transform: `translateY(${y + (1 - back) * -40}px) scale(${scale})`,
            filter: `brightness(${1 - back * 0.72}) blur(${back * 2}px)`,
          }}
        >
          <Paper focus="experience" focusAmount={focus * (1 - back)} />
          <svg width={PAPER_W} height={PAPER_H} style={{ position: "absolute", inset: 0 }}>
            {CRACKS.map((c, i) => {
              const k = tween(t, c.at, c.at + 0.18, 0, 1, easeOut);
              return k > 0 ? <path key={i} d={c.d} fill="none" stroke="#000" strokeWidth={4} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - k} /> : null;
            })}
          </svg>
          {focus > 0 && back < 1 && (
            <div
              style={{
                position: "absolute",
                left: 60,
                top: 232,
                width: PAPER_W - 120,
                height: 300,
                border: `5px solid ${theme.red}`,
                borderRadius: 12,
                opacity: focus * (1 - back),
              }}
            />
          )}
        </div>
      </AbsoluteFill>
      {current && (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", textAlign: "center", padding: "0 70px" }}>
          <div key={current.at} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
            <Slam at={current.at} size={56} color={theme.red} style={{ fontFamily: theme.mono, letterSpacing: "0.2em", fontWeight: 500 }}>
              NOT
            </Slam>
            <Slam at={current.at + 0.04} size={current.text.length > 18 ? 118 : 150}>
              {current.text}
            </Slam>
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
