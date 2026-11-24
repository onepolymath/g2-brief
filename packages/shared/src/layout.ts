/** Conservative wrap width for the Even G2 576px text container (proportional LVGL font). */
export const GLANCE_COLUMNS = 36;
export const GLANCE_BODY_LINES = 8;
export const CANVAS = { width: 576, height: 288 } as const;

export function wrapLine(text: string, columns = GLANCE_COLUMNS): string[] {
  const words = text.replace(/\s+/g, " ").trim().split(" ");
  if (words.length === 1 && words[0] === "") return [];
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const chunks = word.length <= columns ? [word] : chunk(word, columns);
    for (const piece of chunks) {
      const next = current ? `${current} ${piece}` : piece;
      if (next.length <= columns) {
        current = next;
      } else {
        if (current) lines.push(current);
        current = piece;
      }
    }
  }
  if (current) lines.push(current);
  return lines;
}

function chunk(word: string, columns: number): string[] {
  const parts: string[] = [];
  for (let i = 0; i < word.length; i += columns) {
    parts.push(word.slice(i, i + columns));
  }
  return parts;
}

export function fitLines(lines: string[], maxLines: number): string[] {
  if (lines.length <= maxLines) return lines;
  const kept = lines.slice(0, maxLines);
  const last = kept[maxLines - 1];
  kept[maxLines - 1] = last.length >= 3 ? `${last.slice(0, Math.max(0, columnsSafe(last) - 1))}…` : "…";
  return kept;
}

function columnsSafe(line: string): number {
  return line.length;
}

export function composeScreen(parts: { header?: string; body: string[]; footer?: string }): string {
  const lines = [
    ...(parts.header ? wrapLine(parts.header, GLANCE_COLUMNS) : []),
    ...parts.body,
    ...(parts.footer ? wrapLine(parts.footer, GLANCE_COLUMNS) : []),
  ];
  return lines.join("\n");
}

export function truncate(text: string, max: number): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, Math.max(0, max - 1))}…`;
}

export function kindLabel(kind: "dm" | "group" | "channel"): string {
  if (kind === "dm") return "dm";
  if (kind === "group") return "group";
  return "channel";
}
