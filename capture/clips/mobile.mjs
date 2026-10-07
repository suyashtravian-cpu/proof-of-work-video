// Mobile: an iPhone-sized pass through the whole page, hero to contact. No cursor on touch:
// thumb-like scrolls (gentle start, long momentum settle), a horizontal swipe through the
// three builds, and one tap on a campaign tab so the big metric counts up on camera.
// Every stop frames its section headline under the 66px mobile header and is held for
// the editor's cut. All stop positions are measured from the live layout at run time.
// No hold starts on a half-faded .reveal row: scrolls that trigger one are lengthened so its
// fade ends on landing, and stops where a row would only just peek in are kept clear of it
// (see scroll() and clear()). The final stop frames the end marquee whole under the header.
import { ease } from "../engine.mjs";

export const markers = [
  { t: 0.0, label: "page load: hero headline starts building in (hidden on frame 0); orbit cards drifting" },
  { t: 1.4, label: "\"I make ideas real.\" fully built; clean hold to 2.4" },
  { t: 2.4, label: "thumb scroll down to the orbit (1.1s)" },
  { t: 3.5, label: "intro copy + orbit with the three live-site cards; hold to 4.7" },
  { t: 4.7, label: "slow scroll into 01 / The way I work: manifesto words light up as it rises (2.4s)" },
  { t: 7.1, label: "manifesto framed, every word lit; hold to 8.5" },
  { t: 8.5, label: "scroll to 02 / Selected builds (1.4s)" },
  { t: 9.9, label: "'From zero. To out there.' + full Biltib card (iCreateEpic peeking); hold to 11.3" },
  { t: 11.3, label: "swipe to iCreateEpic (0.9s)" },
  { t: 12.2, label: "iCreateEpic card framed; hold to 13.5" },
  { t: 13.5, label: "swipe to Moolank 365 (0.9s)" },
  { t: 14.4, label: "Moolank 365 card framed; hold to 15.7" },
  { t: 15.7, label: "scroll to 03 / The conversion lab (1.4s)" },
  { t: 17.1, label: "'A click needs somewhere to go.' + The Whole Truth card; hold to 18.3" },
  { t: 18.3, label: "scroll on (1.17s); Fix My Curls fades in on the way" },
  { t: 19.47, label: "The Whole Truth + Fix My Curls concept cards; hold to 20.67" },
  { t: 20.67, label: "scroll on (1.37s); The Pant Project + DrinkPrime fade in on the way" },
  { t: 22.03, label: "The Pant Project + DrinkPrime; hold to 23.23" },
  { t: 23.23, label: "scroll to 04 / Campaigns & signals (1.4s)" },
  { t: 24.63, label: "'Then I put it in front of people.' + tabs + Moolank panel; hold to 25.83" },
  { t: 25.83, label: "scroll the tabs up under the header (0.8s)" },
  { t: 26.63, label: "tabs + Moolank panel framed; beat before the tap, to 27.23" },
  { t: 27.23, label: "TAP '03 / Reddit' at x=263,y=104 CSS px (789,312 in the 3x final): add a tap ripple. The panel swaps (one blank frame: the site's own panel-enter starts at opacity 0) and fades in over 0.45s while '1,999' counts up for 0.7s" },
  { t: 27.53, label: "tap hover released: the Reddit tab turns from press-grey to selected black (0.25s)" },
  { t: 27.93, label: "'Build it. Then bring people to it.' + 1,999 settled; hold to 29.03" },
  { t: 29.03, label: "scroll (1.0s)" },
  { t: 30.03, label: "the next thought + 1,999 clicks + stats + evidence card; hold to 31.23" },
  { t: 31.23, label: "flick to 05 / Follow the friction (1.93s: quick pick-up, long momentum glide; motion is negligible after ~32.8)" },
  { t: 33.17, label: "'The interesting part is often after the click.' + first case, 'A blocked route' below; hold to 34.47 (journey pulse animates)" },
  { t: 34.47, label: "scroll to 06 / Creative & content (1.8s)" },
  { t: 36.27, label: "'A little strategy. A lot of making.'; hold to 37.47" },
  { t: 37.47, label: "scroll to the collage (0.9s)" },
  { t: 38.37, label: "collage: Made to move poster + two reels; hold to 39.67" },
  { t: 39.67, label: "scroll to 07 / Experiment archive (2.3s); the first two rows fade in on the way" },
  { t: 41.97, label: "'Curiosity, with a URL.' + Atlas AI, Lexis, Open Interest, Moolank 365; hold to 43.17" },
  { t: 43.17, label: "scroll into the grid (1.23s); Homeward + Words for Love fade in on the way" },
  { t: 44.4, label: "archive grid: Atlas AI, Lexis, Open Interest, Moolank 365, Homeward, Words for Love; hold to 45.7" },
  { t: 45.7, label: "scroll to 08 / Contact (1.8s)" },
  { t: 47.5, label: "'STILL CURIOUS * STILL BUILDING' ticker whole under the header + 'Have a what if?' + email + Copy email; hold to end" },
  { t: 49.9, label: "end" },
];

