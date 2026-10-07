// The whole site, top to contact, as one continuous take. No cursor until the last
// beat: every section is reached on an eased scroll and held with its headline framed
// under the header. The manifesto is crawled slowly so its word-by-word reveal lights
// up readably, the pinned work section is travelled through all three projects, and
// the take ends with the cursor gliding onto the big contact arrow, which turns.
import { ease } from "../engine.mjs";

const FPS = process.env.PREVIEW ? 30 : 60;
const DEBUG = !!process.env.DEBUG;

// ---------------------------------------------------------------------------
// Timing (seconds). Every value is a multiple of 0.1 so 30fps previews and 60fps
// finals land on identical frames; the markers below are derived from these.
// ---------------------------------------------------------------------------
const MANIFESTO_CRAWL = 135; // px/s while the words light up
const MANIFESTO_SEGS = [[0.8, 0, "P"], [0.6, "P", MANIFESTO_CRAWL], [3.9, MANIFESTO_CRAWL, MANIFESTO_CRAWL], [1.2, MANIFESTO_CRAWL, 0]];
const D = {
  hero: 2.8, // includes the ~1s headline build-in
  toManifesto: MANIFESTO_SEGS.reduce((a, s) => a + s[0], 0),
  manifesto: 1.4,
  toWork: 1.4, // lands softly where the section pins
  clearHeader: 0.5, // pinned content still; the manifesto's last strip leaves the header
  biltib: 1.4,
  toEpic: 2.0,
  epic: 1.3,
  toMoolank: 2.0,
  moolank: 1.3,
  toLab: 1.6,
  lab: 1.4, // row 02's reveal finishes ~0.1s in (+-1 frame run to run); the marker starts after it
  toRows: 1.3,
  rows: 1.2,
  toSignals: 1.6,
  signals: 1.3,
  toThinking: 1.9,
  thinking: 1.3,
  toCreative: 2.1,
  creative: 1.3,
  toArchive: 1.9,
  archive: 1.3,
  toGrid: 1.8,
  grid: 1.1,
  toContact: 2.1,
  contact: 1.0,
  cursorIn: 1.3,
  end: 1.8,
};
const f30 = (s) => Math.round(s * 30) / 30;
const at = (key) => {
  let t = 0;
  for (const k of Object.keys(D)) {
    if (k === key) return +t.toFixed(2);
    t += f30(D[k]);
  }
  return +t.toFixed(2);
};

// Offsets inside a move were read from the DEBUG=1 preview log (word opacity reaching 1,
// cursor entering the frame, arrow transform changing).
const plus = (key, dt) => +(at(key) + dt).toFixed(2);
export const markers = [
  { t: 0.0, label: "page load: globe + orbit cards, hero headline starts building in" },
  { t: 1.0, label: "HERO: 'I make ideas real.' fully built; hold to " + at("toManifesto") },
  { t: at("toManifesto"), label: "scroll leaves the hero (marquee passes), then slows to a crawl" },
  { t: plus("toManifesto", 2.1), label: "manifesto words start lighting one by one ('AI makes the distance...'), ~0.3s per word" },
  { t: plus("toManifesto", 5.6), label: "last word ('smaller.') lit; scroll settling" },
  { t: at("manifesto"), label: "MANIFESTO: 'AI makes the distance between an idea and a live experiment much smaller.' all lit, grey header, '02 / Selected builds  From zero. To out there.' teased below; hold to " + at("toWork") },
  { t: at("clearHeader"), label: "WORK lands pinned: '02 / Selected builds  From zero. To out there.' + Biltib, 01 / 03 (header finishes darkening by " + at("biltib") + ")" },
  { t: at("biltib"), label: "WORK: Biltib, clean black header; hold to " + at("toEpic") },
  { t: at("epic"), label: "WORK: iCreateEpic centred, 02 / 03; hold to " + at("toMoolank") },
  { t: at("moolank"), label: "WORK: Moolank 365 centred, 03 / 03; hold to " + at("toLab") },
  { t: plus("lab", 0.2), label: "CONVERSION LAB: 'A click needs somewhere to go.' + The Whole Truth, Fix My Curls; hold to " + at("toRows") },
  { t: plus("rows", 0.1), label: "CONVERSION LAB: rows 02-04 (Fix My Curls, The Pant Project, DrinkPrime); hold to " + at("toSignals") },
  { t: at("signals"), label: "SIGNALS: 'Then I put it in front of people.' + six tabs + Moolank 112; hold to " + at("toThinking") },
  { t: at("thinking"), label: "THINKING: 'The interesting part is often after the click.' + two cases; hold to " + at("toCreative") },
  { t: at("creative"), label: "CREATIVE: 'A little strategy. A lot of making.' + whole collage; hold to " + at("toArchive") },
  { t: at("archive"), label: "ARCHIVE: 'Curiosity, with a URL.' + Atlas AI / Lexis / Open Interest; hold to " + at("toGrid") },
  { t: plus("toGrid", 0.4), label: "archive rows 2-3 fade up in a cascade as the grid pans in" },
  { t: at("grid"), label: "ARCHIVE grid: Moolank 365, Homeward, Words for Love, Time Machine Love Letter, Eyeline, Rank Please; hold to " + at("toContact") },
  { t: plus("toContact", 1.0), label: "end marquee 'STILL CURIOUS. STILL BUILDING.' passes" },
  { t: at("contact"), label: "CONTACT: 'Have a what if? ↗' + email/phone, clean; no cursor until " + plus("cursorIn", 0.5) },
  { t: plus("cursorIn", 0.5), label: "cursor ring enters from the lower right" },
  { t: plus("cursorIn", 0.7), label: "cursor over the headline link: the big ↗ starts turning" },
  { t: plus("cursorIn", 1.2), label: "arrow fully turned to →" },
  { t: at("end"), label: "cursor resting on the arrow's shaft; final hold to end (" + at("__end") + ")" },
];

