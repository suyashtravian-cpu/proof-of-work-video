// Full-page and per-section stills of the site (standalone; not run through run.mjs).
//
//   node capture/stills.mjs                 # desktop + mobile
//   node capture/stills.mjs desktop         # or just one
//
// Outputs (out/captures/stills/):
//   desktop-full.png      1440 CSS px wide @2x, stitched from viewport tiles
//   mobile-full.png       390 CSS px wide @3x, stitched from viewport tiles
//   desktop-<section>.png one 1440x900 @2x frame per section, header in place
//
// The page clock is frozen (same idea as engine.mjs) so the orbit, marquees and any
// infinite CSS animation hold still between tiles and nothing tears at a seam.
// Before shooting, the page is scrolled top to bottom so every .reveal has fired, then
// the clock runs on until every transition has finished.
//
// Full-page specifics:
// - Chrome cannot rasterise one capture taller than ~16384 device px, so the page is
//   shot in viewport-height tiles and stitched with Pillow (ffmpeg vstack fallback).
// - The fixed header and progress bar appear in the first tile only.
// - Sticky elements are made static so they sit in their natural place once.
// - Desktop: the pinned work section is collapsed to its sticky frame at progress 0, so the
//   still shows Biltib (with iCreateEpic peeking); the horizontal journey can't exist in a still.
// - Desktop: the creative collage's scroll parallax is locked at its mid-scroll pose.
import { chromium } from "playwright-core";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { tmpdir } from "node:os";

const CHROMIUM = process.env.CHROMIUM ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const SITE = process.env.SITE ?? "https://pilotaccess.com/proofofwork/";
const OUT = "out/captures/stills";

const VIRTUAL_CLOCK = () => {
  let now = 0;
  let nextId = 0;
  const realRAF = window.requestAnimationFrame.bind(window);
  const queue = new Map();
  window.requestAnimationFrame = (cb) => {
    queue.set(++nextId, cb);
    return nextId;
  };
  window.cancelAnimationFrame = (id) => queue.delete(id);
  performance.now = () => now;
  const sync = () => {
    for (const a of document.getAnimations()) {
      if (a.__vt === undefined) a.__vt = now;
      a.pause();
      a.currentTime = now - a.__vt;
    }
  };
  window.__vclock = {
    advance(ms) {
      now += ms;
      const due = [...queue.values()];
      queue.clear();
      for (const cb of due) {
        try {
          cb(now);
        } catch (e) {
          console.error(e);
        }
      }
      sync();
    },
    settle: () => new Promise((r) => realRAF(() => setTimeout(() => (sync(), r()), 0))),
  };
};

const DEVICES = {
  desktop: { width: 1440, height: 900, scale: 2, mobile: false },
  mobile: { width: 390, height: 844, scale: 3, mobile: true },
};

// Per-section viewport stills (desktop). `tag` frames the section tag ~40px under the header.
const SECTIONS = [
  ["hero", ".hero"],
  ["manifesto", ".manifesto"],
  ["work", ".work-section"],
  ["conversion", ".conversion"],
  ["signals", ".signals"],
  ["thinking", ".thinking"],
  ["creative", ".creative"],
  ["archive", ".archive"],
  ["contact", ".contact"],
];

const STILL_CSS = `
  html{scroll-behavior:auto!important}*{scroll-snap-type:none!important}
  .cursor{display:none!important}
  /* every manifesto word lit, whatever the scroll position */
  .word-reveal span{opacity:1!important;transition:none!important}
  html.still-nohead .site-header, html.still-nohead .scroll-progress{visibility:hidden!important}
`;

