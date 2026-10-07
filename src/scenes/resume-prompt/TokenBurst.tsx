import { Easing, random } from "remotion";
import { CODE_FILES } from "../../generated/code";
import { theme } from "../../theme";

const CYAN = "#33e1ff";
const LOG = [
  "plan → proof-of-work site",
  "scaffold app/ components/ lib/",
  "write Hero.tsx",
  "/work → 3 live builds",
  "/lab → 4 brand concepts",
  "/archive → 10 experiments",
  "signals → reddit + meta ads",
  "deploy pilotaccess.com/proofofwork",
  "✓ build passed",
];
const CODE = CODE_FILES.flatMap((f) => f.text.split("\n"))
  .map((l) => l.trim())
  .filter((l) => l.length > 18 && l.length < 60);

const N = 38;
const ITEMS = Array.from({ length: N }, (_, i) => {
  const isLog = i % 3 !== 2;
  const text = isLog ? LOG[Math.floor(i / 3 + (i % 3)) % LOG.length] : CODE[Math.floor(random(`tbc${i}`) * CODE.length)];
  const ang = random(`tba${i}`) * Math.PI * 2;
  const rad = 90 + random(`tbr${i}`) * 470;
  return {
    text: isLog ? `▸ ${text}` : text,
    isLog,
    x: Math.cos(ang) * rad * 1.1,
    y: Math.sin(ang) * rad * 1.55,
    delay: (i / N) * 0.16,
    life: 0.15 + random(`tbl${i}`) * 0.08,
  };
});

/** After send: agent-log lines and code tokens stream out of the vanishing point and rush past the camera. */
export const TokenBurst: React.FC<{ t: number; at: number }> = ({ t, at }) => {
  if (t < at) return null;
  const e = Math.min(1, (t - at) / 0.22);
  const streak = Easing.in(Easing.quad)(e);
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        {Array.from({ length: 56 }, (_, i) => {
          const a = random(`ws${i}`) * Math.PI * 2;
          const r1 = (0.08 + random(`wr${i}`) * 0.4 + streak * 1.2) * 900;
          const r2 = r1 + 40 + streak * 520 * (0.5 + random(`wl${i}`));
          return (
            <line
              key={i}
              x1={540 + Math.cos(a) * r1}
              y1={960 + Math.sin(a) * r1 * 1.4}
              x2={540 + Math.cos(a) * r2}
              y2={960 + Math.sin(a) * r2 * 1.4}
              stroke={i % 4 === 0 ? CYAN : "#ffffff"}
              strokeWidth={i % 5 === 0 ? 4 : 2}
              opacity={0.55 * Math.min(1, e * 4)}
            />
          );
        })}
      </svg>
      <div style={{ position: "absolute", inset: 0, perspective: 1000, perspectiveOrigin: "540px 960px" }}>
        {ITEMS.map((it, i) => {
          const p = (t - at - it.delay) / it.life;
          if (p < 0 || p > 1) return null;
          const z = -1500 + p * 2300;
          const alpha = Math.min(1, p * 6) * (1 - Math.max(0, (p - 0.85) / 0.15));
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: 540,
                top: 960,
                transform: `translate(-50%, -50%) translate3d(${it.x}px, ${it.y}px, ${z}px)`,
                fontFamily: theme.mono,
                fontSize: it.isLog ? 42 : 32,
                whiteSpace: "pre",
                color: it.isLog ? (i % 4 === 0 ? CYAN : theme.fg) : "#9a9992",
                background: it.isLog ? "rgba(20,20,20,0.85)" : "transparent",
                border: it.isLog ? `1.5px solid ${i % 4 === 0 ? CYAN + "88" : "#ffffff30"}` : "none",
                padding: it.isLog ? "6px 14px" : 0,
                borderRadius: 8,
                opacity: alpha,
              }}
            >
              {it.text}
            </div>
          );
        })}
      </div>
    </div>
  );
};
