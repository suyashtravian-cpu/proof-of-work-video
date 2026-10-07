import { random, useCurrentFrame } from "remotion";
import { easeExpo, tween } from "../../components/anim";
import { Scramble } from "../../fx/Scramble";
import { theme } from "../../theme";
import { Affine, apply, DZ } from "./wall";

export const CYAN = "#33e1ff";

export const Cursor: React.FC<{ x: number; y: number; size?: number; rot?: number }> = ({ x, y, size = 64, rot = 0 }) => (
  <svg
    width={size}
    height={size * 1.4}
    viewBox="0 0 28 40"
    style={{ position: "absolute", left: x, top: y, transform: `rotate(${rot}deg)`, transformOrigin: "0 0", overflow: "visible", filter: "drop-shadow(0 6px 10px rgba(0,0,0,.45))" }}
  >
    <path d="M1,1 L1,33 L9,26 L15,39 L21,36 L15,23.5 L26,23.5 Z" fill="#0b0b0b" stroke="#fff" strokeWidth={2} strokeLinejoin="round" />
  </svg>
);

export const PdfIcon: React.FC<{ w: number }> = ({ w }) => {
  const h = w * 1.24;
  const fold = w * 0.3;
  return (
    <div style={{ position: "relative", width: w, height: h, flexShrink: 0 }}>
      <div style={{ position: "absolute", inset: 0, background: theme.red, borderRadius: w * 0.07, clipPath: `polygon(0 0, ${w - fold}px 0, 100% ${fold}px, 100% 100%, 0 100%)` }} />
      <div style={{ position: "absolute", right: 0, top: 0, width: fold, height: fold, background: "#b3231b", borderBottomLeftRadius: w * 0.05, clipPath: "polygon(0 0, 100% 100%, 0 100%)" }} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: h * 0.12, textAlign: "center", fontFamily: theme.mono, fontWeight: 500, fontSize: w * 0.26, color: "#fff", letterSpacing: "0.04em" }}>PDF</div>
    </div>
  );
};

export const FileChip: React.FC<{ scale?: number }> = ({ scale = 1 }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 24 * scale,
      padding: `${20 * scale}px ${30 * scale}px ${20 * scale}px ${22 * scale}px`,
      background: "#ffffff",
      borderRadius: 20 * scale,
      boxShadow: "0 30px 70px rgba(0,0,0,.55)",
      whiteSpace: "nowrap",
    }}
  >
    <PdfIcon w={78 * scale} />
    <div>
      <div style={{ fontFamily: theme.sans, fontWeight: 700, fontSize: 38 * scale, letterSpacing: "-0.03em", color: theme.ink }}>resume_final_v7.pdf</div>
      <div style={{ fontFamily: theme.mono, fontSize: 18 * scale, letterSpacing: "0.1em", color: "#8a8983", marginTop: 6 * scale }}>PDF DOCUMENT · 1 PAGE</div>
    </div>
  </div>
);

/** The dragged file, carried in screen space; glitches out of existence from `killAt`. */
export const DraggedFile: React.FC<{ t: number; x: number; y: number; scale: number; rot: number; killAt: number; trail: number }> = ({ t, x, y, scale, rot, killAt, trail }) => {
  const f = useCurrentFrame();
  if (t > killAt + 0.26) return null;
  const g = t >= killAt ? (t - killAt) / 0.26 : 0;
  const N = 9;
  const base: React.CSSProperties = { position: "absolute", left: x, top: y, transform: `translate(-50%,-50%) rotate(${rot}deg) scale(${scale})` };
  if (g === 0) {
    return (
      <>
        {trail > 0.02 &&
          [3, 2, 1].map((k) => (
            <div key={k} style={{ ...base, left: x + trail * k * 38, top: y + trail * k * 30, opacity: 0.18 * (4 - k) * Math.min(1, trail * 2) }}>
              <FileChip />
            </div>
          ))}
        <div style={base}>
          <FileChip />
        </div>
        <Cursor x={x + 230 * scale} y={y + 20 * scale} size={70 * scale} rot={-8} />
      </>
    );
  }
  // glitch-out: horizontal slices torn sideways with chroma ghosts, then a CRT collapse
  const collapse = tween(g, 0.6, 1, 1, 0.02);
  return (
    <div style={{ ...base, transform: `${base.transform} scaleY(${collapse}) scaleX(${1 + (1 - collapse) * 0.6})` }}>
      <div style={{ position: "relative" }}>
        <div style={{ visibility: "hidden" }}>
          <FileChip />
        </div>
        {Array.from({ length: N }, (_, i) => {
          const off = (random(`gl${i}${f}`) - 0.5) * 260 * Math.min(1, g * 2.5);
          const show = random(`gs${i}${f}`) > g * 0.55;
          if (!show) return null;
          return (
            <div key={i} style={{ position: "absolute", inset: 0, clipPath: `inset(${(i / N) * 100}% 0 ${100 - ((i + 1) / N) * 100}% 0)`, transform: `translateX(${off}px)` }}>
              <FileChip />
            </div>
          );
        })}
        <div style={{ position: "absolute", inset: 0, transform: `translateX(${-14 - g * 30}px)`, mixBlendMode: "screen", opacity: 0.7, filter: "sepia(1) saturate(8) hue-rotate(-50deg)" }}>
          <FileChip />
        </div>
        <div style={{ position: "absolute", inset: 0, background: "#fff", opacity: g > 0.6 ? 0.9 : 0 }} />
      </div>
    </div>
  );
};

