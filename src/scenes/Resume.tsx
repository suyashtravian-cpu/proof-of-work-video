import { AbsoluteFill, Easing, random, useCurrentFrame } from "remotion";
import { easeExpo, easeInOut, easeOut, tween } from "../components/anim";
import { Paper, PAPER_H, PAPER_LAYOUT, PAPER_W } from "../components/Paper";
import { FloatingCode } from "../fx/FloatingCode";
import { GridBg } from "../fx/GridBg";
import { Particles } from "../fx/Particles";
import { Scramble } from "../fx/Scramble";
import { shakeAt } from "../fx/shake";
import { theme } from "../theme";
import { AsciiPaper, Pose } from "./resume-prompt/AsciiPaper";

// 6.0–13.0  résumé.parse(): a scan beam reads the page, a parser fills a JSON panel. It finds
// exactly one thing (where I've worked); the other three fields come back null on the slam beats.
// Then the page dissolves into ASCII and blows into the camera.

const CYAN = "#33e1ff";
const mix = (a: number, b: number, k: number) => a + (b - a) * k;
const lin = (k: number) => k;
const easeIn = Easing.in(Easing.cubic);

const FIELDS = [
  { key: "how_i_think", at: 2.8, slam: "how I think.", tag: "THINK" },
  { key: "what_i_can_build", at: 4.1, slam: "what I can build.", tag: "BUILD" },
  { key: "what_i_can_actually_do", at: 5.4, slam: "what I can actually do.", tag: "DO" },
];
const BEATS = FIELDS.map((f) => f.at);
const SCAN: [number, number] = [0.35, 1.75];
const RESCAN: [number, number] = [1.85, 2.45];
const FOUND_AT = 1.5;
const DISSOLVE: [number, number] = [5.8, 6.5];
const BLOW: [number, number] = [6.5, 7.0];

const decay = (t: number, at: number, d: number) => (t >= at && t < at + d ? (1 - (t - at) / d) ** 2 : 0);
const beatKick = (t: number, d = 0.3) => BEATS.reduce((a, b) => a + decay(t, b, d), 0);

const poseAt = (t: number): Pose => {
  const enter = tween(t, 0, 0.5, 0, 1, easeExpo);
  const g = tween(t, 2.48, 2.82, 0, 1, easeInOut);
  const flat = tween(t, 5.45, 5.8, 0, 1, easeInOut);
  return {
    cx: 540,
    // Opens where the Hook's push-in lands (page big and flat, centred), then pulls back into 3D.
    cy: mix(mix(960, 590, enter), 385, g) + Math.sin(t * 1.1) * 6 * (1 - flat),
    s: mix(mix(1.3, 0.62, enter), 0.44, g) * (1 + t * 0.008),
    rx: ((enter * mix(12, 6, g)) + Math.sin(t * 0.8) * 2 * enter) * (1 - flat),
    ry: (enter * mix(-18, -10, g) + Math.sin(t * 0.6 + 1) * 4 * enter) * (1 - flat),
    rz: (Math.sin(t * 0.5) * 1.2 * enter) * (1 - flat),
  };
};

// paper-space y -> time the cyan beam crosses it
const beamT = (y: number) => SCAN[0] + ((y + 30) / (PAPER_H + 60)) * (SCAN[1] - SCAN[0]);

// ---------- paper overlays (paper coordinates, move with the 3D page) ----------

