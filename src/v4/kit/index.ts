/**
 * AdFrontier kit: the frontier-of-AI elements, in video 1's look (black + white + ONE red #ff3b2f,
 * Hubot Sans + JetBrains Mono). Import from "../kit" inside src/v4/scenes/*.
 *
 * CLOCKS. Inside a scene, time is SEQUENCE seconds (useT() = frame / 30, 0 at the scene start).
 * Convert voice times with timing.ts: at("four", L.channels, "reddit") = that word's start in the
 * scene; word(L.x, "w") / wordEnd() = video seconds; enterAt(scene) = when your content may appear.
 * Word times are measured on the waveform (timing.ts FIX), not the raw aligner output.
 *
 * LAYOUT (1080×1920). Meta safe band y 270–1530. Hero zone y 300–1120. Voice orb docked at
 * (540, 1166). Captions top 1236 (two lines max, to ~1380). Keep 1140–1400 clear of text.
 * HUD sits in the corners only. ≤ 2 text layers at once (the caption counts as one).
 *
 * COMPOSITION does for you (AdFrontier.tsx): Space (3D world, camera flies at every cut), Shot
 * (each scene arrives from depth at enterAt and flies past the camera in its last 0.2 s), ⌘K palette
 * transitions at the start of one/two/three/four (scene content is invisible until enterAt ≈ 0.5 s),
 * GlitchCut on every boundary, TokenCaptions for every voice line (captions.ts: hide/red per line),
 * the docked VoiceOrb (from "I'm" to the end card; ORB_HIDE to step it aside), HUD, grain, voice, SFX.
 *
 * ── AiCursor ── the agent's cursor: red glowing arrow + "AI" tag.
 *   <AiCursor path={CursorKey[]} from? until? label="AI" size=1.25 />
 *   CursorKey = { t, x, y (tip, screen px), ease?, arc? (px bow), click?, down? (drag hold), type? (s) }
 *   cursorAt(path, t) → { x, y, down, speed, typing, clickAge }: attach dragged things to the cursor.
 *   Moves are agent-like by default (fast start, soft landing); click = press + red ripple.
 *
 * ── TokenCaptions ── composition-level (already mounted). tokenize(word) is exported for UI text that
 *   should stream like model output (the end card's button uses it). CaptionLine = { t, end, words,
 *   red?: number[], hide?, until? }. Edit src/v4/captions.ts, not the component.
 *
 * ── Thinking ── one shimmering line before a reveal (~0.4 s).
 *   <Thinking at y x=540 anchor="c" dur=0.42 text="thinking · planning 3 steps…" size=26 />
 *
 * ── ToolChip ── tool-call receipt beside an action: deploy(biltib) ✓ 1.2s.
 *   <ToolChip at x y name="deploy" arg="biltib" took="1.2s" resolve=0.22 out? anchor="l" size=22 status="ok"|"fail" />
 *   (y is the chip's vertical centre; spinner for `resolve` s, then the red ✓.)
 *
 * ── VoiceOrb ── red/white orb pulsing with the voice (envelope: src/v4/vo-envelope.json, built by
 *   scripts/vo-envelope.py; no audio decoding at render).
 *   <VoiceOrb x y size=46 sceneStart={S.<scene>[0]} born? level? opacity? scale? plain? />
 *   voiceLevel(videoSec) → 0..1. ORB_DOCK = { x: 540, y: 1166, size: 46 }.
 *
 * ── CommandPalette ── ⌘K transition (already mounted for the four sections; reuse only if needed).
 *   <CommandPalette at query select typeFrom? typeTo? done?: number[] items=COMMANDS y=560 width=860 />
 *   Gone by select + 0.3 (it flies past the camera). COMMANDS = build product / design tool /
 *   create content / launch campaign.
 *
 * ── VerifiedStamp ── a real number decodes, then "✓ snapshot · Oct 2026" slams on.
 *   <VerifiedStamp at value="1,999" x y size=150 sub? tag? ("TEAM PROJECT" | "CONCEPT") label?
 *     decode=0.5 stampAt=(at+decode+0.08) out? anchor="c" />   (y = top of the block)
 *   <DecodeNumber value at dur=0.5 style? />  <SnapshotStamp at text? size=22 rotate=-5 />
 *
 * ── Space / Shot / camZ / camSpeed ── the continuous world. Scenes rarely need these; camSpeed(t)
 *   tells you when the camera is mid fly-through if you want parallax that agrees with it.
 *
 * ── Hud / GlitchCut ── composition-level. Slices at={[...]} = in-scene torn-bar hit (cuts/hits only);
 *   Chroma at dur amount = red/white split of its children for a cut.
 *
 * ── fx ── Burst, Shockwave, SpeedLines: v1's hit effects in black/white/red (take `t` explicitly).
 * ── util ── C (colours/fonts), useT, prog, pop (0.22 s overshoot pop), kick, lerp, clamp01, tween, eases.
 *
 * RULES. One hero element per beat. ~50% negative space. Glitch/RGB only on cuts. No em dashes on
 * screen. remotion random() only. Pops 0.2–0.25 s; nothing static > ~0.4 s. Facts: see the brief.
 */
export { AiCursor, cursorAt, type CursorKey, type CursorPose } from "./AiCursor";
export { COMMANDS, CommandPalette } from "./CommandPalette";
export { Burst, Shockwave, SpeedLines } from "./fx";
export { Chroma, GlitchCut, Slices } from "./GlitchCut";
export { Hud } from "./Hud";
export { camSpeed, camZ, Shot, Space } from "./Space";
export { Thinking } from "./Thinking";
export { tokenize, TokenCaptions, type CaptionLine, type CaptionWord } from "./TokenCaptions";
export { ToolChip } from "./ToolChip";
export { C, clamp01, easeBack, easeExpo, easeIn3, easeInOut, easeOut, kick, lerp, pop, prog, tween, useT } from "./util";
export { DecodeNumber, SnapshotStamp, VerifiedStamp } from "./VerifiedStamp";
export { ORB_DOCK, VoiceOrb, voiceLevel } from "./VoiceOrb";
