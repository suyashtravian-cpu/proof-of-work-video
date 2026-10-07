import { useCurrentFrame } from "remotion";
import { tween } from "../../components/anim";
import { theme } from "../../theme";
import { CYAN } from "./geom";

// Each block is typed out when its beat starts. Every value here is on the site.
export const CODE: { at: number; file: string; lines: string[] }[] = [
  { at: 0.12, file: "build.sh", lines: ["$ mv resume.pdf /dev/null", "$ ship ./proof-of-work"] },
  { at: 0.95, file: "build.sh", lines: ["$ mv resume.pdf /dev/null", "$ ship ./proof-of-work", "→ pilotaccess.com/proofofwork  // live"] },
  { at: 1.75, file: "work.ts", lines: ["const live = [", '  "Biltib", "iCreateEpic", "Moolank 365",', "]; // 3 live builds"] },
  {
    at: 3.2,
    file: "lab.ts",
    lines: ['const lab = ["The Whole Truth", "Fix My Curls",', '  "The Pant Project", "DrinkPrime"]; // 4', "// self-initiated concepts, not client work"],
  },
  {
    at: 5.25,
    file: "archive.ts",
    lines: [
      'const archive = ["Atlas AI", "Lexis", "Open Interest",',
      '  "Moolank 365", "Homeward", "Words for Love",',
      '  "Time Machine Love Letter", "Eyeline",',
      '  "Rank Please", "Somewhere, a Word"]; // 10',
    ],
  },
  { at: 7.25, file: "signals.ts", lines: ["meta.moolank365 = {", '  spend: "₹440.12", window: "1–4 Oct 2026",', "  events: 112, // reading-reveal", "};"] },
  { at: 9.85, file: "signals.ts", lines: ["reddit.iCreateEpic = {", '  spend: "$59.17",', "  clicks: 1999, // ≈ $0.03 per click", "};"] },
];

const TOKEN = /(\/\/.*$)|("[^"]*")|(\b(?:const|let|return)\b|^\$|→)|(\b\d[\d.,]*\b)|([^"/\d$→]+|.)/g;

const colorFor = (m: RegExpExecArray) => {
  if (m[1]) return theme.dim;
  if (m[2]) return "#e6e4dc";
  if (m[3]) return theme.red;
  if (m[4]) return CYAN;
  return "#a9a8a2";
};

/** A small editor pane under the captions with the beat's facts typed as code. */
export const CodePanel: React.FC<{ top?: number }> = ({ top = 1648 }) => {
  const f = useCurrentFrame();
  const t = f / 30;
  const bi = CODE.reduce((acc, b, i) => (t >= b.at ? i : acc), -1);
  if (bi < 0) return null;
  const block = CODE[bi];
  const prev = bi > 0 ? CODE[bi - 1] : null;
  // keep already-typed prefix when a block extends the previous one
  const shared = prev && block.lines.join("\n").startsWith(prev.lines.join("\n")) ? prev.lines.join("\n").length : 0;
  const typed = shared + Math.floor((t - block.at) * 120);
  const fade = tween(t, 12.95, 13.1, 1, 0);
  let budget = typed;
  const shows = block.lines.map((ln) => {
    const s = Math.max(0, Math.min(ln.length, budget));
    budget -= ln.length + 1;
    return s;
  });
  const typing = shows.findIndex((s, i) => s < block.lines[i].length);
  const cursorLine = typing === -1 ? block.lines.length - 1 : typing;
  return (
    <div style={{ position: "absolute", left: 70, top, width: 940, opacity: 0.92 * fade, fontFamily: theme.mono }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 15, letterSpacing: "0.12em", color: theme.dim, marginBottom: 8 }}>
        <span style={{ width: 8, height: 8, borderRadius: 4, background: CYAN }} />
        {block.file.toUpperCase()}
        <span style={{ flex: 1, height: 1, background: "#ffffff22" }} />
        <span>{`LN ${block.lines.length} · UTF-8 · TSX`}</span>
      </div>
      {block.lines.map((ln, li) => {
        const show = shows[li];
        const vis = ln.slice(0, show);
        const spans: React.ReactNode[] = [];
        TOKEN.lastIndex = 0;
        let m: RegExpExecArray | null;
        let j = 0;
        while ((m = TOKEN.exec(vis)) && m[0].length) {
          spans.push(
            <span key={j++} style={{ color: colorFor(m) }}>
              {m[0]}
            </span>,
          );
        }
        const cursor = li === cursorLine;
        return (
          <div key={li} style={{ display: "flex", fontSize: 21, lineHeight: "29px", whiteSpace: "pre" }}>
            <span style={{ width: 34, color: "#ffffff38", flex: "none" }}>{li + 1}</span>
            <span>
              {spans}
              {cursor && <span style={{ display: "inline-block", width: 12, height: 22, marginLeft: 2, verticalAlign: "-4px", background: CYAN, opacity: Math.floor(f / 8) % 2 ? 0.25 : 0.9 }} />}
            </span>
          </div>
        );
      })}
    </div>
  );
};