const Brackets: React.FC<{ x: number; y: number; w: number; h: number; k: number; color: string; label: string; at: number; fill?: string }> = ({
  x,
  y,
  w,
  h,
  k,
  color,
  label,
  at,
  fill,
}) => {
  if (k <= 0) return null;
  const pad = (1 - k) * 50;
  const L = 40;
  const X = x - pad;
  const Y = y - pad;
  const W = w + pad * 2;
  const H = h + pad * 2;
  const c = (cx: number, cy: number, sx: number, sy: number) => (
    <path d={`M${cx + sx * L},${cy} L${cx},${cy} L${cx},${cy + sy * L}`} fill="none" stroke={color} strokeWidth={7} />
  );
  return (
    <>
      {fill && <div style={{ position: "absolute", left: X, top: Y, width: W, height: H, background: fill, opacity: k }} />}
      <svg width={PAPER_W} height={PAPER_H} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", opacity: k }}>
        {c(X, Y, 1, 1)}
        {c(X + W, Y, -1, 1)}
        {c(X, Y + H, 1, -1)}
        {c(X + W, Y + H, -1, -1)}
      </svg>
      <div
        style={{
          position: "absolute",
          left: X,
          top: Y - 58,
          fontFamily: theme.mono,
          fontSize: 38,
          lineHeight: "50px",
          padding: "0 12px",
          background: color,
          color: color === theme.red ? "#fff" : theme.bg,
          opacity: k,
          whiteSpace: "pre",
        }}
      >
        <Scramble text={label} at={at} dur={0.3} />
      </div>
    </>
  );
};

// jagged crack, drawn progressively
const crackPath = (seed: string, x: number, y: number, len: number) => {
  let px = x;
  let py = y;
  let d = `M${px},${py}`;
  const ang = random(seed) * Math.PI * 2;
  for (let i = 0; i < 10; i++) {
    px += Math.cos(ang + (random(seed + i) - 0.5) * 1.5) * (len / 10);
    py += Math.sin(ang + (random(seed + "y" + i) - 0.5) * 1.5) * (len / 10);
    d += ` L${px.toFixed(1)},${py.toFixed(1)}`;
  }
  return d;
};
const IMPACTS: [number, number][] = [
  [300, 420],
  [520, 650],
  [360, 260],
];
const CRACKS = BEATS.flatMap((at, b) =>
  Array.from({ length: 6 }, (_, j) => ({ at: at + j * 0.012, d: crackPath(`rc${b}${j}`, IMPACTS[b][0], IMPACTS[b][1], 260 + random(`rl${b}${j}`) * 320) })),
);

