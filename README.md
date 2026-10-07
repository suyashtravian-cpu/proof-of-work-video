# Proof-of-work video

The "I built a proof-of-work site instead of another résumé" short, edited entirely in code with [Remotion](https://remotion.dev).

```
npm install
npm run dev          # live preview studio
npm run render       # 1080x1920 → out/proof-of-work-9x16.mp4
npm run render:wide  # 1920x1080 → out/proof-of-work-16x9.mp4
```

- `src/timeline.ts`: beat durations (to be replaced with voiceover word timestamps)
- `src/scenes/`: one file per script beat
- `src/media.ts`: points at footage in `public/media/` (raw media is not committed)
