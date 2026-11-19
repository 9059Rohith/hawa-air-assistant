/** Bounds a complete stream and releases its reader on every exit path. */
export class StreamLimitError extends Error {}

export async function readBoundedBytes(
  body: ReadableStream<Uint8Array>,
  signal: AbortSignal,
  maxBytes: number,
): Promise<Uint8Array> {
  const reader = body.getReader();
  const cancel = () => {
    void reader.cancel().catch(() => undefined);
  };
  signal.addEventListener("abort", cancel, { once: true });
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    signal.throwIfAborted();
    while (true) {
      const chunk = await reader.read();
      signal.throwIfAborted();
      if (chunk.done) break;
      size += chunk.value.byteLength;
      if (size > maxBytes)
        throw new StreamLimitError("Response exceeded its byte limit");
      chunks.push(chunk.value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return bytes;
  } finally {
    signal.removeEventListener("abort", cancel);
    cancel();
    reader.releaseLock();
  }
}

export async function readJsonResponse(
  response: Response,
  signal?: AbortSignal,
): Promise<unknown> {
  if (!response.body) throw new Error("Provider response body is missing");
  const deadline = AbortSignal.any([
    AbortSignal.timeout(8000),
    ...(signal ? [signal] : []),
  ]);
  const bytes = await readBoundedBytes(response.body, deadline, 262144);
  return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
}