const PaperFx: React.FC<{ t: number }> = ({ t }) => {
  const exp = PAPER_LAYOUT.sections.experience;
  const hdr = PAPER_LAYOUT.header;
  const beamY = tween(t, SCAN[0], SCAN[1], -30, PAPER_H + 30, lin);
  const scanning = t >= SCAN[0] && t <= SCAN[1];
  const scanned = t >= SCAN[0] ? Math.max(0, Math.min(PAPER_H, beamY)) : 0;
  const tintOut = tween(t, 2.45, 2.8, 1, 0);
  const rescanY = tween(t, RESCAN[0], RESCAN[1], PAPER_H + 30, -30, easeInOut);
  const rescanning = t >= RESCAN[0] && t <= RESCAN[1];
  const hdrK = tween(t, beamT(hdr.y + hdr.h), beamT(hdr.y + hdr.h) + 0.22, 0, 1, easeExpo) * tween(t, 2.4, 2.6, 1, 0);
  const expAt = beamT(exp.y + 30);
  const expK = tween(t, expAt, expAt + 0.25, 0, 1, easeExpo);
  const redFlash = beatKick(t, 0.25);
  return (
    <>
      {/* scanned area: fine cyan scanlines */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: PAPER_W,
          height: scanned,
          backgroundImage: `repeating-linear-gradient(180deg, ${CYAN}22 0 2px, transparent 2px 7px)`,
          opacity: tintOut,
          borderRadius: 10,
        }}
      />
      {scanning && (
        <>
          <div style={{ position: "absolute", left: -20, width: PAPER_W + 40, top: beamY - 200, height: 200, background: `linear-gradient(180deg, transparent, ${CYAN}55)` }} />
          <div style={{ position: "absolute", left: -40, width: PAPER_W + 80, top: beamY - 4, height: 8, background: CYAN, boxShadow: `0 0 40px 12px ${CYAN}aa` }} />
          <div style={{ position: "absolute", left: PAPER_W + 34, top: beamY - 24, fontFamily: theme.mono, fontSize: 34, color: CYAN, whiteSpace: "pre" }}>
            {`SCAN ${String(Math.round((scanned / PAPER_H) * 100)).padStart(3, "0")}%`}
          </div>
        </>
      )}
      {rescanning && (
        <>
          <div style={{ position: "absolute", left: -20, width: PAPER_W + 40, top: rescanY, height: 160, background: `linear-gradient(0deg, transparent, ${theme.red}40)` }} />
          <div style={{ position: "absolute", left: -40, width: PAPER_W + 80, top: rescanY - 3, height: 6, background: theme.red, boxShadow: `0 0 30px 8px ${theme.red}99` }} />
          <div style={{ position: "absolute", left: PAPER_W + 34, top: rescanY - 24, fontFamily: theme.mono, fontSize: 34, color: theme.red, whiteSpace: "pre" }}>
            RE-SCAN
          </div>
        </>
      )}
      <Brackets x={hdr.x - 14} y={hdr.y - 6} w={hdr.w + 28} h={hdr.h + 12} k={hdrK} color={theme.ink} label="name" at={beamT(hdr.y + hdr.h)} />
      <Brackets
        x={exp.x - 18}
        y={exp.y - 14}
        w={exp.w + 36}
        h={exp.h + 28}
        k={expK}
        color={theme.red}
        label={t >= FOUND_AT ? "where_ive_worked ✓" : "where_ive_worked"}
        at={expAt}
        fill={`${theme.red}14`}
      />
      {/* empty bottom of the page: the parser looks for the rest and finds nothing */}
      {FIELDS.map((fd, i) => {
        const at = RESCAN[0] + 0.08 + i * 0.13;
        const k = tween(t, at, at + 0.15, 0, 1, easeExpo);
        if (k <= 0) return null;
        return (
          <div
            key={fd.key}
            style={{
              position: "absolute",
              left: 72 + (1 - k) * 40,
              top: 775 + i * 62,
              fontFamily: theme.mono,
              fontSize: 30,
              color: theme.red,
              opacity: k * (t >= fd.at ? 1 : 0.75),
              whiteSpace: "pre",
            }}
          >
            {`✗ ${fd.key}`}
            <span style={{ color: "#8a8780" }}>{"  0 matches"}</span>
          </div>
        );
      })}
      <svg width={PAPER_W} height={PAPER_H} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        {CRACKS.map((c, i) => {
          const k = tween(t, c.at, c.at + 0.14, 0, 1, easeOut);
          if (k <= 0) return null;
          return (
            <g key={i}>
              <path d={c.d} fill="none" stroke="#ffffff" strokeWidth={9} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - k} opacity={0.8} />
              <path d={c.d} fill="none" stroke="#0a0a0a" strokeWidth={5} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - k} />
            </g>
          );
        })}
      </svg>
      <div style={{ position: "absolute", inset: 0, background: theme.red, opacity: redFlash * 0.35, borderRadius: 10 }} />
    </>
  );
};

// ---------- JSON panel (screen space) ----------

const PANEL = { x: 70, y: 1000, w: 940, head: 62, padTop: 18, lh: 50, fs: 30 };
const CW = PANEL.fs * 0.6;
const lineY = (i: number) => PANEL.y + PANEL.head + PANEL.padTop + i * PANEL.lh;
const SPIN = "|/-\\";

const typed = (parts: [string, string][], n: number) => {
  let left = n;
  return parts.map(([s, c], i) => {
    const shown = s.slice(0, Math.max(0, left));
    left -= s.length;
    return shown ? (
      <span key={i} style={{ color: c }}>
        {shown}
      </span>
    ) : null;
  });
};

const ARRAY_SLOTS = [70, 118, 54];
const ARRAY_X = PANEL.x + 30 + 22 * CW + 8;
const slotX = (i: number) => ARRAY_X + ARRAY_SLOTS.slice(0, i).reduce((a, b) => a + b + 14, 0);
const SLOT_AT = [1.18, 1.28, 1.38];

