// Mobile: an iPhone-sized pass through the whole page, hero to contact. No cursor on touch:
// thumb-like scrolls (gentle start, long momentum settle), a horizontal swipe through the
// three builds, and one tap on a campaign tab so the big metric counts up on camera.
// Every stop frames its section headline under the 66px mobile header and is held for
// the editor's cut. All stop positions are measured from the live layout at run time.
import { ease } from "../engine.mjs";

export const markers = [
  { t: 0.0, label: "page load: hero headline starts building in (hidden on frame 0)" },
  { t: 1.4, label: "\"I make ideas real.\" fully built; clean hold to 2.4" },
  { t: 2.4, label: "thumb scroll down to the orbit (1.1s)" },
  { t: 3.5, label: "intro copy + orbit with the three live-site cards; hold to 4.7" },
  { t: 4.7, label: "slow scroll into 01 / The way I work: manifesto words light up as it rises (2.4s)" },
  { t: 7.1, label: "manifesto framed, every word lit; hold to 8.5" },
  { t: 8.5, label: "scroll to 02 / Selected builds (1.4s)" },
  { t: 9.9, label: "'From zero. To out there.' + full Biltib card; hold to 11.3" },
  { t: 11.3, label: "swipe to iCreateEpic (0.9s)" },
  { t: 12.2, label: "iCreateEpic card framed; hold to 13.5" },
  { t: 13.5, label: "swipe to Moolank 365 (0.9s)" },
  { t: 14.4, label: "Moolank 365 card framed; hold to 15.7" },
  { t: 17.1, label: "03 / Conversion lab: 'A click needs somewhere to go.'; hold to 18.3" },
  { t: 19.2, label: "The Whole Truth + Fix My Curls concept cards; hold to 20.4" },
  { t: 21.7, label: "The Pant Project + DrinkPrime (DrinkPrime fade done); hold to 22.8" },
  { t: 24.2, label: "04 / Campaigns & signals: 'Then I put it in front of people.'; hold to 25.4" },
  { t: 26.2, label: "tabs + Moolank panel framed; hold to 26.7" },
  { t: 26.7, label: "TAP '03 / Reddit' tab at x=263,y=104 CSS px (789,312 in the 3x final) - add a tap ripple; tab flashes grey, panel re-enters" },
  { t: 27.0, label: "Reddit tab turns black (selected), '1,999' counting up" },
  { t: 27.4, label: "'Build it. Then bring people to it.' + 1,999 settled; hold to 28.1" },
  { t: 29.1, label: "the next thought + 1,999 clicks + stats + evidence card; hold to 30.3" },
  { t: 31.7, label: "05 / Follow the friction: 'The interesting part is often after the click.'; hold to 33.0" },
  { t: 34.8, label: "06 / Creative & content: 'A little strategy. A lot of making.'; hold to 36.0" },
  { t: 36.9, label: "collage: Made to move poster + two reels; hold to 38.2" },
  { t: 40.1, label: "07 / Experiment archive: 'Curiosity, with a URL.' (second row fade done); hold to 41.1" },
  { t: 42.3, label: "archive grid: Atlas AI, Lexis, Open Interest, Moolank 365, Homeward, Words for Love; hold to 43.5" },
  { t: 45.3, label: "08 / Contact: 'Have a what if?' + email + footer; hold to end" },
  { t: 47.7, label: "end" },
];

const FPS = process.env.PREVIEW ? 30 : 60;
const HEADER = 68; // 2px progress bar + 66px header

// CSS-style cubic-bezier easing.
function bezier(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const X = (t) => ((ax * t + bx) * t + cx) * t;
  const Y = (t) => ((ay * t + by) * t + cy) * t;
  const dX = (t) => (3 * ax * t + 2 * bx) * t + cx;
  return (x) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 8; i++) {
      const d = dX(t);
      if (Math.abs(d) < 1e-6) break;
      t -= (X(t) - x) / d;
    }
    let lo = 0, hi = 1;
    for (let i = 0; i < 30 && Math.abs(X(t) - x) > 1e-6; i++) {
      if (X(t) < x) lo = t; else hi = t;
      t = (lo + hi) / 2;
    }
    return Y(t);
  };
}
// Thumb scroll: the drag picks up quickly but softly, then a long momentum settle.
const thumb = bezier(0.45, 0, 0.12, 1);
// Swipe on the build carousel: drag, release, snap settle.
const swipe = bezier(0.4, 0, 0.1, 1);

