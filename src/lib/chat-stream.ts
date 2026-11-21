export type ChatMode = "llm" | "rules" | "urgent";
export type ChatEvent = { mode: ChatMode } | { text: string };
const MAX_EVENT_CHARACTERS = 4096;
const MAX_REPLY_CHARACTERS = 8000;
const MAX_STREAM_BYTES = 32768;

/** Validate the wire protocol instead of trusting a JSON type assertion. */
export function parseChatEvent(event: string): ChatEvent | "done" | null {
  const lines = event.split(/\r?\n/).filter((line) => line.startsWith("data:"));
  if (!lines.length) return null; // SSE comments/keep-alives carry no answer.
  const raw = lines.map((line) => line.slice(5).trimStart()).join("\n");
  if (raw === "[DONE]") return "done";
  const value: unknown = JSON.parse(raw);
  if (!value || typeof value !== "object" || Object.keys(value).length !== 1)
    throw new Error("Invalid chat event");
  if (
    "mode" in value &&
    (value.mode === "llm" || value.mode === "rules" || value.mode === "urgent")
  )
    return { mode: value.mode };
  if ("text" in value && typeof value.text === "string")
    return { text: value.text };
  throw new Error("Invalid chat event");
}

class ChatDecoder {
  private buffer = "";
  private replyLength = 0;
  private modeSeen = false;
  completed = false;
  constructor(private onEvent: (event: ChatEvent) => void) {}

  push(text: string) {
    this.buffer += text;
    let boundary: RegExpExecArray | null;
    while (!this.completed && (boundary = /\r?\n\r?\n/.exec(this.buffer))) {
      const event = this.buffer.slice(0, boundary.index);
      this.buffer = this.buffer.slice(boundary.index + boundary[0].length);
      if (event.length > MAX_EVENT_CHARACTERS)
        throw new Error("Chat event is too large");
      this.accept(parseChatEvent(event));
    }
    if (this.buffer.length > MAX_EVENT_CHARACTERS)
      throw new Error("Chat event is too large");
  }

  private accept(event: ChatEvent | "done" | null) {
    if (!event) return;
    if (event === "done") {
      this.completed = true;
      return;
    }
    if ("mode" in event) {
      if (this.modeSeen) throw new Error("Duplicate chat mode");
      this.modeSeen = true;
    } else {
      if (!this.modeSeen) throw new Error("Chat mode must precede text");
      this.replyLength += event.text.length;
    }
    if (this.replyLength > MAX_REPLY_CHARACTERS)
      throw new Error("Chat answer is too large");
    this.onEvent(event);
  }

  finish() {
    if (!this.completed || !this.replyLength)
      throw new Error("Chat answer was incomplete");
  }
}

/** Handles split UTF-8, CRLF, cancellation and bounded partial events. */
export async function consumeChatStream(
  body: ReadableStream<Uint8Array>,
  signal: AbortSignal,
  onEvent: (event: ChatEvent) => void,
) {
  const reader = body.getReader();
  const decoder = new TextDecoder("utf-8", { fatal: true });
  const parser = new ChatDecoder(onEvent);
  const cancel = () => {
    void reader.cancel().catch(() => undefined);
  };
  signal.addEventListener("abort", cancel, { once: true });
  let bytes = 0;
  try {
    signal.throwIfAborted();
    while (!parser.completed) {
      const chunk = await reader.read();
      signal.throwIfAborted();
      if (chunk.done) break;
      bytes += chunk.value.byteLength;
      if (bytes > MAX_STREAM_BYTES)
        throw new Error("Chat response is too large");
      parser.push(decoder.decode(chunk.value, { stream: true }));
    }
    parser.push(decoder.decode());
    parser.finish();
  } finally {
    signal.removeEventListener("abort", cancel);
    cancel();
    reader.releaseLock();
  }
}
