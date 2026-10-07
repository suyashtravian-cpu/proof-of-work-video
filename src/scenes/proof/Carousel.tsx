import { OffthreadVideo, Sequence } from "remotion";
import { easeExpo, tween } from "../../components/anim";
import { BrowserFrame } from "../../components/BrowserFrame";
import { clip } from "../../footage";
import { sec } from "../../timing";
import { CCY, CW, easeIn3, footRect, whipEase } from "./geom";
import { Track } from "./Track";
import { theme } from "../../theme";
import { Scramble } from "../../fx/Scramble";

export const TRI_IN = 1.7;
export const TRI_OUT = 3.15;
const STEPS = [2.22, 2.66];
const STEP_DUR = 0.15;
const R = 520;

// [name, work-clip start, preview rect in capture px, chip]
const CARDS: [string, number, [number, number, number, number]][] = [
  ["BILTIB", 3.2, [70, 296, 680, 630]],
  ["ICREATEEPIC", 7.5, [166, 296, 774, 630]],
  ["MOOLANK 365", 11.8, [166, 296, 774, 630]],
];

/** Ring position: -0.9 → 0 spin-in, whip steps to 1 and 2, then a fly-through. */
export const focusAt = (t: number) =>
  -0.9 * (1 - tween(t, TRI_IN, TRI_IN + 0.4, 0, 1, easeExpo)) +
  STEPS.reduce((s, c) => s + tween(t, c, c + STEP_DUR, 0, 1, whipEase), 0) +
  tween(t, 2.98, TRI_OUT, 0, 0.5, easeIn3);

/** Speed of the ring (0..1) for streaks. */
export const ringSpeed = (t: number) => {
  const d = Math.abs(focusAt(t + 1 / 60) - focusAt(t - 1 / 60)) * 30;
  return Math.min(1, d / 8);
};

/** "Three live products": three live windows on a 3D ring, each playing its own build. */
export const Carousel: React.FC<{ t: number }> = ({ t }) => {
  if (t < TRI_IN || t >= TRI_OUT) return null;
  const f = focusAt(t);
  const inK = tween(t, TRI_IN, TRI_IN + 0.45, 0, 1, easeExpo);
  const zr = -2600 * (1 - inK) + tween(t, 2.98, TRI_OUT, 0, 1300, easeIn3);
  const cards = CARDS.map(([name, from, rect], i) => {
    const th = ((i - f) * 2 * Math.PI) / 3;
    const x = R * Math.sin(th) * 1.05;
    const z = R * (Math.cos(th) - 1) * 1.45 + zr;
    const op = tween(t, TRI_IN + i * 0.05, TRI_IN + 0.12 + i * 0.05, 0, 1) * tween(t, TRI_OUT - 0.06, TRI_OUT, 1, 0);
    return { name, from, rect, i, th, x, z, op };
  });
  const front = Math.round(f);
  const settled = Math.abs(f - front) < 0.015 && t > 1.98 && t < 2.98;
  const frontCard = cards.find((c) => c.i === front);
  const sorted = [...cards].sort((a, b) => a.z - b.z);
  return (
    <>
      {sorted.map((c) => (
        <BrowserFrame
          key={c.name}
          width={CW}
          x={c.x}
          y={CCY - 960 - 40 * (1 - Math.cos(c.th))}
          z={c.z}
          rotateY={(c.th * 180) / Math.PI * 0.32}
          rotateX={3}
          opacity={c.op}
          dim={(1 - Math.cos(c.th)) * 0.3}
          zIndex={Math.round(5000 + c.z)}
          live
          glow={0.4}
        >
          <Sequence from={sec(TRI_IN)} durationInFrames={sec(TRI_OUT) - sec(TRI_IN)} layout="none">
            <OffthreadVideo src={clip("work")} trimBefore={sec(c.from)} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </Sequence>
        </BrowserFrame>
      ))}
      {settled && frontCard && (
        <div style={{ position: "absolute", inset: 0, zIndex: 9000 }}>
          <Track
            key={frontCard.name}
            r={footRect({ w: CW, cy: CCY }, ...frontCard.rect)}
            at={[1.98, STEPS[0] + STEP_DUR, STEPS[1] + STEP_DUR][front]}
            until={[STEPS[0], STEPS[1], 2.98][front]}
            label={`LIVE · ${frontCard.name}`}
            color="#33e1ff"
          />
        </div>
      )}
      {frontCard && t > 1.85 && (
        <div style={{ position: "absolute", top: CCY + (CW * 900) / 1440 / 2 + 23 + 26, left: 0, right: 0, display: "flex", justifyContent: "center", zIndex: 9000 }}>
          <div style={{ fontFamily: theme.mono, fontSize: 24, letterSpacing: "0.16em", color: theme.bg, background: theme.fg, padding: "10px 18px", borderRadius: 6 }}>
            <Scramble key={front} text={`LIVE BUILD 0${Math.max(0, front) + 1} / 03 · ${CARDS[Math.max(0, Math.min(2, front))][0]}`} at={[1.85, STEPS[0] + 0.05, STEPS[1] + 0.05][Math.max(0, Math.min(2, front))]} dur={0.3} />
          </div>
        </div>
      )}
    </>
  );
};
