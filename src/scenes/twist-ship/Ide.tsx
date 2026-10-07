import { useCurrentFrame } from "remotion";
import { easeExpo, easeInOut, easeOut, tween } from "../../components/anim";
import { CodeLine } from "../../components/Code";
import { Scramble } from "../../fx/Scramble";
import { CODE_FILES, GIT_LOG, TOTAL_LINES, TREE } from "../../generated/code";
import { theme } from "../../theme";

const CYAN = "#33e1ff";
export const IDE = { x: 30, y: 122, w: 1020, h: 1298 };
const EXPLORER_W = 300;
const LH = 31;
const FS = 20;
const TITLE_H = 50;
const TABS_H = 44;

const fileText = (name: string) => CODE_FILES.find((f) => f.name === name)?.text ?? "";
const POW = fileText("ProofOfWork.tsx").split("\n");
const SELF = fileText("Twist.tsx").split("\n");
const findLine = (lines: string[], re: RegExp) => lines.findIndex((l) => re.test(l));

// Key lines of the master composition, highlighted in turn.
const KEYS = [
  { re: /<Sequence key=/, at: 0.32, tag: "every scene is a <Sequence>" },
  { re: /<Captions/, at: 0.62, tag: "captions · HUD · grain = components" },
  { re: /SFX\.map/, at: 0.9, tag: "every sound cue is data" },
]
  .map((k) => ({ ...k, line: findLine(POW, k.re) }))
  .filter((k) => k.line >= 0);

// Explorer rows: folders + files with their real line counts.
type Row = { depth: number; name: string; lines?: number; path?: string };
const ROWS: Row[] = (() => {
  const rows: Row[] = [];
  const open = new Set<string>();
  for (const f of TREE) {
    const parts = f.path.split("/");
    for (let d = 0; d < parts.length - 1; d++) {
      const key = parts.slice(0, d + 1).join("/");
      if (!open.has(key)) {
        open.add(key);
        rows.push({ depth: d, name: parts[d] + "/" });
      }
    }
    rows.push({ depth: parts.length - 1, name: parts[parts.length - 1], lines: f.lines, path: f.path });
  }
  return rows;
})();

const TYPED = "// written by AI · rendered by Remotion";

