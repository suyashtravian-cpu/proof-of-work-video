// Work: "02 / Selected builds". The pinned section turns vertical scroll into a
// horizontal track. Each project (Biltib, iCreateEpic, Moolank 365) lands in turn;
// the cursor rests on its preview (OPEN disc) while title + one-liner are readable.
import { ease } from "../engine.mjs";

export const markers = [
  { t: 0.0, label: "02 / Selected builds heading framed under the black header, Biltib on the page margin, 01 / 03; clean hold to 1.5" },
  { t: 2.0, label: "cursor enters from lower right" },
  { t: 2.5, label: "Biltib preview hovered (white OPEN cursor)" },
  { t: 2.9, label: "Biltib: cursor still, title + one-liner readable; hold to 5.0" },
  { t: 5.0, label: "slide to iCreateEpic: track starts moving (fastest at ~5.9)" },
  { t: 6.0, label: "counter 02 / 03; iCreateEpic preview arrives under the cursor (OPEN)" },
  { t: 6.9, label: "iCreateEpic lands centred" },
  { t: 7.2, label: "iCreateEpic: cursor still, title + one-liner readable; hold to 9.3" },
  { t: 9.3, label: "slide to Moolank 365: track starts moving (fastest at ~10.2)" },
  { t: 10.2, label: "counter 03 / 03; Moolank 365 preview arrives under the cursor (OPEN) at 10.3" },
  { t: 11.2, label: "Moolank 365 lands centred" },
  { t: 11.5, label: "Moolank 365: cursor still, title + one-liner readable; hold to end" },
  { t: 14.3, label: "end" },
];

const FPS = process.env.PREVIEW ? 30 : 60;
const lerp = (a, b, t) => a + (b - a) * t;