const JsonPanel: React.FC<{ t: number; f: number }> = ({ t, f }) => {
  const enter = tween(t, 0.45, 0.8, 0, 1, easeExpo);
  if (enter <= 0) return null;
  const kick = beatKick(t, 0.25);
  const nulls = FIELDS.filter((x) => t >= x.at).length;
  const spin = SPIN[Math.floor(f / 2) % 4];
  let status: React.ReactNode = <span style={{ color: CYAN }}>{`PARSING ${spin}`}</span>;
  if (t >= 0.8) status = <span style={{ color: CYAN }}>{`EXTRACTING ${spin}`}</span>;
  if (t >= FOUND_AT) status = <span style={{ color: theme.fg }}>1 FIELD FOUND</span>;
  if (t >= RESCAN[0]) status = <span style={{ color: theme.dim }}>{`SEARCHING ${spin}`}</span>;
  if (nulls > 0) status = <span style={{ color: theme.red }}>{`${nulls} × NULL`}</span>;
  if (t >= 5.9)
    status = (
      <span style={{ color: "#fff", background: theme.red, padding: "2px 10px" }}>
        <Scramble text="INCOMPLETE" at={5.9} dur={0.3} />
      </span>
    );
  const where = `  "where_ive_worked": [`;
  const nWhere = Math.round(tween(t, 0.8, 1.15, 0, where.length, lin));
  const closeK = t >= 1.45;
  const foundK = tween(t, FOUND_AT, FOUND_AT + 0.2, 0, 1, easeExpo);
  const rowBase: React.CSSProperties = {
    position: "absolute",
    left: 0,
    right: 0,
    height: PANEL.lh,
    paddingLeft: 30,
    display: "flex",
    alignItems: "center",
    whiteSpace: "pre",
  };
  return (
    <div
      style={{
        position: "absolute",
        left: PANEL.x,
        top: PANEL.y,
        width: PANEL.w,
        height: PANEL.head + PANEL.padTop * 2 + PANEL.lh * 6,
        transform: `perspective(1600px) translateY(${(1 - enter) * 160 + kick * 10}px) rotateX(${(1 - enter) * 35 + 3}deg) rotateY(${Math.sin(t * 0.7) * 2}deg)`,
        opacity: enter,
        fontFamily: theme.mono,
        fontSize: PANEL.fs,
        color: theme.fg,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 22,
          background: "rgba(14,14,14,0.94)",
          border: `1.5px solid ${nulls ? theme.red + "88" : "#ffffff26"}`,
          boxShadow: `0 40px 100px rgba(0,0,0,.7), 0 0 ${30 + kick * 60}px ${nulls ? theme.red + "44" : CYAN + "22"}`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          height: PANEL.head,
          borderBottom: "1.5px solid #ffffff1a",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 26px",
          fontSize: 22,
          letterSpacing: "0.1em",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 10, color: theme.dim }}>
          {[theme.red, "#555", "#555"].map((c, i) => (
            <span key={i} style={{ width: 13, height: 13, borderRadius: 7, background: c, display: "inline-block" }} />
          ))}
          <span style={{ marginLeft: 8 }}>resume.parse() → output.json</span>
        </span>
        {status}
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: PANEL.head + PANEL.padTop }}>
        {/* { */}
        <div style={{ ...rowBase, top: 0, color: theme.dim }}>{t >= 0.62 ? "{" : ""}</div>
        {/* where_ive_worked */}
        <div style={{ ...rowBase, top: PANEL.lh, background: `${CYAN}${Math.round(foundK * 0x18).toString(16).padStart(2, "0")}` }}>
          {typed(
            [
              ["  ", theme.dim],
              ['"where_ive_worked"', theme.fg],
              [": [", theme.dim],
            ],
            nWhere,
          )}
          {nWhere > 0 && nWhere < where.length && <span style={{ width: 3, height: 32, background: CYAN, display: "inline-block" }} />}
        </div>
        {ARRAY_SLOTS.map((w, i) => {
          const k = tween(t, SLOT_AT[i], SLOT_AT[i] + 0.12, 0, 1, easeExpo);
          return k > 0 ? (
            <div
              key={i}
              style={{
                position: "absolute",
                left: slotX(i) - PANEL.x,
                top: PANEL.lh + PANEL.lh / 2 - 9,
                width: w,
                height: 18,
                borderRadius: 4,
                background: theme.fg,
                transform: `scaleX(${k})`,
                transformOrigin: "0 50%",
              }}
            />
          ) : null;
        })}
        {closeK && (
          <div style={{ ...rowBase, top: PANEL.lh, left: slotX(3) - PANEL.x - 30 - 4, color: theme.dim }}>
            {"],"}
            {foundK > 0 && (
              <span
                style={{
                  marginLeft: 22,
                  fontSize: 22,
                  letterSpacing: "0.1em",
                  background: CYAN,
                  color: theme.bg,
                  padding: "4px 10px",
                  transform: `scale(${1.6 - 0.6 * foundK})`,
                  opacity: foundK,
                  display: "inline-block",
                }}
              >
                ✓ FOUND
              </span>
            )}
          </div>
        )}
        {FIELDS.map((fd, i) => {
          const row = i + 2;
          const keyText = `  "${fd.key}": `;
          const typeFrom = fd.at - 0.34;
          const n = Math.round(tween(t, typeFrom, fd.at - 0.08, 0, keyText.length, lin));
          const hit = t >= fd.at;
          const k = tween(t, fd.at, fd.at + 0.18, 0, 1, easeExpo);
          const flash = decay(t, fd.at, 0.4);
          const comma = i < FIELDS.length - 1 ? "," : "";
          let body: React.ReactNode;
          if (t < 0.62) body = null;
          else if (n === 0) {
            const searching = t >= RESCAN[0];
            body = searching ? (
              <span style={{ color: "#4a4a4a" }}>
                {"  " +
                  Array.from({ length: fd.key.length + 4 }, (_, c) => "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&*+<>/=_{}[]"[Math.floor(random(`sk${i}${c}${Math.floor(f / 2)}`) * 52)]).join("")}
              </span>
            ) : (
              <span
                style={{
                  marginLeft: 2 * CW,
                  width: (fd.key.length + 4) * CW,
                  height: 18,
                  borderRadius: 5,
                  display: "inline-block",
                  background: `linear-gradient(90deg, #1f1f1f 0%, #3a3a3a ${((t * 90 + i * 30) % 140) - 20}%, #1f1f1f ${((t * 90 + i * 30) % 140) + 10}%)`,
                }}
              />
            );
          } else
            body = (
              <>
                {typed(
                  [
                    ["  ", theme.dim],
                    [`"${fd.key}"`, hit ? "#d8d6d0" : theme.fg],
                    [": ", theme.dim],
                  ],
                  n,
                )}
                {!hit && <span style={{ width: 3, height: 32, background: CYAN, display: "inline-block" }} />}
                {hit && (
                  <span
                    style={{
                      color: flash > 0.3 ? "#fff" : theme.red,
                      background: flash > 0.3 ? theme.red : "transparent",
                      fontWeight: 500,
                      display: "inline-block",
                      transform: `scale(${1.9 - 0.9 * k})`,
                      transformOrigin: "0 50%",
                      padding: "0 4px",
                      outline: `3px solid ${theme.red}`,
                      outlineOffset: 4 + (1 - k) * 16,
                    }}
                  >
                    null
                  </span>
                )}
                {hit && <span style={{ color: theme.dim }}>{comma}</span>}
              </>
            );
          return (
            <div key={fd.key} style={{ ...rowBase, top: row * PANEL.lh, background: hit ? `rgba(255,59,47,${0.1 + flash * 0.45})` : "transparent" }}>
              {body}
            </div>
          );
        })}
        <div style={{ ...rowBase, top: 5 * PANEL.lh, color: theme.dim }}>{t >= 0.62 ? "}" : ""}</div>
      </div>
    </div>
  );
};

