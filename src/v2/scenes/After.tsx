import { AbsoluteFill } from "remotion";
import { Particles } from "../../fx/Particles";
import { Sky } from "../components/Sky";
import { theme2 } from "../theme";
import { Bokeh, Cursor, Ripple, RecView, Sweep, T, Tag, WhipDefs, eExpo, eIO, eIn, eOut, keys, kick, pulse, rim, snapBeat, tw, vo } from "./after-making-playground/kit";

// AFTER (37.2 to 40.4): a click opens a portal onto the real page, the camera holds on
// "The interesting part is often after the click." and then follows "after" into the case cards.

const VP = { w: 960, h: 1220, left: 60, top: 140 };
const P = { x: 600, y: 860 }; // click point (screen)
export const AFTER_CLICK = snapBeat("After", 0.32);
export const AFTER_PAN = snapBeat("After", 2.35);
export const AFTER_EXIT = 2.96;
const LINE = vo("After", "Because the interesting");
export const AFTER_WORD = LINE.word(6); // "after"

// Recording: the headline (nearly frozen), then a real-time scroll into the case cards.
const SPANS: [number, number][] = [
  [37.36, 37.72],
  [37.72, 38.6],
];
const START = AFTER_CLICK - 0.08;
const DUR = [AFTER_PAN - START, 3.2 - AFTER_PAN];

