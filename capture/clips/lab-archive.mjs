// 03 / The conversion lab -> 07 / The experiment archive.
// Framed lab headline, hover each of the four concept rows (one scroll brings rows
// 02-04 fully into frame, then the cursor steps down them), the cursor slips off the
// bottom edge, one long eased scroll down to the archive with no cursor, a clean hold,
// then the cursor rises in and sweeps the first row of artifacts (active OPEN cursor),
// then parks in empty space and holds on "Curiosity, with a URL." + the grid.
import { ease } from "../engine.mjs";

export const markers = [
  { t: 0.0, label: "framed: 'A click needs somewhere to go.' + rows 01-02 (clean, no cursor)" },
  { t: 1.4, label: "hover 01 The Whole Truth (preview straightens, arrow turns); hold to 2.4" },
  { t: 2.4, label: "scroll: rows 02-04 into frame" },
  { t: 3.7, label: "hover 02 Fix My Curls; hold to 4.7" },
  { t: 5.4, label: "hover 03 The Pant Project; hold to 6.4" },
  { t: 7.1, label: "hover 04 DrinkPrime; hold to 8.1" },
  { t: 8.1, label: "cursor slips off the bottom edge (gone by 8.6)" },
  { t: 8.6, label: "long eased scroll to the archive, no cursor (whip through signals/thinking/creative)" },
  { t: 11.2, label: "archive framed clean: 'Curiosity, with a URL.' + Atlas AI / Lexis / Open Interest, no cursor; hold to 12.4" },
  { t: 13.3, label: "hover Atlas AI (cursor rose in from below, white OPEN disc); hold to 14.3" },
  { t: 15.1, label: "hover Lexis (OPEN); hold to 16.1" },
  { t: 16.9, label: "hover Open Interest (OPEN); hold to 17.9" },
  { t: 18.6, label: "cursor parked in empty band; final hold on headline + grid to end (19.9)" },
];

const LAB_Y = 4616; // conversion section tag ~40px under the header
const ARCHIVE_Y = 10080; // archive tag under the header, row-1 titles + CTAs in frame

const preroll = (s, sec) =>
  s.page.evaluate(async (n) => {
    for (let i = 0; i < n; i++) {
      window.__vclock.advance(1000 / 30);
      await window.__vclock.settle();
    }
  }, Math.round(sec * 30));

export default {
  options: { width: 1440, height: 900, scale: 2 },
  async script(s) {
    let cur = [380, 960]; // off-screen below
    const glide = async (sec, to, bend = 0.1, opts = {}) => {
      const [x0, y0] = cur, [x1, y1] = to;
      const mid = [(x0 + x1) / 2 - (y1 - y0) * bend, (y0 + y1) / 2 + (x1 - x0) * bend];
      await s.path(sec, [mid, to], { fn: ease.inOut, ...opts });
      cur = to;
    };
    // Viewport Y of an element's centre once the page sits at scroll position y.
    const vy = async (sel, i, y) =>
      (await s.page.evaluate(
        ([sel, i]) => {
          const el = document.querySelectorAll(sel)[i];
          let top = 0;
          for (let n = el; n; n = n.offsetParent) top += n.offsetTop;
          return top + el.offsetHeight / 2;
        },
        [sel, i],
      )) - y;

    await s.jump(LAB_Y);
    await preroll(s, 1.5); // rows 01-02 finish their reveal before frame 1
    await s.mouseAt(...cur);

    const X = 300; // over the concept previews

    await s.hold(0.5);
    // 01 The Whole Truth
    await glide(0.9, [X, await vy(".tool-row", 0, LAB_Y)], 0.12);
    await s.hold(1.0);
    // 02 Fix My Curls: one scroll to where rows 02-04 sit fully in frame; the
    // page slides under the cursor as it eases up onto row 02.
    // (5128 is the deepest scroll before the light signals section shows at the bottom.)
    const Y2 = 5128;
    await glide(1.3, [X + 6, await vy(".tool-row", 1, Y2)], 0.05, { scrollY: Y2 });
    await s.hold(1.0);
    // 03 The Pant Project
    await glide(0.7, [X, await vy(".tool-row", 2, Y2)], 0.06);
    await s.hold(1.0);
    // 04 DrinkPrime
    await glide(0.7, [X - 4, await vy(".tool-row", 3, Y2)], 0.06);
    await s.hold(1.0);

    // Hand leaves: the cursor slips off the bottom edge (pointerleave -> the site
    // hides its ring), so nothing rides the whip and the archive lands clean.
    await glide(0.5, [X + 30, 960], 0.1, { fn: ease.in });
    // Long move to the archive (whip through signals/thinking/creative).
    await s.tween(2.6, { scrollY: ARCHIVE_Y }, ease.inOutQuint);
    await s.hold(1.2); // clean: headline + first row, no cursor

    // Sweep row 1 of the archive, centre-low on each image (titles stay clear).
    const art = async (i) => {
      const [cx] = await s.center(".artifact-image", i);
      const r = await s.page.evaluate(
        (i) => document.querySelectorAll(".artifact-image")[i].getBoundingClientRect().bottom,
        i,
      );
      return [cx, r - 62];
    };
    // Rises in from below; it is inside the Atlas AI card (OPEN) as soon as it appears.
    await glide(0.9, await art(0), 0.12);
    await s.hold(1.0);
    await glide(0.8, await art(1), 0.06);
    await s.hold(1.0);
    await glide(0.8, await art(2), 0.06);
    await s.hold(1.0);
    // Park in the empty band between the intro copy and the grid rule.
    await glide(0.7, [1005, 452], -0.12);
    await s.hold(1.3);
  },
};
