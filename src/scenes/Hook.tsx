import { AbsoluteFill, useCurrentFrame } from "remotion";
import { easeExpo, easeInOut, easeOut, tween } from "../components/anim";
import { Paper, PAPER_H, PAPER_W } from "../components/Paper";
import { theme } from "../theme";

const ROLES = ["Growth Marketer", "AI Product Generalist", "Performance Marketing Associate", "Brand & Content Lead"];
const FORM_AT = [2.25, 2.7, 3.15, 3.6];

const Field: React.FC<{ label: string; w?: string }> = ({ label, w = "100%" }) => (
  <div style={{ marginTop: 22, width: w }}>
    <div style={{ fontFamily: theme.sans, fontWeight: 500, fontSize: 22, color: "#55544f" }}>{label}</div>
    <div style={{ marginTop: 8, height: 54, borderRadius: 10, border: "2px solid #dddbd4", background: "#fafaf8" }} />
  </div>
);

const Form: React.FC<{ role: string; active: boolean; t: number }> = ({ role, active, t }) => {
  const drop = active ? tween(t, 4.45, 4.8, 0, 1, easeExpo) : 0;
  const progress = active ? tween(t, 4.8, 5.45, 0, 1, easeInOut) : 0;
  const done = progress >= 1;
  return (
    <div style={{ width: 880, background: "#fff", borderRadius: 26, padding: "44px 48px", boxSizing: "border-box", boxShadow: "0 40px 90px rgba(0,0,0,.55)" }}>
      <div style={{ fontFamily: theme.mono, fontSize: 18, letterSpacing: "0.12em", color: "#8a8983" }}>JOB APPLICATION</div>
      <div style={{ fontFamily: theme.sans, fontWeight: 800, fontSize: 46, letterSpacing: "-0.04em", color: theme.ink, marginTop: 8 }}>{role}</div>
      <div style={{ display: "flex", gap: 20 }}>
        <Field label="Full name" w="50%" />
        <Field label="Email" w="50%" />
      </div>
      <div style={{ marginTop: 26, fontFamily: theme.sans, fontWeight: 700, fontSize: 24, color: theme.ink }}>
        Upload your résumé <span style={{ color: theme.red }}>*</span>
      </div>
      <div
        style={{
          marginTop: 10,
          height: 170,
          borderRadius: 16,
          border: `3px dashed ${active && t > 4.4 ? "#1d1d1d" : "#c4c2bb"}`,
          background: active && t > 4.4 ? "#f1f0ec" : "#fafaf8",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        {drop === 0 ? (
          <div style={{ fontFamily: theme.sans, fontWeight: 500, fontSize: 24, color: "#8a8983" }}>↑ Drag & drop or browse · PDF only</div>
        ) : (
          <div style={{ width: "86%", transform: `translateY(${(1 - drop) * -160}px) scale(${0.9 + drop * 0.1})`, opacity: drop }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ width: 52, height: 64, borderRadius: 6, background: theme.red, color: "#fff", fontFamily: theme.mono, fontSize: 15, display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: 8, boxSizing: "border-box" }}>PDF</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: theme.sans, fontWeight: 700, fontSize: 26, color: theme.ink }}>resume_final_v7.pdf {done ? "✓" : ""}</div>
                <div style={{ marginTop: 10, height: 10, borderRadius: 5, background: "#dddbd4", overflow: "hidden" }}>
                  <div style={{ width: `${progress * 100}%`, height: "100%", background: "#1d1d1d" }} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <div style={{ marginTop: 28, height: 66, borderRadius: 33, background: "#1d1d1d", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: theme.sans, fontWeight: 700, fontSize: 26 }}>
        Submit application
      </div>
    </div>
  );
};

// 0.0–6.0  "I stopped sending résumés. Every application asks for the same thing. Upload your résumé."
export const Hook: React.FC = () => {
  const t = useCurrentFrame() / 30;
  const paperIn = tween(t, 0, 0.55, 0, 1, easeExpo);
  const strike = tween(t, 0.85, 1.15, 0, 1, easeOut);
  const paperOut = tween(t, 2.0, 2.35, 0, 1, easeInOut);
  const pushIn = tween(t, 5.55, 6.0, 0, 1, (k) => k * k * k);
  return (
    <AbsoluteFill style={{ background: theme.bg }}>
      {paperOut < 1 && (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: 1 - paperOut }}>
          <div style={{ position: "absolute", top: 260, fontFamily: theme.mono, fontSize: 26, color: theme.dim, opacity: paperIn }}>resume_final_v7.pdf</div>
          <div
            style={{
              position: "relative",
              transform: `translateY(${-80 + (1 - paperIn) * 90 + paperOut * 260}px) perspective(2200px) rotateX(${8 + (1 - paperIn) * 18}deg) rotateY(-10deg) rotateZ(${strike * -3}deg) scale(${(1.08 - paperIn * 0.08) * (1 - paperOut * 0.5)})`,
              filter: `brightness(${1 - strike * 0.35})`,
            }}
          >
            <Paper />
            <svg width={PAPER_W} height={PAPER_H} style={{ position: "absolute", inset: 0 }}>
              <line x1={40} y1={PAPER_H - 60} x2={40 + (PAPER_W - 80) * strike} y2={PAPER_H - 60 - (PAPER_H - 120) * strike} stroke={theme.red} strokeWidth={22} strokeLinecap="round" />
            </svg>
          </div>
        </AbsoluteFill>
      )}
      <AbsoluteFill style={{ transform: `scale(${1 + pushIn * 1.6})`, transformOrigin: "50% 47%", opacity: 1 - pushIn }}>
        {FORM_AT.map((at, i) => {
          if (t < at) return null;
          const k = tween(t, at, at + 0.35, 0, 1, easeExpo);
          const depth = FORM_AT.filter((a) => t >= a).length - 1 - i;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: "50%",
                top: 330 - depth * 46,
                transform: `translateX(-50%) translateY(${(1 - k) * 900}px) scale(${1 - depth * 0.06}) rotate(${(i % 2 ? 1 : -1) * (1 - k) * 6}deg)`,
                filter: `brightness(${1 - depth * 0.22})`,
              }}
            >
              <Form role={ROLES[i]} active={i === FORM_AT.length - 1} t={t} />
            </div>
          );
        })}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