// Uniform Catmull-Rom through the points, re-parameterised by arc length.
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
    const g = await s.page.evaluate(() => {
      const work = document.querySelector(".work-section"), sticky = document.querySelector(".work-sticky");
      const vp = document.querySelector(".work-viewport"), track = document.querySelector(".work-track");
      return {
        workTop: work.offsetTop,
        start: work.offsetTop - 77,
        total: work.offsetHeight - sticky.offsetHeight,
        // Same as setupWork() in app.js.
        distance: Math.max(0, track.scrollWidth - vp.clientWidth + parseFloat(getComputedStyle(vp).paddingLeft)),
      };
    });
    // Progress p in the pinned section -> window scrollY (mirrors updateScroll() in app.js).
    const yAt = (p) => g.start + p * g.total;

    // Opening framing. At the site's own p = 0 the bottom of the light (#f1f1f1) manifesto
    // still sits under the translucent fixed header, so the header renders grey (#292929)
    // instead of black, and the section is not stuck yet: the first 15px of the first slide
    // lift the whole block while the header darkens. So the take starts 4px past the
    // manifesto's bottom edge (sticky engaged, header black, as in every other clip), and
    // the ~74px of track travel that costs is handed back with a constant CSS `translate`
    // on the track (it composes with the site's transform), plus the matching offset on the
    // progress meter, so Biltib still sits on the 72px page margin under the heading.
    const Y0 = g.workTop + 4;
    const P0 = (Y0 - g.start) / g.total;
    const COMP = P0 * g.distance;
    await s.page.evaluate(([c, p0]) => {
      document.querySelector(".work-track").style.translate = `${c}px 0`;
      document.querySelector(".work-meter>span").style.translate = `${-p0 * 200}% 0`;
    }, [COMP, P0]);
    // Window-scroll progress p plus viewport scrollLeft L that puts project i's left edge at x.
    const solve = (i, { x, p, left }) =>
      s.page.evaluate(([i, x, p, L, c, dist]) => {
        const proj = document.querySelectorAll(".project")[i];
        const track = document.querySelector(".work-track"), vp = document.querySelector(".work-viewport");
        const r = proj.getBoundingClientRect();
        const base = r.left - new DOMMatrix(getComputedStyle(track).transform).m41 - c + vp.scrollLeft;
        if (x === null) x = (innerWidth - r.width) / 2; // centred
        // x = base - p*dist + c - L
        return L === null ? { p, left: base - p * dist + c - x } : { p: (base + c - L - x) / dist, left: L };
      }, [i, x ?? null, p ?? null, left ?? null, COMP, g.distance]);

    // The pinned viewport is overflow:hidden but its scrollLeft adds to the track offset.
    // On load the site's scroll-snap leaves it at 72px, so Biltib sits flush against the
    // left edge; 0 is the state setupWork() intends (Biltib on the 72px page margin).
    // We also ride it during the last slide so Moolank 365 lands centred before the
    // next section peeks in at the bottom (p > ~0.955).
    // The site moves the track from its rAF loop only after a `scroll` event has marked it
    // dirty. The real event is delivered by the browser's own rendering step (in practice
    // during the mouse move that precedes each frame); dispatching one right after each
    // scrollTo guarantees the same-frame update instead of relying on that timing.
    const sync = (x) => s.page.evaluate((v) => {
      document.querySelector(".work-viewport").scrollLeft = v;
      window.dispatchEvent(new Event("scroll"));
    }, x);

    // DEBUG=1 logs when hover states change, to keep the markers frame-accurate.
    let frames = 0, last = "";
    const track = async () => {
      if (!process.env.DEBUG) return;
      const st = await s.page.evaluate(() => {
        const c = document.querySelector(".cursor");
        const i = [...document.querySelectorAll(".project-image")].findIndex((e) => e.matches(":hover"));
        return [c.style.transform ? "cursor-visible" : "", c.classList.contains("active") ? "active" : "", i,
          document.querySelector(".work-fraction").textContent].join("|");
      });
      if (st !== last) console.log((frames / FPS).toFixed(2), st);
      last = st;
    };
    const hold = async (sec) => { frames += Math.round(sec * FPS); await s.hold(sec); await track(); };

    let cur = [1490, 960]; // off-screen lower right
    let left = 0;
    const move = async (sec, points, { fn = ease.inOut, scroll, scrollFn = ease.inOutQuint } = {}) => {
      const c = spline([cur, ...points]);
      const n = Math.max(1, Math.round(sec * FPS));
      const y0 = await s.page.evaluate(() => scrollY);
      const l0 = left;
      for (let f = 1; f <= n; f++) {
        if (scroll) {
          const k = scrollFn(f / n);
          await s.jump(lerp(y0, yAt(scroll.p), k));
          left = lerp(l0, scroll.left ?? l0, k);
          await sync(left);
        }
        cur = c(fn(f / n));
        await s.mouseAt(cur[0], cur[1]);
        await hold(1 / FPS);
      }
    };

    // Frame the heading: section pinned, Biltib on the page margin.
    await s.jump(Y0);
    await sync(0); // also puts the track + progress bar right on frame 1
    await s.mouseAt(...cur);
    await hold(1.5);

    // Cursor in from the lower right, under the copy, up onto Biltib's preview. The OPEN
    // disc is white, so it rests on the dark "Break the page" thumbnail, not the white page.
    await move(1.4, [[1120, 780], [720, 670], [496, 578]], { fn: ease.inOut });
    await hold(1.8);

    // Slide to iCreateEpic, centred. Cursor drifts up a little.
    const epic = await solve(1, { left: 0 });
    if (process.env.DEBUG) console.log("P0", P0, "COMP", COMP, "epic", epic);
    await move(2.5, [[562, 540], [610, 470]], { scroll: { p: epic.p, left: 0 } });
    await hold(1.8);

    // Slide to Moolank 365, stopping before the next section enters the frame (p > ~0.955),
    // with the extra horizontal offset that centres the project.
    const moolank = await solve(2, { p: 0.95 });
    if (process.env.DEBUG) console.log("moolank", moolank);
    await move(2.5, [[640, 430], [650, 375]], { scroll: { p: moolank.p, left: moolank.left } });
    if (process.env.DEBUG)
      console.log(await s.page.evaluate(() => [...document.querySelectorAll(".project")].map((e) => e.getBoundingClientRect().left)));
    await hold(2.8);
    if (process.env.DEBUG) console.log("total", (frames / FPS).toFixed(2));
  },
};