// ---------------------------------------------------------------------------
// Easing
// ---------------------------------------------------------------------------
// Position from a piecewise velocity profile: each segment [sec, v0, v1] blends its
// velocity with smoothstep, so speed (and position) never jumps between segments.
function profile(segs) {
  const seg = segs.map(([T, v0, v1]) => ({ T, v0, v1 }));
  let t0 = 0, d0 = 0;
  for (const s of seg) {
    s.t0 = t0; s.d0 = d0;
    t0 += s.T; d0 += (s.T * (s.v0 + s.v1)) / 2;
  }
  const T = t0, dist = d0;
  const posAt = (t) => {
    const s = seg.find((s) => t <= s.t0 + s.T) ?? seg[seg.length - 1];
    const u = Math.min(1, Math.max(0, (t - s.t0) / s.T));
    return s.d0 + s.T * (s.v0 * u + (s.v1 - s.v0) * (u ** 3 - u ** 4 / 2));
  };
  return { T, dist, posAt, fn: (u) => (u >= 1 ? 1 : posAt(u * T) / dist) };
}
// Section-to-section: soft acceleration, a short cruise, a long gentle landing.
const glide = profile([[0.3, 0, 1], [0.15, 1, 1], [0.55, 1, 0]]).fn;
// Shorter repositioning moves: no cruise, longer settle.
const nudge = profile([[0.4, 0, 1], [0.6, 1, 0]]).fn;

// Solve the "P" (peak) velocity so a velocity profile covers exactly `dist` px.
function solve(segs, dist) {
  const sub = (p) => segs.map((s) => s.map((v) => (v === "P" ? p : v)));
  const a = profile(sub(0)).dist, b = profile(sub(1)).dist;
  return profile(sub((dist - a) / (b - a)));
}

