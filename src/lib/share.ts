import { z } from "zod";
import { knowledge } from "@/data/knowledge";

const knownIds = new Set(knowledge.map((action) => action.id));
const payloadSchema = z
  .object({
    v: z.literal(1),
    lang: z.enum(["en", "hi"]),
    ids: z
      .array(z.string().min(1).max(80))
      .min(1)
      .max(10)
      .refine(
        (ids) => ids.every((id) => knownIds.has(id)),
        "Choose curated actions",
      ),
  })
  .strict();

/** The producer and consumer enforce the same bounded, privacy-only contract. */
export function shareFragment(ids: readonly string[], lang: "en" | "hi") {
  const payload = payloadSchema.parse({ v: 1, lang, ids });
  return `#kit=${encodeURIComponent(JSON.stringify({ ...payload, ids: [...new Set(payload.ids)] }))}`;
}
export function readSharedKit(hash: string, allowed: readonly string[]) {
  try {
    if (!hash.startsWith("#kit=") || hash.length > 2000) return null;
    const payload = payloadSchema.parse(
      JSON.parse(decodeURIComponent(hash.slice(5))),
    );
    if (payload.ids.some((id) => !allowed.includes(id))) return null;
    return {
      lang: payload.lang,
      ids: [...new Set(payload.ids)],
    };
  } catch {
    return null;
  }
}