async function shoot(name) {
  const d = DEVICES[name];
  const browser = await chromium.launch({
    executablePath: CHROMIUM,
    args: ["--hide-scrollbars", "--font-render-hinting=none"],
  });
  const context = await browser.newContext({
    viewport: { width: d.width, height: d.height },
    deviceScaleFactor: d.scale,
    isMobile: d.mobile,
    hasTouch: d.mobile,
    reducedMotion: "no-preference",
    userAgent: d.mobile
      ? "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1"
      : undefined,
  });
  await context.addInitScript(VIRTUAL_CLOCK);
  const page = await context.newPage();
  page.on("pageerror", (e) => console.error("[page]", e.message));
  await page.goto(SITE, { waitUntil: "networkidle" });
  await page.addStyleTag({ content: STILL_CSS });
  const cdp = await context.newCDPSession(page);

  const loadAll = () =>
    page.evaluate(async () => {
      for (const img of document.images) img.loading = "eager";
      await Promise.all(
        [...document.images].map((i) =>
          i.complete ? null : new Promise((r) => ((i.onload = i.onerror = r))),
        ),
      );
      await Promise.all([...document.images].map((i) => i.decode().catch(() => {})));
      await document.fonts.ready;
    });
  // Run the page clock forward by `sec` in 30fps steps, with a real render step each.
  const run = (sec) =>
    page.evaluate(async (n) => {
      for (let i = 0; i < n; i++) {
        window.__vclock.advance(1000 / 30);
        await window.__vclock.settle();
      }
    }, Math.max(1, Math.round(sec * 30)));
  // Move without letting time pass: scroll handlers run, animations stay frozen.
  const scrollTo = (y) =>
    page.evaluate(async (y) => {
      window.scrollTo(0, y);
      await window.__vclock.settle();
      window.__vclock.advance(0);
      await window.__vclock.settle();
      // Time is frozen, so jump any scroll-triggered transition (the work meter) to its end.
      for (const a of document.getAnimations()) if (a instanceof CSSTransition) a.finish();
      await window.__vclock.settle();
      return window.scrollY;
    }, y);
  const grab = async (file, y) => {
    const { data } = await cdp.send("Page.captureScreenshot", {
      format: "png",
      clip: { x: 0, y, width: d.width, height: d.height, scale: d.scale },
    });
    writeFileSync(file, Buffer.from(data, "base64"));
  };

  await loadAll();
  await run(2.5); // hero headline build + campaign count-up

  // Scroll the whole page so every .reveal fires, then let the transitions finish.
  const docH = () => page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < (await docH()); y += d.height * 0.45) {
    await page.evaluate((y) => window.scrollTo(0, y), y);
    await run(0.1);
  }
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await run(2.0);
  await loadAll();
  const unrevealed = await page.evaluate(
    () => document.querySelectorAll(".reveal:not(.visible)").length,
  );
  if (unrevealed) console.warn(`${name}: ${unrevealed} .reveal elements never became visible`);

  mkdirSync(OUT, { recursive: true });

  // Per-section stills, natural layout (header, sticky, pinned and parallax as a visitor sees them).
  // The site's scroll-snap leaves the work scroller at 72px (Biltib flush to the screen edge);
  // 0 is the state setupWork() intends, with Biltib on the page margin.
  await page.evaluate(() => (document.querySelector(".work-viewport").scrollLeft = 0));
  if (name === "desktop") {
    for (const [key, sel] of SECTIONS) {
      const y = await page.evaluate(
        ([sel, header]) => {
          const el = document.querySelector(sel);
          const top = el.getBoundingClientRect().top + scrollY;
          if (sel === ".hero") return 0;
          // Pinned work section: its sticky frame sits right under the header at progress 0.
          if (el.classList.contains("pinned")) return top - header;
          const tag = el.querySelector(".section-tag");
          const tagTop = tag ? tag.getBoundingClientRect().top + scrollY : top + 60;
          const max = document.documentElement.scrollHeight - innerHeight;
          return Math.round(Math.min(max, tagTop - header - 44));
        },
        [sel, 77],
      );
      const at = await scrollTo(y);
      await grab(join(OUT, `desktop-${key}.png`), at);
      console.log(`desktop-${key}.png  scrollY=${Math.round(at)}`);
    }
  }

  // ---- Full page: freeze scroll-driven layout so tiles agree with each other. ----
  const notes = await page.evaluate(async () => {
    const notes = [];
    // The site rewrites these inline transforms on every scroll (el.style.transform = ...),
    // which would also wipe an inline !important, so the locks go in a stylesheet.
    const lock = document.createElement("style");
    document.head.append(lock);
    // Creative parallax (desktop only): lock the pose it has with the collage mid-viewport.
    const collage = document.querySelector(".creative-collage");
    if (collage && innerWidth > 720) {
      const r = collage.getBoundingClientRect();
      window.scrollTo(0, r.top + scrollY + r.height / 2 - innerHeight / 2);
      await window.__vclock.settle();
      window.__vclock.advance(0);
      await window.__vclock.settle();
      for (const s of [".poster-one", ".reel-one", ".reel-two"]) {
        const t = document.querySelector(s)?.style.transform;
        if (t) lock.textContent += `${s}{transform:${t}!important}`;
      }
      notes.push("creative parallax locked at mid-scroll pose");
    }
    // Pinned work section: collapse to its sticky frame at progress 0 (Biltib on the margin).
    const work = document.querySelector(".work-section");
    if (work.classList.contains("pinned")) {
      work.style.height = "auto";
      document.querySelector(".work-viewport").scrollLeft = 0;
      lock.textContent += ".work-track{transform:none!important}.work-meter>span{transform:translateX(0%)!important}";
      notes.push("pinned work section collapsed to progress 0 (Biltib)");
    } else {
      // Phone/tablet scroller: Biltib on the page margin (as in the mobile clip), not flush to the edge.
      document.querySelector(".work-viewport").scrollLeft = 0;
    }
    // Sticky elements once, in flow.
    for (const el of document.querySelectorAll("body *")) {
      if (getComputedStyle(el).position === "sticky") el.style.setProperty("position", "static", "important");
    }
    return notes;
  });
  if (notes.length) console.log(`${name}: ${notes.join("; ")}`);
  // updateScroll() rewrites the work counter on every scroll; keep it at the state shown.
  const fixCounter = () =>
    page.evaluate(() => {
      const f = document.querySelector(".work-fraction");
      if (f && document.querySelector(".work-section.pinned")) f.textContent = "01 / 03";
    });

  const fullH = await docH();
  const tileDir = join(tmpdir(), `stills-${name}-${process.pid}`);
  mkdirSync(tileDir, { recursive: true });
  const tiles = [];
  const maxY = fullH - d.height;
  for (let i = 0, y = 0; ; i++, y += d.height) {
    const target = Math.min(y, maxY);
    await page.evaluate((on) => document.documentElement.classList.toggle("still-nohead", on), i > 0);
    const at = await scrollTo(target);
    await fixCounter();
    const file = join(tileDir, `tile-${String(i).padStart(3, "0")}.png`);
    await grab(file, at);
    tiles.push({ file, y: Math.round(at) });
    if (target >= maxY) break;
  }
  await browser.close();

  const out = join(OUT, `${name}-full.png`);
  stitch(tiles, d, fullH, out);
  rmSync(tileDir, { recursive: true, force: true });
  console.log(`${out}  ${d.width * d.scale}x${fullH * d.scale}px from ${tiles.length} tiles`);
}

