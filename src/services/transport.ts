import { z } from "zod";
import { createHash } from "node:crypto";
import { AppError } from "@/lib/errors";
const buckets = new Map<string, { at: number; count: number }>();
export function rateLimit(key: string, now = Date.now()) {
  const hash = createHash("sha256").update(key).digest("hex");
  for (const [k, v] of buckets) if (now - v.at >= 60000) buckets.delete(k);
  const value = buckets.get(hash) ?? { at: now, count: 0 };
  if (value.count >= 12 || (!buckets.has(hash) && buckets.size >= 5000))
    throw new AppError(
      "RATE_LIMIT",
      429,
      "Please wait a minute before trying again.",
    );
  value.count++;
  buckets.set(hash, value);
}
export async function readBody<T>(
  request: Request,
  schema: z.ZodType<T>,
): Promise<T> {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin)
    throw new AppError("ORIGIN", 403, "Cross-site requests are not accepted.");
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    throw new AppError("CONTENT_TYPE", 415, "Send JSON content.");
  rateLimit(
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local",
  );
  const reader = request.body?.getReader();
  if (!reader) throw new AppError("BODY", 400, "Request body is required.");
  let size = 0;
  const chunks: Uint8Array[] = [];
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 8192)
        throw new AppError("BODY_SIZE", 413, "Request exceeds 8 KB.");
      chunks.push(value);
    }
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
  try {
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return schema.parse(JSON.parse(new TextDecoder().decode(bytes)));
  } catch {
    throw new AppError("VALIDATION", 400, "Check your inputs and try again.");
  }
}
