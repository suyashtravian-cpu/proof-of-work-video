import { OffthreadVideo, Sequence } from "remotion";
import { clip } from "../../../footage";
import { Scramble } from "../../../fx/Scramble";
import { ToolChip } from "../../kit/ToolChip";
import { C, clamp01, easeExpo, easeIn3, lerp, prog } from "../../kit/util";
import { sec } from "../../timing";
import { OT } from "./beats";

// 1/4 PRODUCTS: the three live sites from work.mp4 (the real portfolio capture, 1440×900 capture px),
// cropped to each site's own screenshot. Each one slams in as its deploy() resolves, the older ones
// step back into depth behind it (a deck), red tracking brackets lock onto the newest: LIVE BUILD 01/02/03.

/** Footage holds (work.mp4): Biltib 2.9–5.0, iCreateEpic 7.2–9.3, Moolank 365 11.5–14.3. `rate` keeps each inside its hold. */
export const SITES = [
  { key: "biltib", x0: 92, from: 2.95, rate: 0.75, took: "1.2s" },
  { key: "icreateepic", x0: 186, from: 7.2, rate: 1, took: "0.9s" },
  { key: "moolank365", x0: 186, from: 11.55, rate: 1, took: "1.4s" },
];
/** The site screenshot inside each carousel card (capture px). */
const CROP = { y0: 298, w: 566, h: 314 };
export const PW = 940;
const K = PW / CROP.w;
export const PH = CROP.h * K;
export const DECK = { cx: 540, cy: 690 };
/** Centre line of the receipt row under the front build (LIVE BUILD label + deploy() chip). */
export const ROW_Y = DECK.cy + PH / 2 + 14 + 44;
/** depth levels: 0 = front (newest), 1, 2 = stepped back and up */
const LV_Y = [0, -96, -178];
const LV_S = [1, 0.86, 0.74];
const LV_B = [1, 0.42, 0.26];
const lvAt = (arr: number[], lv: number) => (lv <= 1 ? lerp(arr[0], arr[1], lv) : lerp(arr[1], arr[2], Math.min(1, lv - 1)));

/** How far back site i has been pushed at time t (0 front … 2). */
const levelOf = (i: number, t: number) => OT.slams.slice(i + 1).reduce((s, a) => s + prog(t, a, a + 0.3, easeExpo), 0);
/** How far the whole deck has flown back into depth (on "in"). */
export const awayAt = (t: number) => prog(t, OT.away, OT.away + 0.32, easeIn3);

const Site: React.FC<{ i: number; t: number }> = ({ i, t }) => {
  const s = SITES[i];
  const at = OT.slams[i];
  if (t < at) return null;
  const k = prog(t, at, at + 0.24, easeExpo);
  const lv = levelOf(i, t);
  const y = DECK.cy + lvAt(LV_Y, lv);
  const sc = lvAt(LV_S, lv) * (1.5 - 0.5 * k);
  const bright = lvAt(LV_B, lv);
  const flash = Math.max(0, 1 - (t - at) / 0.16) * 0.55;
  // "live": a red pulse runs through the deck, front to back
  const lp = t - OT.live - (2 - i) * 0.05;
  const pulse = lp > 0 ? Math.exp(-lp * 7) : 0;
  const rx = 4 + 2 * Math.sin(t * 1.4 + i) - 12 * (1 - k);
  const ry = 2.2 * Math.sin(t * 1.1 + i * 2);
  return (
    <div
      style={{
        position: "absolute",
        left: DECK.cx - PW / 2,
        top: y - PH / 2,
        width: PW,
        height: PH,
        transform: `perspective(2200px) rotateX(${rx}deg) rotateY(${ry}deg) scale(${sc})`,
        opacity: clamp01(k * 2.5),
        filter: k < 0.98 ? `blur(${((1 - k) * 14).toFixed(1)}px)` : undefined,
        borderRadius: 16,
        overflow: "hidden",
        background: "#111",
        border: `1.5px solid ${pulse > 0.02 ? `rgba(255,59,47,${0.3 + 0.7 * pulse})` : "rgba(255,255,255,.18)"}`,
        boxShadow: `0 50px 110px rgba(0,0,0,.8), 0 0 ${60 * pulse}px rgba(255,59,47,${0.6 * pulse})`,
        zIndex: 10 - Math.round(lv * 3),
      }}
    >
      <Sequence from={sec(at)} layout="none">
        <OffthreadVideo
          src={clip("work")}
          trimBefore={sec(s.from)}
          playbackRate={s.rate}
          muted
          style={{ position: "absolute", left: -s.x0 * K, top: -CROP.y0 * K, width: 1440 * K, height: 900 * K, maxWidth: "none" }}
        />
      </Sequence>
      <div style={{ position: "absolute", inset: 0, background: "#000", opacity: 1 - bright }} />
      <div style={{ position: "absolute", inset: 0, background: "#fff", opacity: flash }} />
    </div>
  );
};