export const Terminal: React.FC<{ t: number; at: number; out: number; typeFrom: number; typeTo: number; enterAt: number }> = ({ t, at, out, typeFrom, typeTo, enterAt }) => {
  if (t < at || t > out + 0.2) return null;
  const k = tween(t, at, at + 0.22, 0, 1, easeExpo);
  const e = tween(t, out, out + 0.2, 0, 1);
  const cmd = "rm resume_final_v7.pdf";
  const n = Math.floor(tween(t, typeFrom, typeTo, 0, cmd.length, (x) => x));
  const caret = Math.floor(t * 4) % 2 === 0;
  const prompt = (
    <>
      <span style={{ color: CYAN }}>~/career</span>
      <span style={{ color: theme.dim }}> $ </span>
    </>
  );
  return (
    <div
      style={{
        position: "absolute",
        left: 70,
        top: 1236,
        width: 940,
        transform: `translateY(${(1 - k) * 60 + e * -30}px) scale(${0.94 + 0.06 * k})`,
        opacity: k * (1 - e),
        background: "rgba(12,12,12,.92)",
        border: "1.5px solid #ffffff2e",
        borderRadius: 18,
        overflow: "hidden",
        fontFamily: theme.mono,
        fontSize: 34,
        color: theme.fg,
        boxShadow: "0 30px 80px rgba(0,0,0,.6)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 20px", borderBottom: "1.5px solid #ffffff1c", fontSize: 18, letterSpacing: "0.12em", color: theme.dim }}>
        {[theme.red, "#5a5a5a", "#5a5a5a"].map((c, i) => (
          <span key={i} style={{ width: 13, height: 13, borderRadius: 7, background: c }} />
        ))}
        <span style={{ marginLeft: 14 }}>zsh — ~/career</span>
      </div>
      <div style={{ padding: "22px 28px 26px", lineHeight: 1.55, whiteSpace: "pre" }}>
        <div>
          {prompt}
          <span>{cmd.slice(0, n)}</span>
          {t < enterAt && <span style={{ background: caret ? theme.fg : "transparent", color: theme.bg }}> </span>}
        </div>
        {t >= enterAt + 0.04 && <div style={{ color: theme.red }}>removed &apos;resume_final_v7.pdf&apos;</div>}
        {t >= enterAt + 0.12 && (
          <div>
            {prompt}
            <span style={{ background: caret ? theme.fg : "transparent" }}> </span>
          </div>
        )}
      </div>
    </div>
  );
};

/** Radial streaks; dir 1 = pushing in (streaks fly outward), -1 = pulling back. */
export const SpeedLines: React.FC<{ t: number; amount: number; dir?: number; seed: string; cx?: number; cy?: number }> = ({ t, amount, dir = 1, seed, cx = 540, cy = 960 }) => {
  if (amount <= 0.02) return null;
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {Array.from({ length: 56 }, (_, i) => {
        const ang = random(`${seed}a${i}`) * Math.PI * 2;
        const sp = 0.5 + random(`${seed}s${i}`);
        const phase = ((t * 3.2 * sp + random(`${seed}p${i}`)) % 1 + 1) % 1;
        const r = 160 + (dir > 0 ? phase : 1 - phase) * 1200;
        const len = (60 + 520 * random(`${seed}l${i}`)) * amount;
        const x1 = cx + Math.cos(ang) * r;
        const y1 = cy + Math.sin(ang) * r;
        const x2 = cx + Math.cos(ang) * (r + len);
        const y2 = cy + Math.sin(ang) * (r + len);
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={i % 11 === 0 ? CYAN : "#fff"} strokeWidth={1.5 + 2.5 * random(`${seed}w${i}`)} opacity={0.65 * amount} />;
      })}
    </svg>
  );
};