/** The multi-pane IDE: explorer with real line counts, real code with key-line highlights, live typing, git log. */
export const Ide: React.FC<{ at: number }> = ({ at }) => {
  const t = useCurrentFrame() / 30;
  const r = t - at; // seconds since the IDE started landing
  const k = tween(r, 0, 0.42, 0, 1, easeExpo);
  const rx = 26 - 22 * k + tween(r, 0.4, 2.3, 0, -3, easeInOut);
  const ry = -16 + 13 * k + tween(r, 0.4, 2.3, 0, 5, easeInOut);
  const sc = 0.62 + 0.38 * k + tween(r, 0.4, 2.3, 0, 0.02);
  const swap = r >= 1.2; // switch to the file that draws this very scene
  const file = swap ? SELF : POW;
  const viewLines = Math.floor((IDE.h - TITLE_H - TABS_H - 40) / LH);
  const scroll = swap
    ? tween(r, 1.2, 2.05, 0, Math.max(0, file.length - viewLines + 2), easeInOut)
    : tween(r, 0.08, 0.45, 0, Math.max(0, Math.min(file.length - viewLines + 1, (KEYS[0]?.line ?? 10) - 14)), easeOut);
  const typedChars = Math.round(tween(r, 1.95, 2.25, 0, TYPED.length, (x) => x));
  const treeK = tween(r, 0.05, 0.4, 0, 1, easeExpo);
  const codeK = tween(r, 0.1, 0.45, 0, 1, easeExpo);
  const total = Math.round(tween(r, 0.2, 1.2, 0, TOTAL_LINES, easeOut));
  const activePath = swap ? "src/scenes/Twist.tsx" : "src/ProofOfWork.tsx";
  const treeScroll = tween(r, 0.3, 2.2, 0, Math.max(0, ROWS.length * 27 - 860), easeInOut);
  const git = tween(r, 0.85, 1.15, 0, 1, easeExpo);
  const centerLine = swap ? Math.round(scroll + viewLines / 2) : -1;
  return (
    <div
      style={{
        position: "absolute",
        left: IDE.x,
        top: IDE.y,
        width: IDE.w,
        height: IDE.h,
        transform: `perspective(2400px) rotateX(${rx}deg) rotateY(${ry}deg) scale(${sc})`,
        opacity: Math.min(1, k * 2),
        transformStyle: "preserve-3d",
      }}
    >
      <div style={{ position: "absolute", inset: 0, borderRadius: 20, background: "#0b0b0b", border: "1px solid #ffffff26", overflow: "hidden", boxShadow: "0 60px 140px rgba(0,0,0,.8), 0 0 80px rgba(51,225,255,.08)" }}>
        {/* title bar */}
        <div style={{ height: TITLE_H, display: "flex", alignItems: "center", gap: 9, padding: "0 18px", background: "#151515", borderBottom: "1px solid #ffffff14", fontFamily: theme.mono, fontSize: 17, color: "#9a9a94" }}>
          {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
            <div key={c} style={{ width: 12, height: 12, borderRadius: 6, background: c }} />
          ))}
          <span style={{ marginLeft: 12 }}>
            <Scramble text={`proof-of-work-video — ${activePath}`} at={at + (swap ? 1.2 : 0.05)} dur={0.3} />
          </span>
          <span style={{ marginLeft: "auto", color: CYAN, letterSpacing: "0.08em" }}>● AI-WRITTEN</span>
        </div>
        <div style={{ position: "absolute", top: TITLE_H, bottom: 0, left: 0, right: 0, display: "flex" }}>
          {/* explorer */}
          <div style={{ width: EXPLORER_W, flexShrink: 0, background: "#0e0e0e", borderRight: "1px solid #ffffff14", position: "relative", overflow: "hidden", transform: `translateX(${(1 - treeK) * -120}px)`, opacity: treeK }}>
            <div style={{ fontFamily: theme.mono, fontSize: 15, letterSpacing: "0.16em", color: "#6d6c66", padding: "14px 18px 8px" }}>EXPLORER</div>
            <div style={{ position: "absolute", top: 46, left: 0, right: 0, transform: `translateY(${-treeScroll}px)` }}>
              {ROWS.map((row, i) => {
                const on = row.path === activePath;
                return (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      height: 27,
                      alignItems: "center",
                      paddingLeft: 14 + row.depth * 16,
                      paddingRight: 14,
                      fontFamily: theme.mono,
                      fontSize: 15.5,
                      color: on ? theme.bg : row.lines === undefined ? "#8c8b86" : "#cfcec8",
                      background: on ? theme.fg : undefined,
                    }}
                  >
                    <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{row.name}</span>
                    {row.lines !== undefined && <span style={{ marginLeft: "auto", paddingLeft: 8, color: on ? "#555" : "#5d5c57" }}>{row.lines}</span>}
                  </div>
                );
              })}
            </div>
            <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "18px 18px 22px", background: "linear-gradient(180deg, rgba(14,14,14,0) 0%, #0e0e0e 28%)" }}>
              <div style={{ fontFamily: theme.sans, fontWeight: 800, fontSize: 64, letterSpacing: "-0.04em", color: theme.fg, lineHeight: 1 }}>{total.toLocaleString("en-US")}</div>
              <div style={{ fontFamily: theme.mono, fontSize: 15, letterSpacing: "0.1em", color: CYAN, marginTop: 8 }}>LINES · {TREE.length} FILES</div>
              <div style={{ fontFamily: theme.mono, fontSize: 15, letterSpacing: "0.1em", color: "#8c8b86", marginTop: 4 }}>0 OPENED IN AN EDITOR</div>
            </div>
          </div>
          {/* editor */}
          <div style={{ flex: 1, position: "relative", overflow: "hidden", transform: `translateY(${(1 - codeK) * 160}px)`, opacity: codeK }}>
            <div style={{ height: TABS_H, display: "flex", alignItems: "flex-end", gap: 2, padding: "0 10px", background: "#121212", borderBottom: "1px solid #ffffff14" }}>
              {["ProofOfWork.tsx", "timeline.ts", "Twist.tsx"].map((n) => {
                const on = n === (swap ? "Twist.tsx" : "ProofOfWork.tsx");
                return (
                  <div key={n} style={{ fontFamily: theme.mono, fontSize: 16, padding: "10px 14px", color: on ? theme.fg : "#666", background: on ? "#0b0b0b" : "transparent", borderRadius: "7px 7px 0 0", borderTop: on ? `2px solid ${CYAN}` : "2px solid transparent" }}>
                    {n}
                  </div>
                );
              })}
            </div>
            <div style={{ position: "absolute", top: TABS_H + 10, left: 0, right: 0, transform: `translateY(${-scroll * LH}px)` }}>
              {[...file, swap ? TYPED : ""].map((line, i) => {
                const key = !swap ? KEYS.find((kk) => kk.line === i) : undefined;
                const hk = key ? tween(r, key.at, key.at + 0.18, 0, 1, easeExpo) : 0;
                const centered = i === centerLine;
                const isTyped = swap && i === file.length;
                if (Math.abs(i - scroll - viewLines / 2) > viewLines / 2 + 2) return <div key={i} style={{ height: LH }} />;
                return (
                  <div key={i} style={{ position: "relative", height: LH, display: "flex", alignItems: "center", fontSize: FS }}>
                    {(hk > 0 || centered) && (
                      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${(centered ? 1 : hk) * 100}%`, background: centered ? "rgba(255,255,255,.07)" : "rgba(51,225,255,.16)", borderLeft: `4px solid ${centered ? theme.fg : CYAN}` }} />
                    )}
                    <span style={{ position: "relative", width: 54, textAlign: "right", paddingRight: 16, color: hk > 0 ? CYAN : "#444", fontFamily: theme.mono, flexShrink: 0 }}>{i + 1}</span>
                    <span style={{ position: "relative" }}>
                      <CodeLine text={line} upTo={isTyped ? typedChars : undefined} style={isTyped ? { color: "#9a9a94" } : undefined} />
                      {isTyped && r > 1.9 && <span style={{ display: "inline-block", width: 11, height: 24, marginLeft: 1, verticalAlign: "middle", background: CYAN, opacity: Math.floor(t * 4) % 2 && typedChars >= TYPED.length ? 0.2 : 1 }} />}
                    </span>
                    {key && hk > 0 && (
                      <div
                        style={{
                          position: "absolute",
                          right: 14,
                          top: -40,
                          fontFamily: theme.mono,
                          fontSize: 19,
                          color: theme.bg,
                          background: CYAN,
                          padding: "5px 12px",
                          borderRadius: 6,
                          transform: `translateX(${(1 - hk) * 40}px)`,
                          opacity: hk,
                          boxShadow: "0 10px 30px rgba(0,0,0,.6)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        ← {key.tag}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 34, background: "#0f0f0f", borderTop: "1px solid #ffffff14", display: "flex", alignItems: "center", gap: 24, padding: "0 16px", fontFamily: theme.mono, fontSize: 14, color: "#77766f" }}>
              <span style={{ color: CYAN }}>⎇ main</span>
              <span>TypeScript React</span>
              <span>UTF-8</span>
              <span style={{ marginLeft: "auto" }}>Ln {Math.round(scroll) + (swap ? Math.round(viewLines / 2) : 1)}, Col 1</span>
            </div>
          </div>
        </div>
      </div>
      {/* floating git log, in front of the IDE */}
      {git > 0 && GIT_LOG.length > 0 && (
        <div
          style={{
            position: "absolute",
            right: -6,
            top: 70,
            width: 560,
            padding: "18px 20px 16px",
            borderRadius: 14,
            background: "rgba(16,16,16,.96)",
            border: "1px solid #ffffff30",
            boxShadow: "0 40px 90px rgba(0,0,0,.85)",
            transform: `translateZ(120px) translateX(${(1 - git) * 260}px) rotateY(${(1 - git) * -30}deg)`,
            opacity: git,
            fontFamily: theme.mono,
            fontSize: 16,
            lineHeight: "27px",
          }}
        >
          <div style={{ color: theme.fg, marginBottom: 6 }}>$ git log --oneline</div>
          {GIT_LOG.slice(0, 6).map((l, i) => {
            const show = tween(t, at + 0.95 + i * 0.06, at + 1.05 + i * 0.06, 0, 1);
            const [hash, ...msg] = l.split(" ");
            const m = msg.join(" ");
            return (
              <div key={i} style={{ whiteSpace: "nowrap", overflow: "hidden", opacity: show, transform: `translateX(${(1 - show) * 20}px)` }}>
                <span style={{ color: "#ffcb6b" }}>{hash}</span> <span style={{ color: "#cfcec8" }}>{m.length > 44 ? m.slice(0, 43) + "…" : m}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