/** The three sites as one deck; it pushes in slowly, then flies back into depth on "in". */
export const Deck: React.FC<{ t: number }> = ({ t }) => {
  const away = awayAt(t);
  if (away >= 1) return null;
  const push = 1 + 0.06 * prog(t, OT.slams[0], OT.away);
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        transformOrigin: `${DECK.cx}px ${DECK.cy - 80}px`,
        transform: `translateY(${-70 * away}px) scale(${push * (1 - 0.55 * away)})`,
        opacity: 1 - away,
        filter: away > 0.02 ? `blur(${(away * 8).toFixed(1)}px)` : undefined,
      }}
    >
      {SITES.map((_, i) => (
        <Site key={i} i={i} t={t} />
      ))}
    </div>
  );
};

const Corners: React.FC<{ x0: number; y0: number; x1: number; y1: number; flick: number }> = ({ x0, y0, x1, y1, flick }) => {
  const L = 34;
  const c = (x: number, y: number, sx: number, sy: number) => <path d={`M${x + sx * L},${y} L${x},${y} L${x},${y + sy * L}`} fill="none" stroke={C.red} strokeWidth={5} />;
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible", opacity: flick }}>
      <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} fill={C.red} fillOpacity={0.035} stroke={C.red} strokeOpacity={0.4} strokeWidth={1.5} strokeDasharray="7 7" />
      {c(x0, y0, 1, 1)}
      {c(x1, y0, -1, 1)}
      {c(x0, y1, 1, -1)}
      {c(x1, y1, -1, -1)}
    </svg>
  );
};

/**
 * Red tracking brackets on the newest build with its receipt row underneath:
 * [● LIVE BUILD 0n] … deploy(site) ✓ (the call spins while the site lands). On "live" they open around the whole deck: ● 3 / 3 LIVE.
 */
export const Tracking: React.FC<{ t: number; frame: number }> = ({ t, frame }) => {
  const first = OT.slams[0];
  if (t < first - 0.25) return null;
  const n = OT.slams.filter((a) => t >= a).length; // builds landed
  const last = OT.slams[n - 1] ?? first;
  const away = awayAt(t);
  const snap = n > 0 ? prog(t, last, last + 0.28, easeExpo) : 0;
  const open = prog(t, OT.live, OT.live + 0.26, easeExpo);
  const pad = 14 + (1 - snap) * 60 + kickPad(t);
  const front = { x0: DECK.cx - PW / 2, y0: DECK.cy - PH / 2, x1: DECK.cx + PW / 2, y1: DECK.cy + PH / 2 };
  const deckTop = DECK.cy + LV_Y[2] - (PH * LV_S[2]) / 2;
  const box = { x0: front.x0 - pad, y0: lerp(front.y0, deckTop, open) - pad, x1: front.x1 + pad, y1: front.y1 + pad };
  const flick = t - last < 0.1 ? (frame % 2 ? 0.35 : 1) : 1;
  const rowY = ROW_Y;
  const fade = 1 - clamp01(away * 3);
  const label = open > 0 ? "● 3 / 3 LIVE" : `● LIVE BUILD 0${n}`;
  const labelAt = open > 0 ? OT.live : last;
  return (
    <div style={{ position: "absolute", inset: 0, opacity: fade, pointerEvents: "none" }}>
      {n > 0 && <Corners {...box} flick={flick * snap} />}
      {n > 0 && (
        <div
          style={{
            position: "absolute",
            left: box.x0,
            top: rowY,
            transform: "translateY(-50%)",
            fontFamily: C.mono,
            fontSize: 26,
            lineHeight: 1,
            letterSpacing: "0.1em",
            color: "#fff",
            background: C.red,
            padding: "9px 14px",
            whiteSpace: "pre",
            opacity: snap,
            boxShadow: "0 0 24px rgba(255,59,47,.45)",
          }}
        >
          <Scramble key={label} text={label} at={labelAt} dur={0.24} />
        </div>
      )}
      {SITES.map((s, i) => {
        // the deploy call spins while its site lands, ✓ as the slam settles
        const at = OT.slams[i];
        const next = OT.slams[i + 1];
        return (
          <ToolChip
            key={s.key}
            at={at}
            resolve={0.16}
            x={box.x1}
            y={rowY}
            anchor="r"
            size={26}
            name="deploy"
            arg={s.key}
            took={s.took}
            out={next !== undefined ? next - 0.15 : OT.live - 0.1}
          />
        );
      })}
    </div>
  );
};

/** Brackets punch outward a little on each slam. */
const kickPad = (t: number) => OT.slams.reduce((p, a) => p + (t >= a ? 10 * Math.exp(-(t - a) * 12) * Math.sin((t - a) * 30) : 0), 0);
