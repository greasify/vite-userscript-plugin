export function sanitizeFileName(name: string): string {
  const sanitized = name
    // eslint-disable-next-line no-control-regex -- strip C0 controls from file names
    .replace(/[<>:"/\\|?*\u0000-\u001F]+/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return sanitized || "userscript";
}

export function toIdentifier(name: string): string {
  let id = name
    .replace(/[^\w$]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");

  if (/^\d/.test(id)) {
    id = `_${id}`;
  }

  return id || "userscript";
}