const FPS = process.env.PREVIEW ? 30 : 60;
const HEADER = 68; // 2px progress bar + 66px header
const VIEW_H = 844;

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
// Flick: velocity ~ x(1-x)^5, i.e. a soft linear pick-up, peak at 1/6, then a long
// momentum glide. Used where a row fires close to the landing point: the glide gives its
// fade time to finish before the camera comes to rest.
const flick = (x) => 1 - Math.pow(1 - x, 6) * (1 + 6 * x);

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
    // .reveal rows fire at 8% visible (IntersectionObserver) and fade for 0.8s. A scroll that
    // triggers one is lengthened (up to +0.5s) so the fade is over when the camera lands:
    // no hold ever starts on a half-faded row. Durations are rounded to 1/30s so the preview
    // and the 60fps final share one timeline.
    const FADE = 0.8 + 2 / 30; // transition + the frame it takes to be observed
    const invert = (fn, d) => {
      let lo = 0, hi = 1;
      for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if (fn(m) < d) lo = m; else hi = m; }
      return hi;
    };
    // Unrevealed rows, as the observer sees them (translateY(35px) included).
    // In mobile emulation the observer's root is NOT the 844px frame: while the page is being
    // scrolled it grows to as much as 855px (it reads 844-855 at different stops, and only
    // 844 when the page is jumped), so a row can fire while still just below the visible
    // frame. Fixed bounds keep the timeline identical between the preview and the final:
    // durations assume the latest possible firing (the 844px frame), and stops kept clear of
    // a row assume the tallest root (860px, with margin).
    const CLEAR_ROOT = 860;
    const pending = () =>
      s.page.evaluate(() =>
        [...document.querySelectorAll(".reveal:not(.visible)")].map((el) => {
          const r = el.getBoundingClientRect();
          return [r.top + scrollY, r.height, el.textContent.trim().slice(0, 18)];
        }),
      );
    const scroll = async (sec, to, fn = thumb) => {
      to = Math.round(Math.min(to, await s.maxScroll));
      let need = sec;
      if (to > y) {
        for (const [T, h, what] of await pending()) {
          const fire = T - VIEW_H + 0.08 * h; // scrollY at which it crosses 8%
          if (fire <= y || fire > to) continue;
          const req = FADE / (1 - invert(fn, (fire - y) / (to - y)));
          if (req > need) { need = req; log(`  '${what}' fires mid-scroll: ${req.toFixed(2)}s needed`); }
        }
      }
      if (need > sec + 0.5) log(`  WARNING: capped at ${(sec + 0.5).toFixed(2)}s`);
      sec = Math.ceil(Math.min(need, sec + 0.5) * 30 - 1e-6) / 30;
      log("scroll", Math.round(y), "->", to, `(${sec.toFixed(2)}s)`);
      await s.tween(sec, { scrollY: to }, fn);
      t += Math.max(1, Math.round(sec * FPS)) / FPS;
      y = to;
    };
    // Keep a stop clear of a row that would only just peek in at the bottom edge: such a
    // row would fire as the scroll lands and fade in during the hold. Pull the stop up
    // until it stays under its 8% threshold (unrevealed rows are invisible, so the frame
    // simply ends in clean background).
    const clear = async (stop) => {
      for (const [T, h, what] of await pending()) {
        const vis = CLEAR_ROOT - (T - stop), at = 0.08 * h;
        if (vis > at - 4 && vis < at + 70) {
          log(`  stop pulled up ${Math.round(vis - at + 4)}px to keep '${what}' unfired`);
          stop = T - CLEAR_ROOT + at - 4;
        }
      }
      return Math.floor(stop);
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

    // --- Work: 'From zero. To out there.' under the header with the whole card below
    // (the longest card, Moolank 365, still ends ~16px above the bottom edge).
    await scroll(1.4, (await top(".work-heading h2")) - HEADER - 18);
    await hold(1.4, "Biltib");
    await slide(0.9, lefts[1]);
    await hold(1.3, "iCreateEpic");
    await slide(0.9, lefts[2]);
    await hold(1.3, "Moolank 365");

    // --- Conversion lab: headline, then the four concept cards two at a time.
    await scroll(1.4, await clear(await tagStop(".conversion")));
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
    await scroll(0.9, await clear((await rowTop(0)) - HEADER - 4), ease.inOut);
    await hold(1.2, "rows 1-2");
    await scroll(1.2, await clear((await rowTop(2)) - HEADER - 4));
    await hold(1.2, "rows 3-4");

    // --- Campaigns & signals: headline, then tap the Reddit tab and watch the metric count up.
    await scroll(1.4, await tagStop(".signals"));
    await hold(1.2, "signals headline");
    await scroll(0.8, (await top(".campaign-tabs")) - HEADER - 12, ease.inOut);
    await hold(0.6, "tabs framed");
    const [tx, ty] = await s.center('[data-campaign="reddit"]');
    log(`tap reddit tab at ${Math.round(tx)},${Math.round(ty)}`);
    await s.page.touchscreen.tap(tx, ty);
    // A tap leaves the tab in :hover (grey, which beats the black selected style). Let the
    // grey read as press feedback, then park the hover on the header (no hover styles there,
    // and it is fixed, so nothing scrolling past can pick up a hover state).
    await hold(0.3, "reddit pressed");
    await s.page.mouse.move(110, 60);
    // The panel fades in over 0.45s and the metric counts for 0.7s from the tap, so this
    // leaves a settled ~1.1s on the finished Reddit panel.
    await hold(1.5, "reddit panel + count-up");
    // 'The next thought' box just under the header, down to the evidence card.
    const learn = await top("#campaign-panel .campaign-learning");
    const proof = await s.page.evaluate(() => {
      const r = document.querySelector("#campaign-panel .campaign-proof").getBoundingClientRect();
      return r.bottom + scrollY;
    });
    await scroll(1.0, Math.max(learn - HEADER - 32, proof - 844 + 24), ease.inOut);
    await hold(1.2, "metric + evidence");

    // --- Follow the friction.
    // The signals section's light background ends ~33px above the tag line, so this stop
    // cannot be pulled up to keep the next case unfired (a light strip would show under the
    // header). Instead the flick glide lets 'A blocked route' fire on the approach and
    // finish its fade before the camera rests.
    await scroll(1.6, await tagStop(".thinking"), flick);
    await hold(1.3, "thinking headline");

    // --- Creative: headline, then the collage.
    await scroll(1.8, await tagStop(".creative"), ease.inOutQuint);
    await hold(1.2, "creative headline");
    await scroll(0.9, (await top(".creative-collage")) - HEADER - 12, ease.inOut);
    await hold(1.3, "collage");

    // --- Archive: headline, then the first three rows of experiments.
    await scroll(1.8, await tagStop(".archive"), ease.inOutQuint);
    await hold(1.2, "archive headline");
    const art = await s.page.evaluate(() => {
      const el = document.querySelector(".archive .artifact");
      return el.getBoundingClientRect().top + scrollY - new DOMMatrix(getComputedStyle(el).transform).m42;
    });
    // Thumb ease: the third row fires early in the move, so its fade is done on landing.
    await scroll(1.0, await clear(art - HEADER - 4));
    await hold(1.3, "archive grid");

    // --- Contact: the end marquee ('STILL BUILDING') sits whole just under the header,
    // rather than sliced by it at the very bottom of the page; the footer's top line is in
    // frame and its small print falls just below the edge (not cut through).
    const endBand = await top(".end-marquee");
    await scroll(1.8, Math.min(endBand - HEADER - 2, await s.maxScroll), ease.inOutQuint);
    await hold(2.4, "contact");

    if (process.env.DEBUG) {
      log("end");
      const r = await s.page.evaluate(() => window.__revealLog);
      for (const l of r) console.log("reveal", ...l);
    }
  },
};
