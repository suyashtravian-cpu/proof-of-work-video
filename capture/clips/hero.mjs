// Hero: the page-load moment. "I make ideas real." builds in, the cursor enters
// from the lower right, glides across the orbit (globe + cards parallax), rests on
// the Moolank 365 orbit card (orbit pauses, cursor turns into the OPEN disc), then
// drifts to the magnetic down-arrow and sweeps along its rim so it leans toward it.
import { ease } from "../engine.mjs";

export const markers = [
  { t: 0.0, label: "page load: headline starts building in (hidden on frame 0)" },
  { t: 1.4, label: "\"I make ideas real.\" fully built; clean hold to 1.8" },
  { t: 2.0, label: "cursor ring enters from lower right (parallax fades in)" },
  { t: 2.8, label: "cursor crossing the globe between the Biltib and iCreateEpic cards" },
  { t: 3.6, label: "Moolank 365 orbit card hovered: orbit pauses, white OPEN cursor, card border lights" },
  { t: 4.6, label: "cursor settled on the card; still hold to 5.6" },
  { t: 5.6, label: "drift toward the down-arrow begins" },
  { t: 6.3, label: "cursor leaves the card, orbit resumes" },
  { t: 7.1, label: "down-arrow hovered: fills white, the magnet grabs it up-right toward the cursor" },
  { t: 7.4, label: "cursor sweeps round the rim to straight below (to 9.0); the button follows it round (~8px)" },
  { t: 9.0, label: "hold: button pulled down toward the cursor, arrow pointing at it; to end" },
  { t: 10.2, label: "end" },
];

const FPS = process.env.PREVIEW ? 30 : 60;

// Uniform Catmull-Rom through the points, re-parameterised by arc length so the
// cursor speed follows the easing curve only (no speed jumps between waypoints).
function spline(P) {
  const seg = P.length - 1;
  const at = (i) => P[Math.max(0, Math.min(seg, i))];
  const raw = (u) => {
    const k = Math.min(seg - 1e-9, Math.max(0, u * seg));
    const i = Math.floor(k), t = k - i;
    const [a, b, c, d] = [at(i - 1), at(i), at(i + 1), at(i + 2)];
    const cr = (a, b, c, d) =>
      0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (-a + 3 * b - 3 * c + d) * t * t * t);
    return [cr(a[0], b[0], c[0], d[0]), cr(a[1], b[1], c[1], d[1])];
  };
  const N = 800, S = [raw(0)], L = [0];
  for (let j = 1; j <= N; j++) {
    const p = raw(j / N);
    L.push(L[j - 1] + Math.hypot(p[0] - S[j - 1][0], p[1] - S[j - 1][1]));
    S.push(p);
  }
  return (f) => {
    const target = f * L[N];
    let lo = 0, hi = N;
    while (hi - lo > 1) {
      const m = (lo + hi) >> 1;
      if (L[m] < target) lo = m; else hi = m;
    }
    const t = (target - L[lo]) / (L[hi] - L[lo] || 1);
    return [S[lo][0] + (S[hi][0] - S[lo][0]) * t, S[lo][1] + (S[hi][1] - S[lo][1]) * t];
  };
}