// ---------- bars that fly from the page into the JSON array ----------

const FlyBars: React.FC<{ t: number; pose: Pose }> = ({ t, pose }) => {
  const exp = PAPER_LAYOUT.ink.filter((r) => r.h === 13 && r.y > PAPER_LAYOUT.sections.experience.y && r.y < PAPER_LAYOUT.sections.experience.y + PAPER_LAYOUT.sections.experience.h);
  return (
    <>
      {exp.slice(0, 6).map((r, i) => {
        const slot = Math.floor(i / 2);
        const from = SLOT_AT[slot] - 0.32 + (i % 2) * 0.04;
        const k = tween(t, from, SLOT_AT[slot] + 0.02, 0, 1, Easing.inOut(Easing.cubic));
        if (k <= 0 || k >= 1) return null;
        const sx = pose.cx + (r.x + r.w / 2 - PAPER_W / 2) * pose.s;
        const sy = pose.cy + (r.y - PAPER_H / 2) * pose.s;
        const tx = slotX(slot) + ARRAY_SLOTS[slot] / 2;
        const ty = lineY(1) + PANEL.lh / 2;
        const x = mix(sx, tx, k) + Math.sin(k * Math.PI) * (i % 2 ? 120 : -120);
        const y = mix(sy, ty, k);
        const w = mix(r.w * pose.s, ARRAY_SLOTS[slot], k);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x - w / 2,
              top: y - 8,
              width: w,
              height: 16,
              borderRadius: 4,
              background: i % 2 ? CYAN : theme.fg,
              boxShadow: `0 0 18px ${CYAN}`,
              opacity: 0.95,
            }}
          />
        );
      })}
    </>
  );
};