/** Short torn-bar glitch overlay at each time in `at` (lasts ~4 frames). */
export const Slices: React.FC<{ t: number; at: number[] }> = ({ t, at }) => {
  const f = useCurrentFrame();
  const hit = at.find((a) => t >= a && t < a + 0.14);
  if (hit === undefined) return null;
  const k = 1 - (t - hit) / 0.14;
  return (
    <>
      {Array.from({ length: 8 }, (_, i) => {
        const y = random(`hy${f}${i}`) * 1920;
        const h = 4 + random(`hh${f}${i}`) * 60;
        const x = (random(`hx${f}${i}`) - 0.5) * 300;
        const c = [theme.fg, theme.red, CYAN, "#000"][Math.floor(random(`hc${f}${i}`) * 4)];
        return <div key={i} style={{ position: "absolute", left: x, top: y, width: 1080, height: h, background: c, opacity: 0.6 * k, mixBlendMode: i % 2 ? "difference" : "normal" }} />;
      })}
    </>
  );
};

/** One kinetic word: pops in at `at`. */
export type Word = { w: string; at: number; color?: string; strikeAt?: number };

export const KLine: React.FC<{ t: number; words: Word[]; size: number; top: number; out: number; weight?: number; tracking?: string }> = ({
  t,
  words,
  size,
  top,
  out,
  weight = 800,
  tracking = "-0.055em",
}) => {
  if (t < words[0].at || t > out + 0.16) return null;
  const e = tween(t, out, out + 0.16, 0, 1);
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top,
        textAlign: "center",
        fontFamily: theme.sans,
        fontWeight: weight,
        fontSize: size,
        lineHeight: 1,
        letterSpacing: tracking,
        color: theme.fg,
        whiteSpace: "nowrap",
        opacity: 1 - e,
        transform: `scale(${1 + e * 0.5}) skewX(${e * -12}deg)`,
        textShadow: "0 8px 44px rgba(0,0,0,.9), 0 2px 8px rgba(0,0,0,.85)",
      }}
    >
      {words.map((w, i) => {
        const k = tween(t, w.at, w.at + 0.2, 0, 1, easeExpo);
        const strike = w.strikeAt !== undefined ? tween(t, w.strikeAt, w.strikeAt + 0.16, 0, 1, easeExpo) : 0;
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              position: "relative",
              marginRight: i < words.length - 1 ? "0.22em" : 0,
              opacity: t < w.at ? 0 : Math.min(1, k * 2.5),
              transform: `translateY(${(1 - k) * size * 0.3}px) scale(${1.32 - 0.32 * k})`,
              color: w.color ?? theme.fg,
            }}
          >
            {w.w}
            {strike > 0 && (
              <span
                style={{
                  position: "absolute",
                  left: "-4%",
                  width: "108%",
                  top: "52%",
                  height: size * 0.12,
                  background: theme.red,
                  transform: `scaleX(${strike}) rotate(-3deg)`,
                  transformOrigin: "0 50%",
                  boxShadow: "0 4px 18px rgba(0,0,0,.5)",
                }}
              />
            )}
          </span>
        );
      })}
    </div>
  );
};

/** HUD bracket that tracks a card's drop zone through the camera move. */
export const Tracker: React.FC<{ m: Affine | null; t: number; at: number; until: number; label: string; labelAt: number; color: string; seed: string }> = ({
  m,
  t,
  at,
  until,
  label,
  labelAt,
  color,
  seed,
}) => {
  if (!m || t < at || t > until) return null;
  const k = tween(t, at, at + 0.22, 0, 1, easeExpo);
  const o = tween(t, until - 0.12, until, 1, 0);
  const pts = [apply(m, DZ.x, DZ.y), apply(m, DZ.x + DZ.w, DZ.y), apply(m, DZ.x, DZ.y + DZ.h), apply(m, DZ.x + DZ.w, DZ.y + DZ.h)];
  const pad = 14 + (1 - k) * 50;
  const x0 = Math.min(...pts.map((p) => p.x)) - pad;
  const x1 = Math.max(...pts.map((p) => p.x)) + pad;
  const y0 = Math.min(...pts.map((p) => p.y)) - pad;
  const y1 = Math.max(...pts.map((p) => p.y)) + pad;
  const L = 26;
  const corner = (cx: number, cy: number, sx: number, sy: number) => <path d={`M${cx + sx * L},${cy} L${cx},${cy} L${cx},${cy + sy * L}`} fill="none" stroke={color} strokeWidth={4} />;
  return (
    <div style={{ position: "absolute", inset: 0, opacity: k * o }}>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        {corner(x0, y0, 1, 1)}
        {corner(x1, y0, -1, 1)}
        {corner(x0, y1, 1, -1)}
        {corner(x1, y1, -1, -1)}
        <line x1={x0} y1={y0} x2={x0 - 30} y2={y0 - 40} stroke={color} strokeWidth={2} />
      </svg>
      <div style={{ position: "absolute", left: Math.max(24, Math.min(700, x0 - 30)), top: y0 - 84, fontFamily: theme.mono, fontSize: 21, letterSpacing: "0.12em", color: theme.bg, background: color, padding: "5px 10px", whiteSpace: "nowrap" }}>
        <Scramble key={label} text={label} at={labelAt} dur={0.3} seed={seed + label} />
      </div>
    </div>
  );
};
