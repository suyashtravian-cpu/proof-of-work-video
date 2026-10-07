import { theme } from "../theme";

const KEYWORDS = /^(const|let|export|import|from|return|await|async|function|if|for|of|new|type|default|true|false|null|as)$/;
const TOKEN = /(\/\/.*$)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)|(\b\d+(?:\.\d+)?\b)|(<\/?[A-Z][A-Za-z]*)|([A-Za-z_$][\w$]*)|(\s+)|([^\sA-Za-z_$\d"'`/]+|\/)/g;

export const CODE_COLORS = {
  text: "#d6d5cf",
  comment: "#6a6a64",
  string: "#c3e88d",
  number: "#f78c6c",
  tag: "#ff8f7a",
  keyword: "#c792ea",
  type: "#ffcb6b",
};

/**
 * Tiny syntax highlighter: enough to read as real code on screen.
 * `upTo` reveals only the first N characters (for a live typing cursor).
 */
export const CodeLine: React.FC<{ text: string; upTo?: number; style?: React.CSSProperties }> = ({ text, upTo, style }) => {
  const parts: React.ReactNode[] = [];
  let m: RegExpExecArray | null;
  let i = 0;
  let used = 0;
  const limit = upTo ?? Infinity;
  TOKEN.lastIndex = 0;
  while ((m = TOKEN.exec(text)) && used < limit) {
    const [s0, comment, str, num, tag, word] = m;
    const s = s0.slice(0, Math.max(0, limit - used));
    used += s0.length;
    let color = CODE_COLORS.text;
    if (comment) color = CODE_COLORS.comment;
    else if (str) color = CODE_COLORS.string;
    else if (num) color = CODE_COLORS.number;
    else if (tag) color = CODE_COLORS.tag;
    else if (word && KEYWORDS.test(word)) color = CODE_COLORS.keyword;
    else if (word && /^[A-Z]/.test(word)) color = CODE_COLORS.type;
    parts.push(
      <span key={i++} style={{ color }}>
        {s}
      </span>,
    );
    if (m[0].length === 0) TOKEN.lastIndex++;
  }
  return <span style={{ fontFamily: theme.mono, whiteSpace: "pre", ...style }}>{parts}</span>;
};
