import { AbsoluteFill, useCurrentFrame } from "remotion";
import { shakeAt } from "../../fx/shake";
import { theme2 } from "../theme";
import { Atmos, Bracket, Flash, FloatWin, Ripple, SpringLetters, Sweep, Tag, beatIn, bell, clamp01, ease, lerp, prog, springAt, track } from "./campaigns-lab/kit";
import { scrollTo } from "./campaigns-lab/scroll";
import { LAB1, LAB2 } from "./campaigns-lab/scrollData";

// LAB (31.6 to 37.2). VO: "I design where the click goes next. Four brand concepts, built to help
// someone decide." (captioned). Footage: rec 32.3 to 36.35, "Give the click somewhere good to go."
// and the four Conversion Lab concept cards, each labelled on the beat, with a "4" that fills up.

const b = beatIn(31.6);
export const LAB_BEATS = {
  land: b(37), // 0.281 window lands
  tag: b(38), // 0.794 chapter tag
  click: b(39), // 1.307 ripple on "click"
  c1: b(40), // 1.820 whip to card 1 (bar)
  slam: b(41), // 2.333 the 4 slams ("Four brand concepts")
  c2: b(42), // 2.846 card 2
  c3: b(44), // 3.872 card 3 (bar), after the scroll
  c4: b(45), // 4.385 card 4, the 4 is full
  fin: b(46), // 4.898 pull back, self-initiated
  out: b(47), // 5.411 zoom-through exit
};
const L = LAB_BEATS;
const lin = (x: number) => x;

// Page coordinates (relative to the recording frame at 32.25 s); on screen y = page y - scroll.
const CARDS = [
  { name: "The Whole Truth", at: L.c1, rect: [268, 1069, 826, 1578] },
  { name: "Fix My Curls", at: L.c2, rect: [898, 1182, 1464, 1683] },
  { name: "The Pant Project", at: L.c3, rect: [276, 1740, 831, 2242] },
  { name: "DrinkPrime", at: L.c4, rect: [887, 1852, 1448, 2363] },
] as const;
const CLICK_WORD = [746, 748];

const SCROLL_UP = 1.62; // headline settles, cards in
const SCROLL2_A = 3.02; // whip-scroll from cards 1-2 down to cards 3-4
const SCROLL2_B = 3.78;

const footage = (t: number) => {
  const want = track(t, [
    [0, 140],
    [L.land, 152, lin],
    [SCROLL_UP, 601, ease.inOut],
    [SCROLL2_A, 601],
    [SCROLL2_B, 1567, ease.inOut],
    [5.6, 1588, lin],
  ]);
  const tNom = track(t, [
    [0, 32.3],
    [SCROLL_UP, 33.45, lin],
    [SCROLL2_A, 35.3, lin],
    [SCROLL2_B, 36.3, lin],
    [5.6, 36.33, lin],
  ]);
  if (t < SCROLL_UP + 0.05) return { want, ...scrollTo(LAB1, want, tNom) };
  if (t < SCROLL2_A) return { want, t: tNom + 0.004, shift: 601 - want };
  return { want, ...scrollTo(LAB2, want, tNom, 601) };
};

const CardLabel: React.FC<{ i: number; name: string; t: number; at: number; out: number; x: number; y: number }> = ({ i, name, t, at, out, x, y }) => {
  if (t < at - 0.02) return null;
  const k = springAt(t, at, 11, 0.5, 180);
  const ko = prog(t, out, out + 0.2, ease.in);
  if (ko >= 1) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        display: "flex",
        alignItems: "center",
        gap: 18,
        padding: "14px 30px 14px 14px",
        borderRadius: 999,
        background: "rgba(14,16,44,.82)",
        border: "1.5px solid rgba(188,165,238,.6)",
        boxShadow: `0 20px 50px rgba(3,4,18,.6), 0 0 36px ${theme2.glow}`,
        transform: `translate(${(1 - k) * -40 - ko * 60}px, -100%) scale(${0.75 + 0.25 * k})`,
        transformOrigin: "0% 100%",
        opacity: clamp01(k * 2) * (1 - ko),
        clipPath: `inset(-30px ${(1 - prog(t, at, at + 0.3, ease.expo)) * 100}% -30px -30px round 999px)`,
        whiteSpace: "nowrap",
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 999,
          background: theme2.lilac,
          color: theme2.ink,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: theme2.sans,
          fontWeight: 800,
          fontSize: 26,
          letterSpacing: "0.02em",
        }}
      >
        0{i + 1}
      </div>
      <SpringLetters text={name} t={t} at={at + 0.04} size={50} stagger={0.018} color={theme2.paper} tracking="-0.03em" />
    </div>
  );
};