// ---------- the NOT slams ----------

const SLAM_CY = 805;

const SlamLayer: React.FC<{ t: number; f: number }> = ({ t, f }) => {
  const fd = [...FIELDS].reverse().find((x) => t >= x.at);
  if (!fd) return null;
  const age = t - fd.at;
  const k = tween(t, fd.at, fd.at + 0.22, 0, 1, easeExpo);
  const kn = tween(t, fd.at - 0.02, fd.at + 0.14, 0, 1, easeExpo);
  const split = (1 - tween(t, fd.at, fd.at + 0.3, 0, 1, easeOut)) * 26;
  const size = fd.slam.length > 18 ? 132 : 158;
  const scale = (1.5 - 0.5 * k) * (1 + age * 0.03);
  const out = tween(t, BLOW[0] + 0.15, BLOW[1], 0, 1, easeIn);
  const text: React.CSSProperties = {
    fontFamily: theme.sans,
    fontWeight: 800,
    fontSize: size,
    lineHeight: 0.95,
    letterSpacing: "-0.055em",
    textAlign: "center",
    width: 960,
  };
  const glitching = age < 0.12;
  return (
    <div
      style={{
        position: "absolute",
        left: 60,
        width: 960,
        top: SLAM_CY - 210,
        height: 420,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        opacity: 1 - out,
      }}
    >
      <div
        style={{
          fontFamily: theme.mono,
          fontSize: 54,
          letterSpacing: "0.4em",
          paddingLeft: "0.4em",
          color: "#fff",
          background: theme.red,
          padding: "2px 10px 2px 26px",
          transform: `scale(${2.2 - 1.2 * kn}) rotate(${(1 - kn) * -6}deg)`,
          opacity: Math.min(1, kn * 2),
        }}
      >
        NOT
      </div>
      <div style={{ position: "relative" }}>
        <div
          style={{
            ...text,
            color: theme.fg,
            transform: `scale(${scale})`,
            opacity: Math.min(1, k * 2),
            textShadow: `${-split}px 0 ${theme.red}, ${split}px 0 ${CYAN}, 0 6px 40px rgba(0,0,0,.9)`,
          }}
        >
          {fd.slam}
        </div>
        {glitching &&
          [0, 1, 2].map((i) => {
            const top = random(`gs${f}${i}`) * 80;
            const h = 6 + random(`gh${f}${i}`) * 18;
            return (
              <div
                key={i}
                style={{
                  ...text,
                  position: "absolute",
                  left: 0,
                  top: 0,
                  color: i === 1 ? theme.red : theme.fg,
                  transform: `translateX(${(random(`gx${f}${i}`) - 0.5) * 120}px) scale(${scale})`,
                  clipPath: `inset(${top}% 0 ${Math.max(0, 100 - top - h)}% 0)`,
                }}
              >
                {fd.slam}
              </div>
            );
          })}
      </div>
    </div>
  );
};