export default {
  options: { width: 1440, height: 900, scale: 2 },
  async script(s) {
    const geo = await s.page.evaluate(() => {
      const st = document.querySelector(".orbital-stage").getBoundingClientRect();
      const b = document.querySelector(".round-link").getBoundingClientRect();
      return { st: [st.left, st.top, st.width, st.height], btn: [b.left + b.width / 2, b.top + b.height / 2] };
    });
    const [SL, ST, SW, SH] = geo.st;
    const smooth = (v) => (v <= 0 ? 0 : v >= 1 ? 1 : v * v * (3 - 2 * v));

    // The site sets the orbit parallax straight from the pointer and zeroes it on
    // pointerleave, so the cards + globe jump ~5px in one frame when the cursor enters
    // the stage (from the viewport edge) or leaves it (towards the button). To keep
    // the footage free of that twitch, `par(cur)` returns a 0..1 weight and we follow
    // each real move with a non-bubbling pointermove on the stage carrying the
    // weighted position (only the stage's parallax handler sees it; the custom cursor,
    // hovers and orbit pause still react to the real pointer).
    // DEBUG=1 logs when hover states change, to keep the markers frame-accurate.
    let frames = 0, last = "";
    const track = async () => {
      if (!process.env.DEBUG) return;
      const st = await s.page.evaluate(() => {
        const c = document.querySelector(".cursor");
        return [c.style.transform ? "cursor-visible" : "", c.classList.contains("active") ? "active" : "",
          document.querySelector(".orbit-card:hover")?.dataset.orbit ?? "", document.querySelector(".round-link:hover") ? "button" : ""].join("|");
      });
      if (st !== last) console.log((frames / FPS).toFixed(2), st);
      last = st;
    };
    const hold = async (sec) => { frames += Math.round(sec * FPS); await s.hold(sec); await track(); };

    let cur = [1478, 912]; // just off-screen, lower right: no pointer events until it enters
    const glide = async (sec, points, fn = ease.inOut, par) => {
      const c = spline([cur, ...points]);
      const n = Math.max(1, Math.round(sec * FPS));
      for (let f = 1; f <= n; f++) {
        cur = c(fn(f / n));
        await s.mouseAt(cur[0], cur[1]);
        const inView = cur[0] < 1440 && cur[1] < 900;
        const inStage = cur[0] >= SL && cur[0] <= SL + SW && cur[1] >= ST && cur[1] <= ST + SH;
        const w = par ? par(cur) : 1;
        if (inView && inStage && w < 1) {
          const sx = SL + SW * (0.5 + ((cur[0] - SL) / SW - 0.5) * w);
          const sy = ST + SH * (0.5 + ((cur[1] - ST) / SH - 0.5) * w);
          await s.page.evaluate(([x, y]) => {
            document.querySelector(".orbital-stage")
              .dispatchEvent(new PointerEvent("pointermove", { clientX: x, clientY: y, bubbles: false }));
          }, [sx, sy]);
        }
        await hold(1 / FPS);
      }
    };
    // Where orbit card i will be (centre, viewport px) at virtual time `ms`, with the pointer at `ptr`.
    // Mirrors position() in the site's app.js; the first rAF tick has dt=0, so elapsed = now - 1 frame.
    const cardAt = (i, ms, ptr) => {
      const [L, T, W, H] = [SL, ST, SW, SH];
      const a = (ms - 1000 / FPS) * 0.000065 + (i * Math.PI * 2) / 3 - 1.03;
      const px = (ptr[0] - L) / W - 0.5, py = (ptr[1] - T) / H - 0.5;
      return [L + W / 2 + Math.cos(a) * W * 0.29 + px * 10, T + H * 0.43 + Math.sin(a) * H * 0.32 + py * 8];
    };

    // 1. Page load: the headline builds in (done at ~1.4s). Clean hold.
    await s.mouseAt(...cur);
    await hold(1.8);

    // 2. Enter from the lower right, up the free lane right of the front card, left through
    //    the gap between the two right-hand cards, across the globe, onto the Moolank card.
    const GLIDE = 2.8;
    const now = await s.page.evaluate(() => window.__vclock.now());
    const OFF = [34, -18]; // rest on the right half of the card's screenshot, clear of its caption
    let aim = [790, 370];
    for (let k = 0; k < 3; k++) {
      // The orbit freezes the moment the pointer enters the card, ~60% into this glide.
      const c = cardAt(2, now + 0.6 * GLIDE * 1000, aim);
      aim = [c[0] + OFF[0], c[1] + OFF[1]];
    }
    // Already moving as it enters (mostly ease-out), soft landing on the card; the
    // parallax fades in over the first ~200px inside the window.
    const entry = (t) => 0.4 * ease.inOut(t) + 0.6 * ease.out(t);
    await glide(GLIDE, [[1385, 650], [1305, 462], [1075, 442], aim], entry, (p) => smooth((1440 - p[0]) / 210));
    if (process.env.DEBUG)
      console.log("card2 hover", aim, await s.center(".orbit-card", 2),
        await s.page.evaluate(() => [document.querySelector(".cursor").className, document.querySelector(".orbit-card-2:hover") !== null]));

    // 3. Beat on the card: orbit paused, cursor is the white OPEN disc.
    await hold(1.0);

    // 4. Drift down-left to the magnetic button, arriving just inside its upper-right rim,
    //    so the magnet grabs it toward the cursor. The parallax relaxes to centre by the
    //    time the cursor crosses the stage edge.
    const [bx, by] = geo.btn;
    const x0 = cur[0];
    await glide(1.6, [[cur[0] - 120, cur[1] + 190], [bx + 70, by - 52], [bx + 22, by - 22]], ease.inOut,
      (p) => 1 - smooth((x0 - p[0]) / (x0 - SL)));
    await hold(0.2);

    // 5. Sweep slowly round the rim, upper-right -> right -> straight below, easing out to
    //    a 34px radius. The site's magnet offsets the button by 0.15 x the pointer's offset
    //    from its (already shifted) centre, ~4.4px here, and the hit test follows the shifted
    //    button, so this is about as far out as the pointer can go and stay hovered. The
    //    button follows the cursor round: ~8px of travel (was ~5px on a quarter arc).
    const rim = [[-15, 33], [20, 33.5], [55, 34], [90, 34]].map(([deg, r]) =>
      [bx + r * Math.cos((deg * Math.PI) / 180), by + r * Math.sin((deg * Math.PI) / 180)]);
    await glide(1.6, rim, ease.inOut);
    if (process.env.DEBUG)
      console.log("button", await s.page.evaluate(() => document.querySelector(".round-link").style.translate),
        await s.page.evaluate(() => !!document.querySelector(".round-link:hover")));

    // 6. Hold on the pulled, hovered button.
    await hold(1.2);
    if (process.env.DEBUG) console.log("total", (frames / FPS).toFixed(2));
  },
};
