const HTML_ESCAPE_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;",
};

const ATTR_ESCAPE_MAP: Record<string, string> = {
  ...HTML_ESCAPE_MAP,
  "`": "&#x60;",
  "=": "&#x3D;",
};

export function escapeHtml(str: string): string {
  return str.replace(/[&<>"']/g, (ch) => HTML_ESCAPE_MAP[ch] ?? ch);
}

export function escapeAttr(str: string): string {
  return str.replace(/[&<>"'`=]/g, (ch) => ATTR_ESCAPE_MAP[ch] ?? ch);
}
