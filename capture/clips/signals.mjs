// 04 / Campaigns & signals: framed section, then click through all six campaign
// tabs. Each click re-renders the panel (panel-enter) and counts the big metric up
// over 700ms; the cursor steps just below the tab row after each click so the
// selected tab turns black and nothing it must read is covered.
import { ease } from "../engine.mjs";

export const markers = [
  { t: 0.0, label: "framed: 'Then I put it in front of people.' + all six tabs + Moolank panel (clean, no cursor)" },
  { t: 1.6, label: "click 01 / Moolank (panel re-enters)" },
  { t: 2.4, label: "Moolank 112 counted up; hold to 3.5" },
  { t: 4.3, label: "click 02 / Search" },
  { t: 5.1, label: "Search 25 counted up; hold to 6.2" },
  { t: 7.0, label: "click 03 / Reddit" },
  { t: 7.8, label: "Reddit 1,999 counted up; hold to 8.9" },
  { t: 9.7, label: "click 04 / Meta team" },
  { t: 10.5, label: "Meta team 12 counted up; hold to 11.6" },
  { t: 12.4, label: "click 05 / Search team" },
  { t: 13.2, label: "Search team 8 counted up; hold to 14.3" },
  { t: 15.1, label: "click 06 / Amazon" },
  { t: 15.9, label: "Amazon 1 purchase counted up; final hold to end (17.6)" },
];

const SCROLL_Y = 6050; // section tag ~26px under the 77px header, tabs at ~425-476

// Advance the page clock without recording, so finished-on-load animations
// (the default Moolank panel-enter + its count-up) are settled before frame 1.
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
    let cur = [600, 960]; // off-screen below: cursor ring hidden until it moves in
    const glide = async (sec, to, bend = 0.12, fn = ease.inOut) => {
      const [x0, y0] = cur, [x1, y1] = to;
      const mid = [(x0 + x1) / 2 - (y1 - y0) * bend, (y0 + y1) / 2 + Math.abs(x1 - x0) * bend];
      await s.path(sec, [mid, to], { fn });
      cur = to;
    };
    const drift = async (sec, to) => {
      await s.tween(sec, { mouse: to }, ease.out);
      cur = to;
    };

    await s.jump(SCROLL_Y);
    await preroll(s, 1.5);
    await s.mouseAt(...cur);

    const tabs = [];
    for (let i = 0; i < 6; i++) tabs.push(await s.center("[data-campaign]", i));
    const tabBottom = await s.page.evaluate(
      () => document.querySelector("[data-campaign]").getBoundingClientRect().bottom,
    );
    const restY = tabBottom + 26; // in the panel's top padding, off the tab row

    await s.hold(0.6); // clean open on the framed section

    for (let i = 0; i < 6; i++) {
      const [cx, cy] = tabs[i];
      // Entrance from below is longer; later glides arc along under the tab row.
      if (i === 0) await glide(1.0, [cx, cy], 0.18);
      else await glide(0.8, [cx, cy], 0.12);
      // Visible press (same as s.click, but 0.1s so 30fps previews and 60fps finals
      // land on identical timings). Panel re-renders on mouseup; count-up runs 700ms.
      await s.page.mouse.down();
      await s.hold(0.1);
      await s.page.mouse.up();
      await drift(0.4, [cx + 20, restY]);
      await s.hold(i === 5 ? 2.0 : 1.4);
    }
  },
};
