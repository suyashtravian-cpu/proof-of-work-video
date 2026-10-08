import React from "react";
import { Freeze, OffthreadVideo } from "remotion";
import { REC, REC_H, REC_W } from "../../v2/components/Rec";
import type { View } from "../../v2/scenes/manifesto-work/kit";
import { type Cam, type MapFn, lerp } from "../../v2/scenes/campaigns-lab/kit";
import { theme2 } from "../../v2/theme";

// Frozen frames of the site recording for a short composition.
//
// Video 2's helpers freeze the recording with <Freeze frame={seconds * fps}>. Remotion clamps a
// frozen frame (plus the Sequence offset) to the composition's length, and this ad is only 33.2 s
// while the recording runs to ~70 s, so those frames would all collapse onto one. Here the source
// time goes through `trimBefore` instead (frozen at the clip's own frame 0), which is exact for any
// time and never clamped. Same props and look as video 2's components.

/** One frame of the recording at `t` seconds (any time, sub-frame precise). */
export const RecStill: React.FC<{ t: number; style?: React.CSSProperties }> = ({ t, style }) => (
  <Freeze frame={0}>
    <OffthreadVideo src={REC} muted trimBefore={Math.max(0, t * 30)} style={{ width: REC_W, height: REC_H, display: "block", ...style }} />
  </Freeze>
);

/** campaigns-lab RecFrame: one frame of the recording at `t`, nudged by `shift` px. */
export const RecFrame: React.FC<{ t: number; shift?: number }> = ({ t, shift = 0 }) => (
  <div style={{ position: "absolute", left: 0, top: shift, width: REC_W, height: REC_H }}>
    <RecStill t={t} />
  </div>
);

/** manifesto-work RecView: the recording at source time `src`, framed by `view`; children in recording px. */
export const RecView: React.FC<{
  width: number;
  height: number;
  src: number;
  view: View;
  children?: React.ReactNode;
  filter?: string;
}> = ({ width, height, src, view, children, filter }) => {
  const s = width / view.w;
  // quantised to the recording's 60 fps frames, like video 2
  const t = Math.max(0, Math.round(src * 60)) / 60 + 0.004;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width, height, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: REC_W,
          height: REC_H,
          transformOrigin: "0 0",
          transform: `translate(${width / 2}px, ${height / 2}px) scale(${s}) translate(${-view.cx}px, ${-view.cy}px)`,
          filter,
        }}
      >
        <RecStill t={t} style={{ position: "absolute", left: 0, top: 0 }} />
        {children}
      </div>
    </div>
  );
};

/** Directional blur filter (SVG) so whip pans smear along their direction. */
const DirBlur: React.FC<{ id: string; x: number; y: number }> = ({ id, x, y }) => (
  <svg width={0} height={0} style={{ position: "absolute" }}>
    <filter id={id} x="-10%" y="-10%" width="120%" height="120%">
      <feGaussianBlur stdDeviation={`${x.toFixed(2)} ${y.toFixed(2)}`} />
    </filter>
  </svg>
);

/**
 * A floating glass window onto the recording. The window itself moves in 3D (x, y, rx, ry, rz, s);
 * inside it a camera frames the region around (cam.cx, cam.cy) of the recording at cam.zoom.
 * `inner` draws clipped to the glass, `overlay` draws unclipped (callouts that break the frame).
 */
export const FloatWin: React.FC<{
  id: string;
  w: number;
  h: number;
  x?: number;
  y?: number;
  rx?: number;
  ry?: number;
  rz?: number;
  s?: number;
  cam: Cam;
  recT: number;
  shift?: number;
  opacity?: number;
  dim?: number;
  blur?: number;
  mblur?: [number, number];
  sheen?: number;
  glow?: number;
  inner?: (map: MapFn, zoom: number) => React.ReactNode;
  overlay?: (map: MapFn, zoom: number) => React.ReactNode;
}> = ({ id, w, h, x = 0, y = 0, rx = 0, ry = 0, rz = 0, s = 1, cam, recT, shift = 0, opacity = 1, dim = 0, blur = 0, mblur = [0, 0], sheen = -1, glow = 1, inner, overlay }) => {
  const map: MapFn = (px, py) => [w / 2 + (px - cam.cx) * cam.zoom, h / 2 + (py - cam.cy) * cam.zoom];
  const useMb = mblur[0] > 0.4 || mblur[1] > 0.4;
  return (
    <div
      style={{
        position: "absolute",
        left: 540 - w / 2 + x,
        top: 960 - h / 2 + y,
        width: w,
        height: h,
        opacity,
        transform: `perspective(2400px) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg) scale(${s})`,
        filter: blur > 0.3 ? `blur(${blur.toFixed(2)}px)` : undefined,
      }}
    >
      {useMb && <DirBlur id={`mb-${id}`} x={mblur[0] / cam.zoom} y={mblur[1] / cam.zoom} />}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 28,
          overflow: "hidden",
          background: theme2.bg,
          boxShadow: `0 60px 140px rgba(3,4,18,.8), 0 0 ${100 * glow}px rgba(188,165,238,${0.38 * glow})`,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: 1708,
            height: 1080,
            transformOrigin: "0 0",
            transform: `translate(${w / 2 - cam.cx * cam.zoom}px, ${h / 2 - cam.cy * cam.zoom}px) scale(${cam.zoom})`,
            filter: useMb ? `url(#mb-${id})` : undefined,
          }}
        >
          <RecFrame t={recT} shift={shift} />
        </div>
        {dim > 0.01 && <div style={{ position: "absolute", inset: 0, background: `rgba(9,13,37,${dim})` }} />}
        {inner?.(map, cam.zoom)}
        {sheen > -0.5 && (
          <div
            style={{
              position: "absolute",
              top: -h,
              left: lerp(-w, w * 1.6, sheen),
              width: w * 0.35,
              height: h * 3,
              transform: "rotate(22deg)",
              background: "linear-gradient(90deg, rgba(255,255,255,0), rgba(244,240,255,.22), rgba(255,255,255,0))",
              mixBlendMode: "screen",
            }}
          />
        )}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 28,
            border: "1.5px solid rgba(228,220,255,.34)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,.25), inset 0 0 60px rgba(188,165,238,.12)",
          }}
        />
      </div>
      {overlay?.(map, cam.zoom)}
    </div>
  );
};

