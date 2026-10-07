import { theme } from "../theme";

const KEYWORDS = /^(const|let|export|import|from|return|await|async|function|if|for|of|new|type|default|true|false|null)$/;
const TOKEN = /(\/\/.*$)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)|(\b\d+(?:\.\d+)?\b)|(<\/?[A-Z][A-Za-z]*)|([A-Za-z_$][\w$]*)|(\s+)|([^\sA-Za-z_$\d"'`/]+|\/)/g;

// Tiny syntax highlighter: enough to read as real code on screen.
export const CodeLine: React.FC<{ text: string }> = ({ text }) => {
  const parts: React.ReactNode[] = [];
  let m: RegExpExecArray | null;
  let i = 0;
  TOKEN.lastIndex = 0;
  while ((m = TOKEN.exec(text))) {
    const [s, comment, str, num, tag, word] = m;
    let color = "#d6d5cf";
    if (comment) color = "#6a6a64";
    else if (str) color = "#c3e88d";
    else if (num) color = "#f78c6c";
    else if (tag) color = "#ff8f7a";
    else if (word && KEYWORDS.test(word)) color = "#c792ea";
    else if (word && /^[A-Z]/.test(word)) color = "#ffcb6b";
    parts.push(
      <span key={i++} style={{ color }}>
        {s}
      </span>,
    );
    if (m[0].length === 0) TOKEN.lastIndex++;
  }
  return <span style={{ fontFamily: theme.mono, whiteSpace: "pre" }}>{parts}</span>;
};