// Uniform Catmull-Rom through the points, re-parameterised by arc length.
function spline(P) {
  const seg = P.length - 1;
  const atp = (i) => P[Math.max(0, Math.min(seg, i))];
  const raw = (u) => {
    const k = Math.min(seg - 1e-9, Math.max(0, u * seg));
    const i = Math.floor(k), t = k - i;
    const [a, b, c, d] = [atp(i - 1), atp(i), atp(i + 1), atp(i + 2)];
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

const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v) => Math.min(1, Math.max(0, v));
const smooth = (v) => (v <= 0 ? 0 : v >= 1 ? 1 : v * v * (3 - 2 * v));

export default {
  options: { width: 1440, height: 900, scale: 2 },
  async script(s) {
    const page = s.page;
    // ---- geometry (document Y of each section's tag line, work pin range) ----
    const g = await page.evaluate(() => {
      const top = (el) => { let t = 0; for (let n = el; n; n = n.offsetParent) t += n.offsetTop; return t; };
      const tag = (sel) => top(document.querySelector(sel + " .section-tag"));
      const work = document.querySelector(".work-section"), sticky = document.querySelector(".work-sticky");
      const vp = document.querySelector(".work-viewport"), track = document.querySelector(".work-track");
      return {
        statement: top(document.querySelector(".word-reveal")),
        manifestoTop: top(document.querySelector(".manifesto")),
        workTop: work.offsetTop,
        workStart: work.offsetTop - 77, // p = 0 in the site's updateScroll()
        workPin: work.offsetTop + parseFloat(getComputedStyle(work).paddingTop) - 77, // sticky engages
        workTotal: work.offsetHeight - sticky.offsetHeight,
        // Same as setupWork() in app.js.
        distance: Math.max(0, track.scrollWidth - vp.clientWidth + parseFloat(getComputedStyle(vp).paddingLeft)),
        lab: tag(".conversion"),
        rows: top(document.querySelectorAll(".tool-row")[1]),
        signalsTop: top(document.querySelector(".signals")),
        thinking: tag(".thinking"),
        creative: tag(".creative"),
        archive: tag(".archive"),
        grid: top(document.querySelectorAll(".artifact")[3]),
        max: document.documentElement.scrollHeight - innerHeight,
      };
    });
    const workY = (p) => g.workStart + p * g.workTotal;
    // Track offset the site applies at window scroll y (updateScroll(): -p * distance).
    const siteShift = (y) => clamp((y - g.workStart) / g.workTotal) * g.distance;
    // The header (top 2px, 77px tall) is translucent and blurred, so any section edge
    // that sits behind it turns it two-tone. Holds keep those edges out of the header.
    const Y = {
      // Manifesto top at the window top: the header is evenly grey over the white
      // section, the statement sits at ~191px with all 13 words lit (needs <= 264), and
      // the whole '02 / Selected builds  From zero. To out there.' heading shows below.
      manifesto: g.manifestoTop,
      // Biltib: 4px past the manifesto's bottom edge, so the section is pinned and the
      // header is black (as in every other dark hold and in work.mjs).
      work: g.workTop + 4,
      lab: g.lab - 117, // tag 40px under the header, rows 01-02 in frame
      rows: g.rows - 136, // rows 02-04 in full (row 01's tail under the header), dark band below
      signals: g.signalsTop, // white section flush with the window top: even grey header, tag ~100px
      // Case 03 must stay below its 8% reveal threshold or it would fade in during the
      // hold, which pins this ~26px short of the signals section's bottom edge.
      thinking: g.thinking - 126,
      creative: g.creative - 95, // headline + the whole collage
      archive: g.archive - 95, // headline + row-1 titles and CTAs
      grid: g.grid - 100, // rows 2-3 of the grid
      contact: g.max,
    };
    // Track compensation at the Biltib hold. Scrolling past the pin point moves the
    // track left (the site's p > 0), which would push Biltib off the page margin; a CSS
    // `translate` on the track (it composes with the site's transform) hands it back,
    // and is ramped out during the slide to iCreateEpic.
    const COMP = siteShift(Y.work);

    // ---- DEBUG: log state changes so markers stay frame-accurate ----
    let frames = 0, last = "";
    const now = () => frames / FPS;
    const track = async () => {
      if (!DEBUG) return;
      const st = await page.evaluate(() => {
        const inView = (el) => { const r = el.getBoundingClientRect(); return r.bottom > 79 && r.top < innerHeight; };
        const rev = [...document.querySelectorAll(".reveal")].filter(inView);
        const fading = rev.filter((e) => e.classList.contains("visible") && +getComputedStyle(e).opacity < 0.99).length;
        const words = [...document.querySelectorAll(".word-reveal span")];
        const lit = words.filter((w) => +getComputedStyle(w).opacity > 0.99).length;
        const arrow = getComputedStyle(document.querySelector(".contact-arrow")).transform;
        const vis = (el) => { const r = el.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight; };
        const b0 = document.querySelector(".project");
        const meter = document.querySelector(".work-meter>span");
        const biltib = vis(document.querySelector(".work-sticky"))
          ? " | biltib x " + Math.round(b0.getBoundingClientRect().left) + " | meter x " + Math.round(meter.getBoundingClientRect().left)
          : "";
        return `lit ${lit}/${words.length} | fading ${fading} | ${document.querySelector(".work-fraction").textContent} | cursor ${document.querySelector(".cursor").className} | arrow ${arrow}${biltib}`;
      });
      if (st !== last) console.log(now().toFixed(2), Math.round(await page.evaluate(() => scrollY)), st);
      last = st;
    };
    const frame = async () => { await s.hold(1 / FPS); frames++; await track(); };
    const hold = async (sec) => { for (let i = Math.round(sec * FPS); i > 0; i--) await frame(); };
    const log = (...a) => DEBUG && console.log(...a);

    // Per-frame page state. The site moves the work track, the word reveal, the collage
    // parallax and the progress bar from its rAF tick, and only after a `scroll` event
    // has marked it dirty. The real event is delivered during the browser's own rendering
    // step, which sometimes falls after the virtual clock's tick for that frame: the track
    // then freezes for a frame and jumps double on the next (seen as 0/-62px steps in the
    // first preview). Dispatching the event right after scrollTo makes every frame read
    // the scroll it is rendered at.
    const apply = (y, { left, comp } = {}) =>
      page.evaluate(([y, left, comp, d]) => {
        window.scrollTo(0, y);
        if (left !== null) document.querySelector(".work-viewport").scrollLeft = left;
        if (comp !== null) {
          document.querySelector(".work-track").style.translate = `${comp}px 0`;
          // The progress meter is driven by the same p; keep it in step with the track.
          document.querySelector(".work-meter>span").style.translate = `${(-comp / d) * 200}% 0`;
        }
        window.dispatchEvent(new Event("scroll"));
      }, [y, left ?? null, comp ?? null, g.distance]);

    // Scroll to `y` over `sec` with easing `fn`; `each(k, y)` returns extra per-frame state.
    let curY = 0;
    const scroll = async (sec, y, fn, each) => {
      const y0 = curY, n = Math.max(1, Math.round(sec * FPS));
      for (let f = 1; f <= n; f++) {
        const k = fn(f / n);
        curY = lerp(y0, y, k);
        await s.jump(curY); // keeps the engine's own scroll state in step
        await apply(curY, each ? each(k, curY) : {});
        await frame();
      }
      curY = y;
    };

    // ---- before frame 1 ----
    // The site's scroll-snap leaves the pinned work viewport at scrollLeft 72 on load;
    // 0 is the state setupWork() intends (Biltib on the 72px page margin).
    await apply(0, { left: 0, comp: 0 });
    // Engine limitation: under the virtual clock a CSS transition that is retargeted on
    // every frame never advances (each new one is pinned at currentTime 0 and replaced
    // before it renders). The site smooths two scroll-driven transforms that way: the
    // work progress meter (0.15s) and the creative collage parallax (0.6s). They froze
    // during scrolls and then jumped/drifted afterwards (meter in steps of 30-130px; the
    // collage drifted ~7px into its hold). Without the transition they follow the scroll
    // exactly, which is what the smoothing converges to on a real screen.
    await page.addStyleTag({ content: ".work-meter>span,.creative-card{transition:none!important}" });
    // The contact arrow's magnetic pull is set straight from the pointer, so it would
    // jump ~25px the frame the cursor crosses its edge. Route it through a variable we
    // drive with the same 0.15 pull, faded in over the first part of the approach.
    await page.addStyleTag({ content: ".contact-arrow{translate:var(--pull-x,0px) var(--pull-y,0px)!important}" });
    await s.jump(0);

    // 1. Hero: headline builds in (~1s), then a readable hold.
    await hold(D.hero);
    log("hero done", now());

    // 2. Out of the hero, then a slow crawl while the manifesto lights word by word.
    const man = solve(MANIFESTO_SEGS, Y.manifesto);
    log("manifesto peak px/s", Math.round((man.posAt(0.8) - man.posAt(0.79)) * 100), "crawl from", Math.round(man.posAt(1.4)), "to", Math.round(man.posAt(5.3)));
    await scroll(D.toManifesto, Y.manifesto, man.fn);
    await hold(D.manifesto);

    // 3. Into the pinned work section. The content lands softly where the sticky block
    // engages; then, with the content already still, the last 66px of scroll carry the
    // manifesto's bottom strip out from behind the header, which turns from grey to
    // black. The track is compensated throughout, so Biltib never leaves the margin.
    const comp = (k, y) => ({ comp: siteShift(y) });
    await scroll(D.toWork, g.workPin, nudge, comp);
    await scroll(D.clearHeader, Y.work, ease.inOut, comp);
    await hold(D.biltib);
    // iCreateEpic (p = 0.5 centres it). Ramping the compensation out with the same
    // easing makes the net slide exactly proportional to the eased progress.
    await scroll(D.toEpic, workY(0.5), glide, (k) => ({ comp: COMP * (1 - k) }));
    await hold(D.epic);
    // Moolank 365: stop at p = 0.95 (before the next section shows) and ride the
    // viewport's scrollLeft so the project lands centred.
    const P3 = 0.95;
    const centreLeft = await page.evaluate((p3) => {
      const proj = document.querySelectorAll(".project")[2];
      const vp = document.querySelector(".work-viewport"), track = document.querySelector(".work-track");
      const distance = Math.max(0, track.scrollWidth - vp.clientWidth + parseFloat(getComputedStyle(vp).paddingLeft));
      const cur = new DOMMatrix(getComputedStyle(track).transform).m41;
      const r = proj.getBoundingClientRect();
      const leftAt = r.left - cur + vp.scrollLeft - p3 * distance;
      return leftAt + r.width / 2 - innerWidth / 2;
    }, P3);
    log("COMP", COMP, "moolank scrollLeft", centreLeft);
    await scroll(D.toMoolank, workY(P3), glide, (k) => ({ left: lerp(0, centreLeft, k) }));
    await hold(D.moolank);

    // 4. Conversion lab: headline, then all four concept rows.
    await scroll(D.toLab, Y.lab, glide);
    await hold(D.lab);
    await scroll(D.toRows, Y.rows, nudge);
    await hold(D.rows);

    // 5. Signals, 6. thinking, 7. creative (the collage parallax plays on the landing),
    // 8. archive, then its grid.
    await scroll(D.toSignals, Y.signals, glide);
    await hold(D.signals);
    await scroll(D.toThinking, Y.thinking, glide);
    await hold(D.thinking);
    await scroll(D.toCreative, Y.creative, glide);
    await hold(D.creative);
    await scroll(D.toArchive, Y.archive, glide);
    await hold(D.archive);
    await scroll(D.toGrid, Y.grid, nudge);
    await hold(D.grid);

    // 9. Contact, clean.
    await scroll(D.toContact, Y.contact, glide);
    await hold(D.contact);

    // 10. The only cursor beat: in from the lower right (between the copy button and
    // the arrow), onto the arrow. Hovering the headline link turns it 45 degrees.
    const arrow = await page.evaluate(() => {
      const r = document.querySelector(".contact-arrow").getBoundingClientRect();
      return { cx: r.left + r.width / 2, cy: r.top + r.height / 2, hw: r.width / 2, hh: r.height / 2 };
    });
    const REST = [arrow.cx - 10, arrow.cy + 22];
    let cur = [1490, 770];
    await s.mouseAt(...cur);
    const path = spline([cur, [1400, 655], [arrow.cx + 70, arrow.cy + 95], REST]);
    const n = Math.round(D.cursorIn * FPS);
    for (let f = 1; f <= n; f++) {
      cur = path(ease.inOut(f / n));
      await s.mouseAt(...cur);
      const dx = cur[0] - arrow.cx, dy = cur[1] - arrow.cy;
      const nd = Math.max(Math.abs(dx) / arrow.hw, Math.abs(dy) / arrow.hh);
      const w = smooth((1 - nd) / 0.55);
      await page.evaluate(
        ([x, y]) => {
          const el = document.querySelector(".contact-arrow");
          el.style.setProperty("--pull-x", x + "px");
          el.style.setProperty("--pull-y", y + "px");
        },
        [dx * 0.15 * w, dy * 0.15 * w],
      );
      await frame();
    }
    await hold(D.end);
    log("total", now().toFixed(2), "expected", at("__end"));
  },
};
