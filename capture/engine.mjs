// Frame-perfect browser capture.
// The page's animation clock (requestAnimationFrame, performance.now, CSS
// animations/transitions) is virtualised, so every output frame is rendered at
// an exact moment in time regardless of how long the screenshot takes.
// Frames stream straight into ffmpeg.
import { chromium } from "playwright-core";
import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

const CHROMIUM = process.env.CHROMIUM ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";

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
    sync,
    now: () => now,
    // One genuine rendering step, so IntersectionObserver / scroll work is
    // delivered at the same virtual frame on every run. Then pin anything it started.
    settle: () =>
      new Promise((r) => realRAF(() => setTimeout(() => (sync(), r()), 0))),
  };
};

export const ease = {
  linear: (t) => t,
  inOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  out: (t) => 1 - Math.pow(1 - t, 3),
  in: (t) => t * t * t,
  // Long, cinematic settle: fast start, very soft landing.
  expoOut: (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  inOutQuint: (t) => (t < 0.5 ? 16 * t ** 5 : 1 - Math.pow(-2 * t + 2, 5) / 2),
};
const lerp = (a, b, t) => a + (b - a) * t;

export async function record({
  url,
  out,
  width = 1920,
  height = 1080,
  scale = 2,
  fps = 60,
  mobile = false,
  quality = 92,
  crf = 14,
  setup,
}, script) {
  if (process.env.PREVIEW) {
    // Fast choreography check: 1x pixels, 30fps, quick encode. Same timeline.
    scale = Math.min(scale, mobile ? 1 : 1);
    fps = 30;
    process.env.PRESET ??= "veryfast";
    out = out.replace(/\.mp4$/, ".preview.mp4");
  }
  mkdirSync(dirname(out), { recursive: true });
  const browser = await chromium.launch({
    executablePath: CHROMIUM,
    args: ["--hide-scrollbars", "--disable-gpu-vsync", "--font-render-hinting=none"],
  });
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: scale,
    isMobile: mobile,
    hasTouch: mobile,
    reducedMotion: "no-preference",
    userAgent: mobile
      ? "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1"
      : undefined,
  });
  await context.addInitScript(VIRTUAL_CLOCK);
  const page = await context.newPage();
  page.on("pageerror", (e) => console.error("[page]", e.message));
  await page.goto(url, { waitUntil: "networkidle" });
  // Programmatic scroll must be instant; we do our own easing. Snap would fight tweens.
  await page.addStyleTag({
    content: "html{scroll-behavior:auto!important}*{scroll-snap-type:none!important}",
  });
  await page.evaluate(async () => {
    for (const img of document.images) img.loading = "eager";
    await Promise.all(
      [...document.images].map((i) =>
        i.complete ? null : new Promise((r) => ((i.onload = i.onerror = r))),
      ),
    );
    await document.fonts.ready;
    window.scrollTo(0, 0);
  });
  if (setup) await setup(page);

  const cdp = await context.newCDPSession(page);
  const ff = spawn(
    "ffmpeg",
    [
      "-loglevel", "error", "-y",
      "-f", "image2pipe", "-framerate", String(fps), "-c:v", "mjpeg", "-i", "-",
      "-c:v", "libx264", "-preset", process.env.PRESET ?? "slow", "-crf", String(crf),
      "-pix_fmt", "yuv420p", "-movflags", "+faststart", out,
    ],
    { stdio: ["pipe", "inherit", "inherit"] },
  );

  const state = { scrollY: 0, mouse: null, frames: 0 };
  const dt = 1000 / fps;

  const frame = async () => {
    // CDP clips are in document coordinates, so the clip must follow the scroll.
    const [sx, sy] = await page.evaluate(async (ms) => {
      window.__vclock.advance(ms);
      await window.__vclock.settle();
      return [window.scrollX, window.scrollY];
    }, dt);
    const { data } = await cdp.send("Page.captureScreenshot", {
      format: "jpeg",
      quality,
      optimizeForSpeed: true,
      // Without an explicit clip scale CDP returns CSS pixels, not device pixels.
      clip: { x: sx, y: sy, width, height, scale },
    });
    const buf = Buffer.from(data, "base64");
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once("drain", r));
    state.frames++;
  };

  const docY = (selector, offset = 0) =>
    page.evaluate(
      ([s, o]) => {
        const el = document.querySelector(s);
        if (!el) throw new Error("missing " + s);
        return el.getBoundingClientRect().top + window.scrollY + o;
      },
      [selector, offset],
    );
  // Centre of an element in viewport coordinates at the current scroll.
  const center = (selector, index = 0) =>
    page.evaluate(
      ([s, i]) => {
        const el = document.querySelectorAll(s)[i];
        if (!el) throw new Error("missing " + s + "[" + i + "]");
        const r = el.getBoundingClientRect();
        return [r.left + r.width / 2, r.top + r.height / 2];
      },
      [selector, index],
    );

  const api = {
    page,
    ease,
    docY,
    center,
    get maxScroll() {
      return page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
    },
    async hold(sec) {
      const n = Math.round(sec * fps);
      for (let i = 0; i < n; i++) await frame();
    },
    /** Tween scroll and/or mouse together. `to` = { scrollY?, mouse?: [x,y], el?: {selector, scrollLeft} } */
    async tween(sec, to, fn = ease.inOut) {
      const n = Math.max(1, Math.round(sec * fps));
      const from = {
        scrollY: state.scrollY,
        mouse: state.mouse ?? to.mouse,
        left: to.el
          ? await page.evaluate((s) => document.querySelector(s).scrollLeft, to.el.selector)
          : 0,
      };
      for (let i = 1; i <= n; i++) {
        const k = fn(i / n);
        if (to.scrollY !== undefined) {
          state.scrollY = lerp(from.scrollY, to.scrollY, k);
          await page.evaluate((y) => window.scrollTo(0, y), state.scrollY);
        }
        if (to.el) {
          await page.evaluate(
            ([s, x]) => (document.querySelector(s).scrollLeft = x),
            [to.el.selector, lerp(from.left, to.el.scrollLeft, k)],
          );
        }
        if (to.mouse) {
          state.mouse = [lerp(from.mouse[0], to.mouse[0], k), lerp(from.mouse[1], to.mouse[1], k)];
          await page.mouse.move(state.mouse[0], state.mouse[1]);
        }
        await frame();
      }
    },
    /**
     * Glide the cursor through `points` ([x,y] in viewport px) on a smooth
     * Catmull-Rom curve, optionally scrolling at the same time.
     */
    async path(sec, points, { fn = ease.inOut, scrollY } = {}) {
      const pts = [state.mouse ?? points[0], ...points];
      const n = Math.max(1, Math.round(sec * fps));
      const fromY = state.scrollY;
      const seg = pts.length - 1;
      const at = (i) => pts[Math.max(0, Math.min(pts.length - 1, i))];
      for (let f = 1; f <= n; f++) {
        const k = fn(f / n) * seg;
        const i = Math.min(seg - 1, Math.floor(k));
        const t = k - i;
        const [p0, p1, p2, p3] = [at(i - 1), at(i), at(i + 1), at(i + 2)];
        const cr = (a, b, c, d) =>
          0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (-a + 3 * b - 3 * c + d) * t * t * t);
        state.mouse = [cr(p0[0], p1[0], p2[0], p3[0]), cr(p0[1], p1[1], p2[1], p3[1])];
        await page.mouse.move(state.mouse[0], state.mouse[1]);
        if (scrollY !== undefined) {
          state.scrollY = lerp(fromY, scrollY, fn(f / n));
          await page.evaluate((y) => window.scrollTo(0, y), state.scrollY);
        }
        await frame();
      }
    },
    async mouseAt(x, y) {
      state.mouse = [x, y];
      await page.mouse.move(x, y);
    },
    /** A visible press: hold the button for a few frames so :active states render. */
    async click() {
      await page.mouse.down();
      await api.hold(0.12);
      await page.mouse.up();
    },
    async jump(y) {
      state.scrollY = y;
      await page.evaluate((v) => window.scrollTo(0, v), y);
    },
  };

  try {
    await page.evaluate(() => window.__vclock.sync());
    await script(api);
  } finally {
    ff.stdin.end();
    await new Promise((r) => ff.on("close", r));
    await browser.close();
  }
  return { out, frames: state.frames, seconds: state.frames / fps };
}