export const After: React.FC = () => {
  const t = T();
  const C = AFTER_CLICK;

  // Camera inside the page (recording px).
  const cam = {
    s: keys(t, [[C, 1.72], [C + 0.62, 1.38], [AFTER_PAN, 1.43], [AFTER_PAN + 0.5, 1.29], [3.2, 1.25]], eOut),
    x: keys(t, [[C, 400], [C + 0.62, 436], [AFTER_PAN, 438], [AFTER_PAN + 0.46, 1250], [3.2, 1258]], eIO),
    y: keys(t, [[C, 600], [C + 0.62, 655], [AFTER_PAN, 628], [AFTER_PAN + 0.46, 560], [3.2, 520]], eIO),
  };

  // Portal: a circle growing from the click point.
  const portal = t < C ? 0 : tw(t, C, C + 0.48, 0, 1700, eExpo);

  // Window motion: tilt settles after the click, gentle sway, whip up on exit.
  const exit = tw(t, AFTER_EXIT, 3.2, 0, 1, eIn);
  const pop = kick(t, C, 20, 8);
  const rx = keys(t, [[0, 16], [C, 10], [C + 0.7, 2]], eOut) + Math.sin(t * 1.1) * 1.5 + exit * 18;
  const ry = Math.sin(t * 0.9 + 0.6) * 3.5 + tw(t, AFTER_PAN, AFTER_PAN + 0.5, 0, -5, eIO);
  const sc = 0.92 + 0.08 * pop + pulse(t, AFTER_PAN, 0.4) * 0.025;
  const ty = -exit * 1700;

  // Cursor: flies in on a curve, presses on the click, then drifts away.
  const ca = tw(t, 0, C - 0.02, 0, 1, eOut);
  const cx = keys(t, [[0, 1010], [C - 0.02, P.x], [C + 0.7, P.x + 150]], eOut);
  const cy = keys(t, [[0, 1780], [C - 0.02, P.y], [C + 0.7, P.y + 260]], eOut) - Math.sin(ca * Math.PI) * 120;
  const press = pulse(t, C - 0.06, 0.2);
  const cOp = t < C ? 1 : tw(t, C + 0.25, C + 0.7, 1, 0);

  // Highlight boxes on "after the" / "click." when the voice reaches "after".
  const hl = tw(t, AFTER_WORD - 0.1, AFTER_WORD + 0.3, 0, 1, eOut);
  const hlOut = tw(t, AFTER_PAN + 0.05, AFTER_PAN + 0.3, 1, 0);

  // A light pulse runs down the case timeline after the pan ("follow it after the click").
  const run = tw(t, AFTER_PAN + 0.2, 3.15, 0, 1, eIO);
  const lineX = VP.w / 2 + (887 - cam.x) * cam.s;

  const flash = pulse(t, C, 0.3);
  const blurY = exit * 70;

  return (
    <AbsoluteFill style={{ background: theme2.bg, overflow: "hidden" }}>
      <WhipDefs id="after-whip" x={0} y={blurY} />
      <div style={{ position: "absolute", inset: 0, transform: `translateY(${ty * 0.35}px) scale(${1.04 + t * 0.012})` }}>
        <Sky opacity={0.42} zoom={1.1} />
      </div>
      <Bokeh seed="afterbk" dx={-(cam.x - 436) * 0.12} dy={ty * 0.5} opacity={0.9} />
      <Particles count={46} color={theme2.lilacSoft} opacity={0.35} seed="afterpt" />
      <AbsoluteFill style={{ background: `radial-gradient(ellipse at ${P.x}px ${P.y}px, rgba(188,165,238,${0.35 * flash}) 0%, rgba(188,165,238,0) 55%)` }} />

      {/* Footage window */}
      <div
        style={{
          position: "absolute",
          left: VP.left,
          top: VP.top,
          width: VP.w,
          height: VP.h,
          transform: `translateY(${ty}px) perspective(2200px) rotateX(${rx}deg) rotateY(${ry}deg) scale(${sc})`,
          filter: blurY > 0.5 ? "url(#after-whip)" : undefined,
          ...rim(1 + flash),
          overflow: "hidden",
        }}
      >
        <div style={{ position: "absolute", inset: 0, clipPath: `circle(${portal}px at ${P.x - VP.left}px ${P.y - VP.top}px)` }}>
          <RecView w={VP.w} h={VP.h} cam={cam} spans={SPANS} durations={DUR} from={START}>
            {hl > 0 && (
              <svg width={1708} height={1080} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", opacity: hl * hlOut }}>
                {[
                  [362, 452, 296, 80],
                  [106, 528, 186, 80],
                ].map(([x, y, w, h], i) => {
                  const per = 2 * (w + h);
                  const p = Math.min(1, hl * 1.25 - i * 0.2);
                  return (
                    <g key={i}>
                      <rect x={x} y={y} width={w} height={h} rx={14} fill={`rgba(188,165,238,${0.14 * p})`} />
                      <rect
                        x={x}
                        y={y}
                        width={w}
                        height={h}
                        rx={14}
                        fill="none"
                        stroke={theme2.lilac}
                        strokeWidth={3.5}
                        strokeDasharray={per}
                        strokeDashoffset={per * (1 - Math.max(0, p))}
                        style={{ filter: "drop-shadow(0 0 8px rgba(188,165,238,.9))" }}
                      />
                    </g>
                  );
                })}
              </svg>
            )}
          </RecView>
          <Sweep a={C + 0.15} b={C + 1.2} strength={0.16} />
          <Sweep a={AFTER_PAN + 0.1} b={3.2} angle={70} strength={0.14} />
          {run > 0 && run < 1 && (
            <div
              style={{
                position: "absolute",
                left: lineX - 3,
                top: -260 + run * (VP.h + 300),
                width: 6,
                height: 260,
                borderRadius: 3,
                background: "linear-gradient(180deg, rgba(188,165,238,0), rgba(228,220,255,.95))",
                boxShadow: "0 0 24px rgba(188,165,238,.9)",
              }}
            />
          )}
        </div>
      </div>

      <Ripple x={P.x} y={P.y} at={C} rings={4} max={1100} />
      <Tag
        style={{
          left: 60,
          top: 64,
          opacity: tw(t, C + 0.05, C + 0.35) * (1 - exit),
          transform: `translateY(${(1 - tw(t, C + 0.05, C + 0.4, 0, 1, eOut)) * 18 + ty * 0.8}px)`,
        }}
      >
        How I think
      </Tag>
      {cOp > 0 && <Cursor x={cx} y={cy} press={press} opacity={cOp} scale={1.15} />}
    </AbsoluteFill>
  );
};
