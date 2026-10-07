// Beat timings in frames at 30fps. Placeholder values: once vo.wav is in,
// these get replaced with Whisper word timestamps so every cut lands on the voice.
export const FPS = 30;

export const beats = [
  { id: "hook", frames: 75 },       // "every application asks... Upload your résumé."
  { id: "resume", frames: 75 },     // "But a résumé tells you where I've worked."
  { id: "doesnt", frames: 105 },    // "how I think, what I can build, what I can actually do"
  { id: "built", frames: 90 },      // "So instead of making another résumé… I built this."
  { id: "montage", frames: 150 },   // "My projects. My experiments..."
  { id: "proof", frames: 75 },      // "Not a list of skills. Proof of them."
  { id: "outro", frames: 105 },     // "...more than a PDF."
] as const;

export const totalFrames = beats.reduce((sum, b) => sum + b.frames, 0);