export const Lab: React.FC = () => {
  const t = useCurrentFrame() / 30;
  const f = footage(t);
  const c1a = L.c1 - 0.2;
  const c1b = L.c1 + 0.08;
  const c2a = L.c2 - 0.2;
  const c2b = L.c2 + 0.08;
  const c4a = L.c4 - 0.2;
  const c4b = L.c4 + 0.08;
  const fa = L.fin - 0.15;
  const fb = L.fin + 0.25;

  const enter = prog(t, 0, L.land, ease.expo);
  const win = {
    h: track(t, [[c1a, 960], [c1b + 0.04, 800, ease.out], [fa, 800], [fb, 600, ease.expo]]),
    y: track(t, [[0, -60], [c1a, -60], [c1b + 0.04, 52, ease.out], [fa, 52], [fb, 20, ease.expo]]) + Math.sin(t * 1.6) * 7,
    rx: track(t, [[0, -20], [L.land, 6, ease.expo], [c1a, 3], [c1b, 6, ease.out], [SCROLL2_A, 4], [3.4, 11], [SCROLL2_B, 4], [fa, 4], [fb, 9, ease.expo], [5.6, 7]]) + Math.sin(t * 0.9) * 0.7,
    ry: track(t, [[0, 12], [L.land, 4, ease.expo], [c1a, 2], [c1b, -7, ease.out], [c2a, -4], [c2b, 7, ease.out], [SCROLL2_A, 5], [SCROLL2_B, -7], [c4a, -4], [c4b, 7, ease.out], [fa, 5], [fb, 0, ease.expo], [5.6, -2]]),
    rz: track(t, [[0, 3], [L.land, -1, ease.expo], [c1b, -1.4, ease.out], [c2b, 1.4, ease.out], [SCROLL2_B, -1.2], [c4b, 1.2, ease.out], [fb, 0, ease.expo]]) + Math.sin(t * 1.3) * 0.3,
    s: lerp(1.75, 1, enter),
    blur: (1 - enter) * 14,
    opacity: clamp01(enter * 2.5),
  };
  const cam = {
    zoom: track(t, [[0, 1.1], [c1a, 1.14], [c1b, 1.6, ease.whip], [c2a, 1.66], [c2b, 1.6, ease.whip], [SCROLL2_A, 1.66], [3.4, 1.38], [SCROLL2_B, 1.6], [c4a, 1.66], [c4b, 1.6, ease.whip], [fa, 1.66], [fb, 0.84, ease.expo], [5.6, 0.88]]),
    cx: track(t, [[0, 730], [c1a, 730], [c1b, 547, ease.whip], [c2a, 541], [c2b, 1181, ease.whip], [SCROLL2_A, 1175], [SCROLL2_B, 553, ease.inOut], [c4a, 559], [c4b, 1167, ease.whip], [fa, 1162], [fb, 862, ease.expo], [5.6, 866]]),
    cy: track(t, [[0, 532], [c1a, 532], [c1b, 723, ease.whip], [c2a, 728], [c2b, 830, ease.whip], [SCROLL2_A, 826], [SCROLL2_B, 424, ease.inOut], [c4a, 430], [c4b, 540, ease.whip], [fa, 546], [fb, 488, ease.expo]]),
  };
  const wx = bell(t, c1a, c1b) + bell(t, c2a, c2b) + bell(t, c4a, c4b) + 0.6 * bell(t, SCROLL2_A, SCROLL2_B);
  const wy = 0.5 * bell(t, c1a, c1b) + 1.2 * bell(t, SCROLL2_A, SCROLL2_B) + 0.4 * bell(t, fa, fb);
  const mblur: [number, number] = [wx * 15, wy * 13];

  // Fill of the giant 4: a quarter per labelled card.
  const fill = CARDS.reduce((n, c) => n + 0.25 * prog(t, c.at, c.at + 0.32, ease.expo), 0);
  const four = prog(t, L.c1 - 0.06, L.c1 + 0.3, ease.expo);
  const slamK = springAt(t, L.slam, 8, 0.5, 220);
  const fourScale = lerp(1.7, 1, four) * (t >= L.slam ? 1 + 0.16 * (1 - slamK) : 1);

  const [s1x, s1y, s1r] = shakeAt(t, [L.slam], 14, 0.32);
  const [s2x, s2y, s2r] = shakeAt(t, [L.fin], 6, 0.25);
  const exitK = prog(t, L.out, 5.6, ease.in);
  const world = `translate(${s1x + s2x}px, ${s1y + s2y}px) rotate(${s1r + s2r}deg) scale(${(1 + 0.01 * Math.sin(t * 0.7)) * lerp(1, 2.1, exitK)})`;
  const px = -win.ry * 8 + Math.sin(t * 0.45) * 22;
  const py = win.rx * -5 - t * 10;

  const boardOut = prog(t, L.out, 5.6, ease.in);

  return (
    <AbsoluteFill style={{ background: theme2.bg, overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `translate(${(s1x + s2x) * 0.4}px, ${(s1y + s2y) * 0.4}px) scale(${lerp(1, 1.25, exitK)})` }}>
        <Atmos t={t + 3} px={px} py={py} seed="lab" sky={0.28} />
      </AbsoluteFill>

      <AbsoluteFill style={{ transform: world, opacity: 1 - exitK * 0.85, filter: exitK > 0.05 ? `blur(${(exitK * 10).toFixed(1)}px)` : undefined }}>
        {/* Ghost chapter numeral that gives way to the 4 */}
        <div
          style={{
            position: "absolute",
            right: -50 + px * 0.3,
            top: 30 + py * 0.3,
            fontFamily: theme2.display,
            fontWeight: 800,
            fontSize: 520,
            lineHeight: 1,
            letterSpacing: "-0.06em",
            color: "transparent",
            WebkitTextStroke: "2px rgba(188,165,238,.32)",
            opacity: track(t, [[0, 0], [L.land, 1, ease.out], [c1a, 1], [L.c1 + 0.1, 0, ease.in]]),
            transform: `translateY(${track(t, [[0, -120], [L.land, 0, ease.expo], [L.c1 + 0.1, 180, ease.in]])}px) rotate(5deg)`,
          }}
        >
          03
        </div>

        {/* The board: a giant 4 that fills a quarter per concept */}
        {t >= L.c1 - 0.06 && (
          <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 640, opacity: 1 - boardOut }}>
            <div
              style={{
                position: "absolute",
                left: 44,
                top: 70,
                width: 420,
                height: 560,
                transform: `perspective(1400px) rotateY(${lerp(-35, 0, four) + Math.sin(t * 1.1) * 4}deg) rotateX(${Math.sin(t * 0.8) * 3}deg) scale(${fourScale})`,
                transformOrigin: "50% 60%",
                opacity: clamp01(four * 2),
                filter: `blur(${((1 - four) * 10).toFixed(1)}px) drop-shadow(0 0 ${30 + 60 * (t >= L.slam ? Math.max(0, 1 - (t - L.slam) / 0.6) : 0)}px rgba(188,165,238,.55))`,
              }}
            >
              {[0, 1].map((layer) => (
                <div
                  key={layer}
                  style={{
                    position: "absolute",
                    inset: 0,
                    fontFamily: theme2.display,
                    fontWeight: 800,
                    fontSize: 640,
                    lineHeight: 0.86,
                    textAlign: "center",
                    letterSpacing: "-0.04em",
                    ...(layer === 0
                      ? { color: "transparent", WebkitTextStroke: `4px ${theme2.lilac}` }
                      : {
                          backgroundImage: `linear-gradient(105deg, rgba(255,255,255,0) 40%, rgba(255,255,255,.85) 50%, rgba(255,255,255,0) 60%), linear-gradient(180deg, ${theme2.lilacSoft}, ${theme2.lilac} 55%, #8fd3ff 130%)`,
                          backgroundSize: "300% 100%, 100% 100%",
                          backgroundPosition: `${lerp(120, -20, prog(t, L.c4 + 0.05, L.c4 + 0.7, ease.inOut))}% 0, 0 0`,
                          WebkitBackgroundClip: "text",
                          backgroundClip: "text",
                          color: "transparent",
                          clipPath: `inset(${(1 - fill) * 100}% 0 0 0)`,
                        }),
                  }}
                >
                  4
                </div>
              ))}
            </div>
            <div style={{ position: "absolute", left: 478, top: 128 }}>
              <SpringLetters text="BRAND" t={t} at={L.slam + 0.02} size={98} stagger={0.03} tracking="-0.03em" />
            </div>
            <div style={{ position: "absolute", left: 478, top: 226 }}>
              <SpringLetters text="CONCEPTS" t={t} at={L.slam + 0.1} size={98} stagger={0.028} color={theme2.lilacSoft} tracking="-0.03em" />
            </div>
            {CARDS.map((c, i) => {
              const k = springAt(t, L.c1 + i * 0.05, 12, 0.5, 170);
              const lit = prog(t, c.at, c.at + 0.18, ease.out);
              const pop = t >= c.at ? 1 + 0.18 * (1 - springAt(t, c.at, 8, 0.45, 220)) : 1;
              return (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    left: 480 + i * 132,
                    top: 372,
                    width: 116,
                    height: 58,
                    borderRadius: 999,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: theme2.sans,
                    fontWeight: 800,
                    fontSize: 26,
                    letterSpacing: "0.04em",
                    color: lit > 0.5 ? theme2.ink : theme2.dim,
                    background: `rgba(188,165,238,${lit})`,
                    border: `2px solid rgba(188,165,238,${0.45 + 0.55 * lit})`,
                    boxShadow: lit > 0 ? `0 0 ${34 * lit}px ${theme2.glow}` : undefined,
                    transform: `translateY(${(1 - k) * 40}px) scale(${pop})`,
                    opacity: clamp01(k * 2),
                  }}
                >
                  0{i + 1}
                </div>
              );
            })}
            <Tag x={480} y={486} t={t} at={L.fin} variant="glass" size={24}>
              Self-initiated · not client work
            </Tag>
          </div>
        )}

        <FloatWin
          id="lab"
          w={1000}
          h={win.h}
          y={win.y}
          rx={win.rx}
          ry={win.ry}
          rz={win.rz}
          s={win.s}
          opacity={win.opacity}
          blur={win.blur}
          cam={cam}
          recT={f.t}
          shift={f.shift}
          mblur={mblur}
          sheen={t < L.land + 0.6 ? prog(t, 0.05, L.land + 0.6) : t >= c1a && t < c1b + 0.35 ? prog(t, c1a, c1b + 0.35) : t >= fa && t < fb + 0.4 ? prog(t, fa, fb + 0.4) : -1}
          inner={(map, z) => {
            const [cx, cy] = map(CLICK_WORD[0], CLICK_WORD[1] - f.want);
            const hk = prog(t, L.click - 0.05, L.click + 0.15, ease.out) * (1 - prog(t, c1a, c1b));
            return (
              <>
                {hk > 0 && (
                  <div
                    style={{
                      position: "absolute",
                      left: cx - 110 * z,
                      top: cy - 50 * z,
                      width: 220 * z,
                      height: 100 * z,
                      borderRadius: 30 * z,
                      background: `rgba(188,165,238,${0.22 * hk})`,
                      boxShadow: `0 0 ${50 * hk}px rgba(188,165,238,${0.55 * hk})`,
                      mixBlendMode: "screen",
                    }}
                  />
                )}
                <Ripple x={cx} y={cy} t={t} at={L.click} size={240} />
              </>
            );
          }}
          overlay={(map) => (
            <>
              {CARDS.map((c, i) => {
                const [x0, y0] = map(c.rect[0], c.rect[1] - f.want);
                const [x1, y1] = map(c.rect[2], c.rect[3] - f.want);
                const next = i === 1 ? SCROLL2_A + 0.12 : i < 3 ? CARDS[i + 1].at - 0.22 : L.fin - 0.12;
                const outB = i === 0 ? c2a : i === 1 ? SCROLL2_A + 0.1 : 1e9;
                return (
                  <div key={i}>
                    <Bracket x0={x0} y0={y0} x1={x1} y1={y1} t={t} at={c.at} out={outB} arm={46} thick={6} fill={false} />
                    <CardLabel i={i} name={c.name} t={t} at={c.at} out={next} x={30} y={win.h - 30} />
                    {i >= 2 && (
                      <Tag x={(x0 + x1) / 2} y={y0 - 4} t={t} at={L.fin + 0.04 + (i - 2) * 0.08} anchor="c" size={22}>
                        0{i + 1} {c.name}
                      </Tag>
                    )}
                  </div>
                );
              })}
            </>
          )}
        />

        <Tag x={540} y={292} t={t} at={L.tag} out={c1a} anchor="c" variant="glass" size={30}>
          03 / The conversion lab
        </Tag>
      </AbsoluteFill>

      <Sweep t={t} at={0} dur={0.5} angle={-20} />
      <Sweep t={t} at={L.slam - 0.05} dur={0.55} strength={0.26} width={380} />
      <Sweep t={t} at={L.c4 + 0.05} dur={0.6} angle={-16} strength={0.2} />
      <Flash t={t} at={0} dur={0.25} peak={0.3} />
      <Flash t={t} at={L.slam} dur={0.3} peak={0.25} />
      <Flash t={t} at={5.48} dur={0.2} peak={0.28} />
    </AbsoluteFill>
  );
};
