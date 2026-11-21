// @vitest-environment node
import { expect, it, vi } from "vitest";
import {
  consumeChatStream,
  parseChatEvent,
  type ChatEvent,
} from "@/lib/chat-stream";
import {
  readBoundedBytes,
  readJsonResponse,
  StreamLimitError,
} from "@/lib/streams";
const encoder = new TextEncoder();
function stream(text: string, chunkSize = 4096) {
  const bytes = encoder.encode(text);
  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (let offset = 0; offset < bytes.length; offset += chunkSize)
        controller.enqueue(bytes.slice(offset, offset + chunkSize));
      controller.close();
    },
  });
}
const message =
  'data: {"mode":"llm"}\n\ndata: {"text":"मास्क 🌍"}\n\ndata: [DONE]\n\n';
it.each([1, 2, 3, 7, 64, 4096])(
  "decodes UTF-8 split across %i-byte chunks without losing text",
  async (size) => {
    const events: ChatEvent[] = [];
    await consumeChatStream(
      stream(message, size),
      new AbortController().signal,
      (event) => events.push(event),
    );
    expect(events).toEqual([{ mode: "llm" }, { text: "मास्क 🌍" }]);
  },
);
it("accepts CRLF split across arbitrary chunks and ignores keep-alives", async () => {
  const events: ChatEvent[] = [];
  await consumeChatStream(
    stream(": keep-alive\r\n\r\n" + message.replaceAll("\n", "\r\n"), 1),
    new AbortController().signal,
    (event) => events.push(event),
  );
  expect(events).toEqual([{ mode: "llm" }, { text: "मास्क 🌍" }]);
});
it("combines multiline SSE data before parsing JSON", () => {
  expect(parseChatEvent('data: {"text":\ndata: "hello"}')).toEqual({
    text: "hello",
  });
});
it.each([
  null,
  [],
  4,
  "hello",
  {},
  { text: 3 },
  { mode: "invented" },
  { text: "x", mode: "llm" },
  { text: "x", extra: true },
])("rejects invalid wire shape %#", (value) => {
  expect(() => parseChatEvent("data: " + JSON.stringify(value))).toThrow();
});
it.each(["llm", "rules", "urgent"])("accepts the declared %s mode", (mode) => {
  expect(parseChatEvent("data:" + JSON.stringify({ mode }))).toEqual({ mode });
});
it.each([
  [
    "missing completion",
    'data: {"mode":"llm"}\n\ndata: {"text":"partial"}\n\n',
  ],
  ["empty completion", "data: [DONE]\n\n"],
  ["unterminated event", 'data: {"text":"partial"}'],
  ["invalid JSON", "data: not-json\n\n"],
  ["oversized partial event", "data: " + "x".repeat(4097)],
  [
    "oversized full event",
    "data: " + JSON.stringify({ text: "x".repeat(4097) }) + "\n\n",
  ],
  [
    "oversized answer",
    'data: {"mode":"llm"}\n\n' +
      Array(4)
        .fill("data: " + JSON.stringify({ text: "x".repeat(3000) }) + "\n\n")
        .join("") +
      "data: [DONE]\n\n",
  ],
  ["oversized response", ":" + "x".repeat(32769)],
])("rejects %s and releases its reader", async (_name, text) => {
  const body = stream(text);
  await expect(
    consumeChatStream(body, new AbortController().signal, () => {}),
  ).rejects.toThrow();
  expect(body.locked).toBe(false);
});
it("stops reading after DONE even if the server keeps the connection open", async () => {
  const cancel = vi.fn();
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode(message));
    },
    cancel,
  });
  await consumeChatStream(body, new AbortController().signal, () => {});
  expect(cancel).toHaveBeenCalledTimes(1);
  expect(body.locked).toBe(false);
});
it("cancels a stalled chat stream when its deadline signal fires", async () => {
  const cancel = vi.fn(),
    controller = new AbortController();
  const body = new ReadableStream<Uint8Array>({ cancel });
  const promise = consumeChatStream(body, controller.signal, () => {});
  const assertion = expect(promise).rejects.toThrow();
  controller.abort();
  await assertion;
  expect(cancel).toHaveBeenCalledTimes(1);
  expect(body.locked).toBe(false);
});
it("rejects an already cancelled chat without publishing events", async () => {
  const events = vi.fn(),
    body = stream(message);
  await expect(
    consumeChatStream(body, AbortSignal.abort(), events),
  ).rejects.toThrow();
  expect(events).not.toHaveBeenCalled();
  expect(body.locked).toBe(false);
});
it("rejects invalid UTF-8 instead of rendering replacement characters", async () => {
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(new Uint8Array([0xff]));
      controller.close();
    },
  });
  await expect(
    consumeChatStream(body, new AbortController().signal, () => {}),
  ).rejects.toThrow();
});
it("bounded body reader accepts exactly its byte limit", async () => {
  expect(
    await readBoundedBytes(stream("hello", 1), new AbortController().signal, 5),
  ).toEqual(encoder.encode("hello"));
});
it("bounded body reader rejects even one byte beyond its limit", async () => {
  const body = stream("hello", 1);
  await expect(
    readBoundedBytes(body, new AbortController().signal, 4),
  ).rejects.toBeInstanceOf(StreamLimitError);
  expect(body.locked).toBe(false);
});
it("bounded body reader cancels a stalled stream", async () => {
  const controller = new AbortController(),
    cancel = vi.fn();
  const body = new ReadableStream<Uint8Array>({ cancel });
  const promise = readBoundedBytes(body, controller.signal, 8);
  const assertion = expect(promise).rejects.toThrow();
  controller.abort();
  await assertion;
  expect(cancel).toHaveBeenCalledTimes(1);
  expect(body.locked).toBe(false);
});
it("bounded body reader rejects prior cancellation and cleans up", async () => {
  const body = stream("hello");
  await expect(
    readBoundedBytes(body, AbortSignal.abort(), 8),
  ).rejects.toThrow();
  expect(body.locked).toBe(false);
});
it("provider reader parses JSON within the bound", async () => {
  expect(await readJsonResponse(Response.json({ ok: true }))).toEqual({
    ok: true,
  });
});
it("provider reader rejects a missing body", async () => {
  await expect(readJsonResponse(new Response(null))).rejects.toThrow("missing");
});
it("provider reader refuses oversized JSON", async () => {
  await expect(
    readJsonResponse(Response.json({ text: "x".repeat(262145) })),
  ).rejects.toBeInstanceOf(StreamLimitError);
});
it.each([
  ['data: {"text":"Unattributed"}\n\ndata: [DONE]\n\n', "must precede"],
  [
    'data: {"mode":"llm"}\n\ndata: {"mode":"rules"}\n\ndata: {"text":"Mixed"}\n\ndata: [DONE]\n\n',
    "Duplicate",
  ],
  [
    'data: {"mode":"llm"}\n\ndata: {"text":"Partial"}\n\ndata: {"mode":"rules"}\n\ndata: [DONE]\n\n',
    "Duplicate",
  ],
])(
  "rejects missing or contradictory response provenance %#",
  async (wire, error) => {
    const body = stream(wire, 3);
    await expect(
      consumeChatStream(body, new AbortController().signal, () => {}),
    ).rejects.toThrow(error);
    expect(body.locked).toBe(false);
  },
);
