# Site capture

Frame-perfect screen recordings of https://pilotaccess.com/proofofwork/, generated in code.

The page's animation clock (`requestAnimationFrame`, `performance.now`, CSS animations and
transitions) is virtualised, so every frame is rendered at an exact moment regardless of how
long the screenshot takes: no dropped frames, no jitter, identical output on every run.
The site's own cursor, hovers and magnetic button react to a real (scripted) mouse.

```
PREVIEW=1 node capture/run.mjs hero     # 1x, 30fps, fast: for choreography
node capture/run.mjs hero               # final: 2x pixels (4K desktop), 60fps
capture/sheet.sh out/captures/hero.preview.mp4 18   # timestamped contact sheet
```

Each clip in `clips/` exports `{ options, markers, script }`. Script API (see `engine.mjs`):
`hold(sec)`, `tween(sec, { scrollY, mouse: [x, y], el: { selector, scrollLeft } }, ease)`,
`path(sec, [[x, y], ...], { scrollY, fn })`, `mouseAt(x, y)`, `click()`, `jump(y)`,
`docY(selector, offset)`, `center(selector, index)`, `maxScroll`, `page`, `ease.*`.
