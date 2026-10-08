import { CODE_FILES } from "../../../generated/code";
import { C } from "../../kit/util";

// Video 1's code look (src/components/Code.tsx) in v4's palette: greys and white only, red is
// reserved for the agent (caret, typed-line bar).

const KEYWORDS = /^(const|let|export|import|from|return|type|as|true|false|null|new)$/;
const TOKEN = /(\/\/.*$|\/\*.*?\*\/)|("(?:[^"\\]|\\.)*")|(\b\d+(?:\.\d+)?\b)|([A-Za-z_$][\w$]*)|(\s+)|([^\sA-Za-z_$\d"]+)/g;

export const MonoCode: React.FC<{ text: string; upTo?: number }> = ({ text, upTo }) => {
  const parts: React.ReactNode[] = [];
  let m: RegExpExecArray | null;
  let used = 0;
  let i = 0;
  const limit = upTo ?? Infinity;
  TOKEN.lastIndex = 0;
  while ((m = TOKEN.exec(text)) && used < limit) {
    const [s0, comment, str, num, word] = m;
    const s = s0.slice(0, Math.max(0, limit - used));
    used += s0.length;
    let color = "#a9a9a9";
    let fontStyle: "italic" | undefined;
    if (comment) {
      color = "#5e5e5e";
      fontStyle = "italic";
    } else if (str) color = C.white;
    else if (num) color = C.white;
    else if (word && KEYWORDS.test(word)) color = "#6f6f6f";
    else if (word && /^[A-Z]/.test(word)) color = "#e6e6e6";
    else if (!word) color = "#6c6c6c";
    parts.push(
      <span key={i++} style={{ color, fontStyle }}>
        {s}
      </span>,
    );
    if (m[0].length === 0) TOKEN.lastIndex++;
  }
  return <span style={{ fontFamily: C.mono, whiteSpace: "pre" }}>{parts}</span>;
};

// The ad's own composition (src/v4/AdFrontier.tsx), from the code snapshot (scripts/snapshot-code.mjs).
// If the snapshot predates it, these are the same lines, copied from the file.
const FALLBACK_START = 29;
const FALLBACK = [
  "const SCENES: [SceneId, React.FC][] = [",
  '  ["hook", Hook],',
  '  ["one", One],',
  '  ["two", Two],',
  '  ["three", Three],',
  '  ["four", Four],',
  '  ["payoff", Payoff],',
  '  ["end", End],',
  "];",
  "/** Scenes that open on their own hit instead of arriving from depth. */",
  'const NO_ENTER: SceneId[] = ["hook", "end"];',
];

/** The SCENES block of AdFrontier.tsx: its lines, the real number of its first line, and which line is this scene. */
export const AD_CODE = (() => {
  const src = CODE_FILES.find((f) => f.name === "AdFrontier.tsx")?.text.split("\n") ?? [];
  const a = src.findIndex((l) => l.startsWith("const SCENES"));
  const b = src.findIndex((l) => l.startsWith("const NO_ENTER"));
  const lines = a >= 0 && b > a && b - a < 16 ? src.slice(a, b + 1) : FALLBACK;
  const first = a >= 0 && b > a && b - a < 16 ? a + 1 : FALLBACK_START;
  const self = lines.findIndex((l) => l.includes('["payoff", Payoff]'));
  return { lines, first, self: self >= 0 ? self : 6 };
})();
