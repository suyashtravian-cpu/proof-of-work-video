import { Easing } from "remotion";
import { AiCursor, cursorAt, type CursorKey } from "../../kit/AiCursor";
import { C, clamp01, easeExpo, kick, pop, prog } from "../../kit/util";
import { OT } from "./beats";

// "From idea to live in days, not months." The clean typographic moment after the deck flies away:
// "days" slams in big, "not months" lands under it, and the AI cursor drags a red strike through "months".

const DAYS = { top: 446, size: 300 };
const NOT = { top: 772, size: 130 };
/** "months" in Hubot Sans 800 at 130 px, letter-spacing -0.04em, line centred (measured with the font file). */
const MONTHS_X: [number, number] = [409, 894];
const STRIKE_Y = NOT.top + NOT.size * 0.53;

const [S0, S1] = OT.strike;
export const DAYS_CURSOR: CursorKey[] = [
  { t: OT.not - 0.2, x: 1130, y: 1080 },
  { t: S0 - 0.03, x: MONTHS_X[0] - 6, y: STRIKE_Y + 8, arc: -110 },
  { t: S0, x: MONTHS_X[0] - 6, y: STRIKE_Y + 8, click: true, down: true },
  { t: S1, x: MONTHS_X[1] + 8, y: STRIKE_Y + 8, ease: Easing.inOut(Easing.quad) },
  { t: S1 + 0.04, x: MONTHS_X[1] + 8, y: STRIKE_Y + 8, down: false },
  { t: S1 + 0.5, x: MONTHS_X[1] + 70, y: STRIKE_Y - 70 },
];

export const Days: React.FC<{ t: number }> = ({ t }) => {
  if (t < OT.days) return null;
  const k = prog(t, OT.days, OT.days + 0.26, easeExpo);
  const drift = prog(t, OT.days, OT.days + 1.4);
  const nk = pop(t, OT.not, 0.22);
  const cur = cursorAt(DAYS_CURSOR, t);
  const strike = t < S0 ? 0 : clamp01((cur.x - MONTHS_X[0]) / (MONTHS_X[1] - MONTHS_X[0]));
  const struck = prog(t, S1, S1 + 0.2);
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: DAYS.top,
          textAlign: "center",
          fontFamily: C.sans,
          fontWeight: 800,
          fontSize: DAYS.size,
          lineHeight: 0.9,
          letterSpacing: "-0.05em",
          color: C.white,
          transform: `scale(${(1.35 - 0.35 * k) * (1 + 0.035 * drift + kick(t, OT.not, 0.025) + kick(t, S1, 0.03))})`,
          transformOrigin: "540px 50%",
          filter: k < 0.98 ? `blur(${((1 - k) * 14).toFixed(1)}px)` : undefined,
          opacity: clamp01(k * 1.6),
          textShadow: "0 18px 60px rgba(0,0,0,.7)",
        }}
      >
        days
      </div>
      {nk > 0 && (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: NOT.top,
            textAlign: "center",
            fontFamily: C.sans,
            fontWeight: 800,
            fontSize: NOT.size,
            lineHeight: 1,
            letterSpacing: "-0.04em",
            whiteSpace: "nowrap",
            transform: `translateY(${(1 - nk) * 40}px) scale(${0.9 + 0.1 * nk})`,
            opacity: clamp01(nk * 2),
          }}
        >
          <span style={{ color: "rgba(255,255,255,.62)" }}>not </span>
          <span style={{ position: "relative", display: "inline-block", color: `rgba(255,255,255,${0.62 - 0.32 * struck})` }}>
            months
            {strike > 0 && (
              <span
                style={{
                  position: "absolute",
                  left: -8,
                  top: "50%",
                  height: 13,
                  marginTop: -6,
                  width: `calc(${strike * 100}% + ${strike * 16}px)`,
                  background: C.red,
                  borderRadius: 3,
                  boxShadow: "0 0 18px rgba(255,59,47,.75)",
                }}
              />
            )}
          </span>
        </div>
      )}
      <AiCursor path={DAYS_CURSOR} from={OT.not - 0.2} />
    </>
  );
};