export default {
  options: { width: 390, height: 844, scale: 3, mobile: true },
  async script(s) {
    let t = 0, y = 0;
    const log = (...a) => process.env.DEBUG && console.log(t.toFixed(2).padStart(6), ...a);
    const hold = async (sec, what) => {
      if (what) log("hold", what, "@", Math.round(y));
      await s.hold(sec);
      t += Math.round(sec * FPS) / FPS;
    };
    const scroll = async (sec, to, fn = thumb) => {
      to = Math.round(Math.min(to, await s.maxScroll));
      log("scroll", Math.round(y), "->", to);
      await s.tween(sec, { scrollY: to }, fn);
      t += Math.max(1, Math.round(sec * FPS)) / FPS;
      y = to;
    };
    const slide = async (sec, left) => {
      log("swipe ->", left);
      await s.tween(sec, { el: { selector: ".work-viewport", scrollLeft: left } }, swipe);
      t += Math.max(1, Math.round(sec * FPS)) / FPS;
    };
    // Document Y of the first match (reveal transforms are measured as rendered).
    const top = (sel, i = 0) =>
      s.page.evaluate(
        ([sel, i]) => document.querySelectorAll(sel)[i].getBoundingClientRect().top + scrollY,
        [sel, i],
      );
    // Frame a section: its tag line sits 30px under the header.
    const tagStop = async (section) => (await top(`${section} .section-tag`)) - HEADER - 30;

    // DEBUG: virtual time at which each .reveal fires (to keep holds clear of fades).
    if (process.env.DEBUG)
      await s.page.evaluate(() => {
        window.__revealLog = [];
        new MutationObserver((m) => {
          for (const r of m) {
            const el = r.target;
            if (el.classList.contains("visible") && !el.__logged) {
              el.__logged = true;
              window.__revealLog.push([(window.__vclock.now() / 1000).toFixed(2), el.className, el.textContent.trim().slice(0, 24)]);
            }
          }
        }).observe(document.body, { subtree: true, attributes: true, attributeFilter: ["class"] });
      });

    // Build carousel: Biltib on the 22px page margin (the site's snap leaves it flush at 0).
    const lefts = await s.page.evaluate(() => {
      const vp = document.querySelector(".work-viewport");
      vp.scrollLeft = 0;
      const pad = parseFloat(getComputedStyle(vp).paddingLeft);
      const base = vp.getBoundingClientRect().left + pad; // project left edge on the margin
      const max = vp.scrollWidth - vp.clientWidth;
      return [...document.querySelectorAll(".project")].map((p) =>
        Math.min(max, Math.round(p.getBoundingClientRect().left - base)),
      );
    });
    log("project scrollLefts", lefts);

    // --- Hero: the headline builds in on load.
    await s.jump(0);
    await hold(2.4, "hero build");

    // Intro copy + orbit: 'real.' just tucked under the header, orbit fully in frame.
    const heroBottom = await top(".hero-bottom");
    await scroll(1.1, heroBottom - HEADER - 22, ease.inOut);
    await hold(1.2, "orbit");

    // --- Manifesto: slow, so the words light up one by one as the statement rises.
    await scroll(2.4, await tagStop(".manifesto"), ease.inOut);
    await hold(1.4, "manifesto lit");

    // --- Work: 'From zero. To out there.' just under the header with the whole card below.
    await scroll(1.4, (await top(".work-heading h2")) - HEADER - 10);
    await hold(1.4, "Biltib");
    await slide(0.9, lefts[1]);
    await hold(1.3, "iCreateEpic");
    await slide(0.9, lefts[2]);
    await hold(1.3, "Moolank 365");

    // --- Conversion lab: headline, then the four concept cards two at a time.
    await scroll(1.4, await tagStop(".conversion"));
    await hold(1.2, "conversion headline");
    // Rows are measured after their reveal (no translateY left).
    const rowTop = async (i) => {
      const r = await top(".conversion .tool-row", i);
      const shift = await s.page.evaluate(
        (i) => new DOMMatrix(getComputedStyle(document.querySelectorAll(".conversion .tool-row")[i]).transform).m42,
        i,
      );
      return r - shift;
    };
    await scroll(0.9, (await rowTop(0)) - HEADER - 4, ease.inOut);
    await hold(1.2, "rows 1-2");
    await scroll(1.2, (await rowTop(2)) - HEADER - 4);
    await hold(1.2, "rows 3-4");

    // --- Campaigns & signals: headline, then tap the Reddit tab and watch the metric count up.
    await scroll(1.4, await tagStop(".signals"));
    await hold(1.2, "signals headline");
    await scroll(0.8, (await top(".campaign-tabs")) - HEADER - 12, ease.inOut);
    await hold(0.5, "tabs framed");
    const [tx, ty] = await s.center('[data-campaign="reddit"]');
    log(`tap reddit tab at ${Math.round(tx)},${Math.round(ty)}`);
    await s.page.touchscreen.tap(tx, ty);
    // A tap leaves the tab in :hover (grey, which beats the black selected style). Let the
    // grey read as press feedback, then park the hover on the header (no hover styles there,
    // and it is fixed, so nothing scrolling past can pick up a hover state).
    await hold(0.3, "reddit pressed");
    await s.page.mouse.move(110, 60);
    await hold(1.1, "reddit panel + count-up");
    // 'The next thought' box just under the header, down to the evidence card.
    const learn = await top("#campaign-panel .campaign-learning");
    const proof = await s.page.evaluate(() => {
      const r = document.querySelector("#campaign-panel .campaign-proof").getBoundingClientRect();
      return r.bottom + scrollY;
    });
    await scroll(1.0, Math.max(learn - HEADER - 32, proof - 844 + 24), ease.inOut);
    await hold(1.2, "metric + evidence");

    // --- Follow the friction.
    await scroll(1.4, await tagStop(".thinking"));
    await hold(1.3, "thinking headline");

    // --- Creative: headline, then the collage.
    await scroll(1.8, await tagStop(".creative"), ease.inOutQuint);
    await hold(1.2, "creative headline");
    await scroll(0.9, (await top(".creative-collage")) - HEADER - 12, ease.inOut);
    await hold(1.3, "collage");

    // --- Archive: headline, then the first three rows of experiments.
    await scroll(1.7, await tagStop(".archive"), ease.inOutQuint);
    await hold(1.2, "archive headline");
    const art = await s.page.evaluate(() => {
      const el = document.querySelector(".archive .artifact");
      return el.getBoundingClientRect().top + scrollY - new DOMMatrix(getComputedStyle(el).transform).m42;
    });
    await scroll(0.9, art - HEADER - 4, ease.inOut);
    await hold(1.5, "archive grid"); // third row finishes its fade ~0.3s in

    // --- Contact: bottom of the page.
    await scroll(1.8, await s.maxScroll, ease.inOutQuint);
    await hold(2.4, "contact");

    if (process.env.DEBUG) {
      log("end");
      const r = await s.page.evaluate(() => window.__revealLog);
      for (const l of r) console.log("reveal", ...l);
    }
  },
};