function stitch(tiles, d, fullH, out) {
  const spec = JSON.stringify({
    tiles: tiles.map((t) => [t.file, t.y]),
    w: d.width * d.scale,
    h: fullH * d.scale,
    s: d.scale,
    out,
  });
  const py = `
import json, sys
from PIL import Image
Image.MAX_IMAGE_PIXELS = None
j = json.loads(sys.argv[1])
s = j["s"]
canvas = Image.new("RGB", (j["w"], j["h"]))
filled = 0  # device rows already written
for f, y in j["tiles"]:
    im = Image.open(f).convert("RGB")
    top = y * s
    skip = max(0, filled - top)  # overlap with what is already on the canvas (last tile)
    if skip >= im.height:
        continue
    canvas.paste(im.crop((0, skip, im.width, im.height)), (0, top + skip))
    filled = top + im.height
canvas.save(j["out"], optimize=False, compress_level=6)
`;
  try {
    execFileSync("python3", ["-I", "-c", py, spec], { stdio: "inherit" });
  } catch (e) {
    // Fallback: crop the overlapping part of the last tile, then ffmpeg vstack.
    console.warn("Pillow stitch failed, using ffmpeg vstack", e.message);
    const args = ["-loglevel", "error", "-y"];
    tiles.forEach((t) => args.push("-i", t.file));
    const last = tiles.length - 1;
    const overlap = (tiles[last - 1].y + d.height - tiles[last].y) * d.scale;
    const f = tiles.map((_, i) => (i === last ? `[${i}:v]crop=iw:ih-${overlap}:0:${overlap}[l]` : null)).filter(Boolean);
    const ins = tiles.map((_, i) => (i === last ? "[l]" : `[${i}:v]`)).join("");
    f.push(`${ins}vstack=inputs=${tiles.length}`);
    execFileSync("ffmpeg", [...args, "-filter_complex", f.join(";"), out], { stdio: "inherit" });
  }
}

const which = process.argv.slice(2);
for (const name of which.length ? which : ["desktop", "mobile"]) await shoot(name);