const ImpactFx: React.FC<{ t: number }> = ({ t }) => (
  <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
    {BEATS.map((at, b) => {
      const e = tween(t, at, at + 0.38, 0, 1, easeOut);
      if (t < at || e >= 1) return null;
      return (
        <g key={b}>
          <circle cx={540} cy={SLAM_CY} r={120 + e * 680} fill="none" stroke="#fff" strokeWidth={10 * (1 - e)} opacity={1 - e} />
          <circle cx={540} cy={SLAM_CY} r={60 + e * 420} fill="none" stroke={theme.red} strokeWidth={5 * (1 - e)} opacity={1 - e} />
          {Array.from({ length: 22 }, (_, i) => {
            const a = (i / 22) * Math.PI * 2 + random(`ia${b}${i}`) * 0.3;
            const r1 = 220 + e * (380 + random(`ir${b}${i}`) * 300);
            const r2 = r1 + 90 * (1 - e);
            return (
              <line
                key={i}
                x1={540 + Math.cos(a) * r1}
                y1={SLAM_CY + Math.sin(a) * r1 * 0.75}
                x2={540 + Math.cos(a) * r2}
                y2={SLAM_CY + Math.sin(a) * r2 * 0.75}
                stroke={i % 3 ? "#fff" : CYAN}
                strokeWidth={4}
                opacity={1 - e}
              />
            );
          })}
        </g>
      );
    })}
  </svg>
);

// ---------- field meter in the (now caption-free) lower band ----------

