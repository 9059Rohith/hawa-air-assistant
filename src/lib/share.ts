/** Only curated IDs and language travel in the fragment; never profiles or coordinates. */
export function shareFragment(ids: string[], lang: "en" | "hi") {
  return `#kit=${encodeURIComponent(JSON.stringify({ v: 1, lang, ids: [...new Set(ids)].slice(0, 10) }))}`;
}
export function readSharedKit(hash: string, allowed: readonly string[]) {
  try {
    if (!hash.startsWith("#kit=") || hash.length > 2000) return null;
    const value: unknown = JSON.parse(decodeURIComponent(hash.slice(5)));
    if (!value || typeof value !== "object") return null;
    const x = value as { v?: unknown; lang?: unknown; ids?: unknown };
    if (
      x.v !== 1 ||
      (x.lang !== "en" && x.lang !== "hi") ||
      !Array.isArray(x.ids) ||
      !x.ids.length ||
      x.ids.length > 10 ||
      x.ids.some((id) => typeof id !== "string" || !allowed.includes(id))
    )
      return null;
    return {
      lang: x.lang as "en" | "hi",
      ids: [...new Set(x.ids as string[])],
    };
  } catch {
    return null;
  }
}
