// 06 / Creative & content: a slow scroll through the section so the collage's
// scroll parallax plays (each card drifts and rotates at its own rate), then the
// cursor rises in and hovers the two reel cards (they lift and straighten,
// cursor becomes the white OPEN disc over the play button).
import { ease } from "../engine.mjs";

export const markers = [
  { t: 0.0, label: "framed: 'A little strategy. A lot of making.' + collage peeking (clean, no cursor)" },
  { t: 1.0, label: "slow scroll through the collage starts (parallax: cards drift/rotate at different rates)" },
  { t: 5.0, label: "scroll settles: headline + all three cards framed, no cursor; clean hold to ~6.1" },
  { t: 6.7, label: "hover reel 02 Kraftshala: card lifts/straightens, OPEN cursor on play button; hold to 8.0" },
  { t: 8.8, label: "hover reel 03 Unleavables: lifts, OPEN cursor; final hold to end (10.4)" },
];

const START_Y = 8540; // creative tag ~255px down, thinking section's tail hidden by the header
const END_Y = 8775; // both headline lines clear of the header, all three cards in frame

const preroll = (s, sec) =>
  s.page.evaluate(async (n) => {
    for (let i = 0; i < n; i++) {
      window.__vclock.advance(1000 / 30);
      await window.__vclock.settle();
    }
  }, Math.round(sec * 30));

// Centre of a card's play button as it will sit once hovered
// (:hover = translateY(-10px) rotate(0)), measured without starting a transition.
const hoveredPlay = (s, card) =>
  s.page.evaluate((card) => {
    const el = document.querySelector(card);
    const orig = el.style.transform;
    el.style.transition = "none";
    el.style.transform = "translateY(-10px) rotate(0deg)";
    const r = el.querySelector(".play-disc").getBoundingClientRect();
    el.style.transform = orig;
    el.getBoundingClientRect();
    el.style.transition = "";
    return [r.left + r.width / 2, r.top + r.height / 2];
  }, card);

export default {
  options: { width: 1440, height: 900, scale: 2 },
  async script(s) {
    let cur = [740, 960]; // off-screen below
    const glide = async (sec, to, bend = 0.1) => {
      const [x0, y0] = cur, [x1, y1] = to;
      const mid = [(x0 + x1) / 2 - (y1 - y0) * bend, (y0 + y1) / 2 + (x1 - x0) * bend];
      await s.path(sec, [mid, to], { fn: ease.inOut });
      cur = to;
    };

    await s.jump(START_Y);
    await preroll(s, 1.5); // parallax transforms settled for this scroll position
    await s.mouseAt(...cur);

    await s.hold(1.0);
    // Slow, even scroll; no cursor yet so no card is hovered while the parallax plays.
    await s.tween(4.0, { scrollY: END_Y }, ease.inOut);
    // Settled frame held clean (cards finish their 0.6s transform transition here);
    // the cursor only shows ~0.3s into the next glide, so ~1.1s static before it appears.
    await s.hold(0.8);

    const reelOne = await hoveredPlay(s, ".reel-one");
    await glide(0.9, reelOne, 0.12);
    await s.hold(1.3);
    const reelTwo = await hoveredPlay(s, ".reel-two");
    await glide(0.8, reelTwo, 0.08);
    await s.hold(1.6);
  },
};