const Meter: React.FC<{ t: number }> = ({ t }) => {
  const enter = tween(t, 2.82, 3.05, 0, 1, easeExpo);
  if (enter <= 0) return null;
  const segs = [{ tag: "WORKED", ok: true, at: 0 }, ...FIELDS.map((x) => ({ tag: x.tag, ok: false, at: x.at }))];
  const W = (940 - 3 * 14) / 4;
  return (
    <div style={{ position: "absolute", left: 70, top: 1452, width: 940, opacity: enter, transform: `translateY(${(1 - enter) * 40}px)` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", fontFamily: theme.mono, fontSize: 24, letterSpacing: "0.14em", color: theme.dim }}>
        <span>FIELDS FOUND</span>
        <span style={{ fontFamily: theme.sans, fontWeight: 800, fontSize: 52, letterSpacing: "-0.03em", color: theme.fg }}>
          1<span style={{ color: theme.dim }}> / 4</span>
        </span>
      </div>
      <div style={{ display: "flex", gap: 14, marginTop: 10 }}>
        {segs.map((s, i) => {
          const hit = s.ok || t >= s.at;
          const fl = s.ok ? 0 : decay(t, s.at, 0.35);
          return (
            <div
              key={i}
              style={{
                width: W,
                height: 64,
                boxSizing: "border-box",
                border: `2px solid ${s.ok ? theme.fg : hit ? theme.red : "#333"}`,
                background: s.ok ? theme.fg : fl > 0 ? theme.red : hit ? `${theme.red}22` : "transparent",
                color: s.ok ? theme.bg : fl > 0 ? "#fff" : hit ? theme.red : "#555",
                fontFamily: theme.mono,
                fontSize: 22,
                letterSpacing: "0.12em",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transform: `scale(${1 + fl * 0.12})`,
              }}
            >
              {s.tag} {s.ok ? "✓" : hit ? "✗" : "…"}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ---------- scene ----------

export const Resume: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / 30;
  const pose = poseAt(t);
  const [shx, shy, shr] = shakeAt(t, BEATS, 20, 0.3);
  const punch = 1 + beatKick(t, 0.25) * 0.035;
  const ramp = tween(t, 6.55, 7.0, 0, 1, easeIn);
  const cam = (1 + t * 0.006) * punch * (1 + ramp * 0.3);
  const dissolve = tween(t, DISSOLVE[0], DISSOLVE[1], 0, 1.12, lin);
  const blow = tween(t, BLOW[0], BLOW[1], 0, 1, lin);
  const g = tween(t, 2.48, 2.82, 0, 1, easeInOut);
  const beatsPassed = BEATS.filter((b) => t >= b).length;
  const bright = 1 - 0.18 * g - 0.08 * beatsPassed;
  const focus = tween(t, beamT(PAPER_LAYOUT.sections.experience.y + 30), beamT(PAPER_LAYOUT.sections.experience.y + 30) + 0.3, 0, 1) * (1 - g);
  const cmd = `> resume.parse("suyash_kashyap.pdf")`;
  const nCmd = Math.round(tween(t, 0.05, 0.5, 0, cmd.length, lin));
  const cmdOut = tween(t, 2.4, 2.62, 0, 1, easeInOut);
  const sub =
    t < 0.75 ? "  ↳ reading 1 page" : t < FOUND_AT ? "  ↳ extracting fields…" : t < RESCAN[0] ? "  ↳ found: where_ive_worked" : "  ↳ searching for everything else…";
  return (
    <AbsoluteFill style={{ background: theme.bg, overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `scale(${1 + t * 0.01 + ramp * 0.15})` }}>
        <GridBg opacity={0.13} speed={1.2} horizon={1180} />
        <FloatingCode count={22} opacity={0.09} seed="rs" speed={1.3} />
        <Particles count={45} opacity={0.3} seed="rsp" />
      </AbsoluteFill>
      <AbsoluteFill style={{ transform: `translate(${shx}px, ${shy}px) rotate(${shr}deg) scale(${cam})` }}>
        {/* terminal line */}
        <div
          style={{
            position: "absolute",
            left: 70,
            top: 118,
            fontFamily: theme.mono,
            whiteSpace: "pre",
            opacity: 1 - cmdOut,
            transform: `translateY(${-cmdOut * 40}px)`,
          }}
        >
          <div style={{ fontSize: 31, color: theme.fg }}>
            <span style={{ color: CYAN }}>{cmd.slice(0, Math.min(2, nCmd))}</span>
            {cmd.slice(2, nCmd)}
            {Math.floor(t * 3) % 2 === 0 && <span style={{ display: "inline-block", width: 16, height: 32, background: theme.fg, verticalAlign: -5, marginLeft: 4 }} />}
          </div>
          <div style={{ fontSize: 23, color: t >= RESCAN[0] ? theme.red : theme.dim, marginTop: 10, letterSpacing: "0.02em" }}>{t >= 0.5 ? sub : ""}</div>
        </div>
        {/* the page */}
        <div
          style={{
            position: "absolute",
            left: pose.cx - PAPER_W / 2,
            top: pose.cy - PAPER_H / 2,
            width: PAPER_W,
            height: PAPER_H,
            transform: `perspective(2000px) rotateX(${pose.rx}deg) rotateY(${pose.ry}deg) rotateZ(${pose.rz}deg) scale(${pose.s})`,
            opacity: blow > 0 ? 0 : 1,
          }}
        >
          <div style={{ filter: `brightness(${bright})` }}>
            <Paper focus="experience" focusAmount={focus} />
          </div>
          <PaperFx t={t} />
        </div>
        <AsciiPaper pose={pose} dissolve={dissolve} blow={blow} />
        <JsonPanel t={t} f={f} />
        <FlyBars t={t} pose={pose} />
        <ImpactFx t={t} />
        <SlamLayer t={t} f={f} />
        <Meter t={t} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
