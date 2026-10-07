import React from "react";
import { AbsoluteFill, Freeze } from "remotion";
import { theme } from "../../theme";

// Neighbouring scenes are rebuilt independently; a crash in one must never take this scene down.
class Boundary extends React.Component<{ fallback: React.ReactNode; children: React.ReactNode }, { err: boolean }> {
  state = { err: false };
  static getDerivedStateFromError() {
    return { err: true };
  }
  render() {
    return this.state.err ? this.props.fallback : this.props.children;
  }
}

/** A real earlier scene, frozen on one frame and shrunk to a thumbnail. */
export const Mini: React.FC<{ Scene: React.FC; frame: number; scale: number; label: string }> = ({ Scene, frame, scale, label }) => (
  <div style={{ position: "relative", width: 1080 * scale, height: 1920 * scale, overflow: "hidden", background: theme.bg }}>
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, transform: `scale(${scale})`, transformOrigin: "0 0" }}>
      <AbsoluteFill style={{ background: theme.bg, overflow: "hidden" }}>
        <Boundary
          fallback={
            <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", fontFamily: theme.sans, fontWeight: 800, fontSize: 120, color: theme.fg }}>
              {label}
            </AbsoluteFill>
          }
        >
          <Freeze frame={frame}>
            <Scene />
          </Freeze>
        </Boundary>
      </AbsoluteFill>
    </div>
  </div>
);
