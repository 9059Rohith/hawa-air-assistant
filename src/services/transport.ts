import { z } from "zod";
import { createHash } from "node:crypto";
import { AppError } from "@/lib/errors";
import { readBoundedBytes, StreamLimitError } from "@/lib/streams";
import { MemoryRateLimiter } from "./rate-limit";
import { env } from "@/config/env";
const limiter = new MemoryRateLimiter(env().RATE_LIMIT_PER_MIN);
export function rateLimit(key: string, now = Date.now()) {
  limiter.consume(createHash("sha256").update(key).digest("hex"), now);
}
function validateRequest(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin)
    throw new AppError("ORIGIN", 403, "Cross-site requests are not accepted.");
  const contentType = request.headers.get("content-type") ?? "";
  if (!/^application\/json(?:\s*;|\s*$)/i.test(contentType))
    throw new AppError("CONTENT_TYPE", 415, "Send JSON content.");
  rateLimit(
    request.headers.get("cf-connecting-ip") ??
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "local",
  );
}
async function requestBytes(request: Request) {
  if (!request.body)
    throw new AppError("BODY", 400, "Request body is required.");
  const deadline = AbortSignal.any([request.signal, AbortSignal.timeout(5000)]);
  try {
    return await readBoundedBytes(request.body, deadline, 8192);
  } catch (error) {
    if (deadline.aborted)
      throw new AppError("BODY_TIMEOUT", 408, "Request body timed out.");
    if (error instanceof StreamLimitError)
      throw new AppError("BODY_SIZE", 413, "Request exceeds 8 KB.");
    throw error;
  }
}
export async function readBody<T>(
  request: Request,
  schema: z.ZodType<T>,
): Promise<T> {
  validateRequest(request);
  const bytes = await requestBytes(request);
  try {
    return schema.parse(
      JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)),
    );
  } catch {
    throw new AppError("VALIDATION", 400, "Check your inputs and try again.");
  }
}
