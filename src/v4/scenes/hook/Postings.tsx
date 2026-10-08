import { random } from "remotion";
import { C } from "../../kit/util";
import { apply, FH, FW, type Affine } from "./wall";

// One job posting on the wall, card-local px (560 × 630), drawn at three levels of detail.

const abs = (x: number, y: number, w: number, h: number, extra: React.CSSProperties = {}): React.CSSProperties => ({
  position: "absolute",
  left: x,
  top: y,
  width: w,
  height: h,
  boxSizing: "border-box",
  ...extra,
});

export type PostState = { lit: number; pulse: number };

const REQS = ["3+ years experience", "Full-time · on-site", "Portfolio required"];

const Full: React.FC<{ role: string; s: PostState }> = ({ role, s }) => {
  const hot = s.lit > 0.5 || s.pulse > 0.4;
  const size = Math.min(50, 470 / (role.length * 0.56));
  return (
    <>
      <div style={abs(40, 34, 480, 20, { fontFamily: C.mono, fontSize: 15, letterSpacing: "0.14em", color: "#8a8983" })}>JOB POSTING · FULL-TIME</div>
      <div style={abs(40, 66, 480, 34, { fontFamily: C.sans, fontWeight: 700, fontSize: 28, color: "#6b6a65" })}>Hiring:</div>
      <div style={abs(40, 100, 480, 64, { fontFamily: C.sans, fontWeight: 800, fontSize: size, lineHeight: "64px", letterSpacing: "-0.04em", whiteSpace: "nowrap", color: s.lit > 0.5 ? C.red : C.ink })}>{role}</div>
      {REQS.map((r, i) => (
        <div key={r} style={abs(40, 196 + i * 46, 480, 30, { display: "flex", alignItems: "center", gap: 14, fontFamily: C.sans, fontWeight: 500, fontSize: 22, color: "#55544f" })}>
          <span style={{ width: 9, height: 9, borderRadius: 5, background: "#b9b7b0" }} />
          {r}
        </div>
      ))}
      <div style={abs(40, 360, 230, 86, { borderRadius: 12, border: "2px solid #dddbd4", padding: "12px 16px", fontFamily: C.mono, fontSize: 14, letterSpacing: "0.1em", color: "#8a8983" })}>
        SALARY
        <div style={{ height: 14, width: 150, borderRadius: 4, background: "#cfcdc6", marginTop: 12 }} />
      </div>
      <div style={abs(290, 360, 230, 86, { borderRadius: 12, border: "2px solid #dddbd4", padding: "12px 16px", fontFamily: C.mono, fontSize: 14, letterSpacing: "0.1em", color: "#8a8983" })}>
        START
        <div style={{ fontFamily: C.sans, fontWeight: 700, fontSize: 24, letterSpacing: 0, color: C.ink, marginTop: 6 }}>ASAP</div>
      </div>
      <div
        style={abs(40, 486, 480, 58, {
          borderRadius: 29,
          background: hot ? C.red : "#1d1d1d",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: C.sans,
          fontWeight: 700,
          fontSize: 22,
        })}
      >
        Apply now
      </div>
      <div style={abs(40, 572, 480, 20, { fontFamily: C.mono, fontSize: 14, color: "#9a9993", letterSpacing: "0.04em" })}>Posted 2d ago · reposted</div>
    </>
  );
};

const Mid: React.FC<{ s: PostState; w: number }> = ({ s, w }) => {
  const hot = s.lit > 0.5 || s.pulse > 0.4;
  return (
    <>
      <div style={abs(40, 34, 200, 14, { background: "#cfcdc6", borderRadius: 4 })} />
      <div style={abs(40, 70, 130, 24, { background: "#9a9993", borderRadius: 5 })} />
      <div style={abs(40, 108, w, 46, { background: s.lit > 0.5 ? C.red : C.ink, borderRadius: 7 })} />
      {[0, 1, 2].map((i) => (
        <div key={i} style={abs(40, 200 + i * 46, 300 - i * 50, 16, { background: "#c4c2bb", borderRadius: 4 })} />
      ))}
      <div style={abs(40, 360, 230, 86, { borderRadius: 12, border: "5px solid #dddbd4" })} />
      <div style={abs(290, 360, 230, 86, { borderRadius: 12, border: "5px solid #dddbd4" })} />
      <div style={abs(40, 486, 480, 58, { borderRadius: 29, background: hot ? C.red : "#1d1d1d" })} />
    </>
  );
};

const Tiny: React.FC<{ s: PostState }> = ({ s }) => (
  <>
    <div style={abs(40, 90, 380, 70, { background: s.lit > 0.5 ? C.red : "#2a2a2a" })} />
    <div style={abs(40, 220, 300, 140, { background: "#d6d4cd" })} />
    <div style={abs(40, 470, 480, 80, { background: s.pulse > 0.3 ? C.red : "#1d1d1d" })} />
  </>
);

/** Post-transform an affine about point (px, py): scale s, rotate r (deg), then move by (dx, dy). */
const post = (m: Affine, px: number, py: number, s: number, r: number, dx: number, dy: number) => {
  const cr = Math.cos((r * Math.PI) / 180) * s;
  const sr = Math.sin((r * Math.PI) / 180) * s;
  const ex = m.e - px;
  const fy = m.f - py;
  return {
    a: cr * m.a - sr * m.b,
    b: sr * m.a + cr * m.b,
    c: cr * m.c - sr * m.d,
    d: sr * m.c + cr * m.d,
    e: cr * ex - sr * fy + px + dx,
    f: sr * ex + cr * fy + py + dy,
  };
};

export type Drawn = { id: number; role: string; m: Affine; s: PostState };

/** All postings. `suck` (0..1 per card) pulls each card into (tx, ty), shrinking and spinning it. */
export const Postings: React.FC<{ cards: Drawn[]; suck: (id: number, cx: number, cy: number) => number; tx: number; ty: number }> = ({ cards, suck, tx, ty }) => (
  <>
    {cards.map(({ id, role, m, s }) => {
      const c = apply(m, FW / 2, FH / 2);
      const k = suck(id, c.x, c.y);
      if (k >= 0.999) return null;
      const lift = 1 + 0.07 * s.pulse;
      const spin = (random(`spin${id}`) - 0.5) * 90 * k;
      const q = post(m, c.x, c.y, lift * (1 - 0.94 * k), spin, (tx - c.x) * k, (ty - c.y) * k);
      return (
        <div
          key={id}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: FW,
            height: FH,
            transformOrigin: "0 0",
            transform: `matrix(${q.a},${q.b},${q.c},${q.d},${q.e},${q.f})`,
            background: C.paper,
            borderRadius: m.w > 75 ? 22 : 0,
            boxShadow: s.lit > 0.5 ? `inset 0 0 0 ${m.w > 230 ? 6 : 16}px ${C.red}` : undefined,
            opacity: 1 - 0.5 * k,
          }}
        >
          {m.w > 230 ? <Full role={role} s={s} /> : m.w > 70 ? <Mid s={s} w={150 + Math.min(330, role.length * 19)} /> : <Tiny s={s} />}
        </div>
      );
    })}
  </>
);
