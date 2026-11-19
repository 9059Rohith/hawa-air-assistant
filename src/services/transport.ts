import { z } from "zod";
import { createHash } from "node:crypto";
import { AppError } from "@/lib/errors";
import { MemoryRateLimiter } from "./rate-limit";
import { env } from "@/config/env";
const limiter = new MemoryRateLimiter(env().RATE_LIMIT_PER_MIN);
export function rateLimit(key: string, now = Date.now()) {
  limiter.consume(createHash("sha256").update(key).digest("hex"), now);
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
    request.headers.get("cf-connecting-ip") ??
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "local",
  );
  const reader = request.body?.getReader();
  if (!reader) throw new AppError("BODY", 400, "Request body is required.");
  let size = 0;
  const chunks: Uint8Array[] = [];
  const deadline = AbortSignal.any([request.signal, AbortSignal.timeout(5000)]);
  if (deadline.aborted) {
    void reader.cancel().catch(() => {});
    reader.releaseLock();
    throw new AppError("BODY_TIMEOUT", 408, "Request body timed out.");
  }
  let abortRead: () => void = () => {};
  const timeout = new Promise<never>((_, reject) => {
    abortRead = () => {
      reject(new AppError("BODY_TIMEOUT", 408, "Request body timed out."));
      void reader.cancel().catch(() => {});
    };
    deadline.addEventListener("abort", abortRead, { once: true });
  });
  try {
    while (true) {
      const { done, value } = await Promise.race([reader.read(), timeout]);
      if (done) break;
      size += value.byteLength;
      if (size > 8192)
        throw new AppError("BODY_SIZE", 413, "Request exceeds 8 KB.");
      chunks.push(value);
    }
  } finally {
    deadline.removeEventListener("abort", abortRead);
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
