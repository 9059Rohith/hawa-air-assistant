// @vitest-environment node
import { afterEach, expect, it, vi } from "vitest";
import { requestChat, type ChatHistoryEntry } from "@/lib/chat-client";
import { baseProfile, cities } from "@/data/personas";
import { manualAir } from "@/services/air";
import { localPlan } from "@/lib/rules-plan";

const plan = localPlan(baseProfile, cities.Delhi, manualAir(120));
const input = {
  plan,
  profile: baseProfile,
  message: "mask fitting",
  messages: [],
};
const wire =
  'data: {"mode":"rules"}\n\ndata: {"text":"Cited answer [kb:mask]"}\n\ndata: [DONE]\n\n';
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
it("sends bounded history and plan context with current language preferences", async () => {
  const network = vi.fn<(url: string, init: RequestInit) => Promise<Response>>(
    async () =>
      new Response(wire, {
        headers: { "Content-Type": "Text/Event-Stream; charset=utf-8" },
      }),
  );
  vi.stubGlobal("fetch", network);
  const messages: ChatHistoryEntry[] = Array.from({ length: 8 }, (_, i) => ({
    role: i % 2 ? "assistant" : "user",
    content: String(i),
  }));
  const events = vi.fn();
  await requestChat(
    {
      ...input,
      profile: { ...baseProfile, lang: "hi", simple: true, budget: "free" },
      messages,
    },
    new AbortController().signal,
    events,
  );
  const body = JSON.parse(String(network.mock.calls[0]?.[1].body));
  expect(body).toMatchObject({
    profile: { ...plan.profile, lang: "hi", simple: true },
    location: plan.location,
    manualPm: 120,
    offline: false,
  });
  expect(body.messages.map((entry: ChatHistoryEntry) => entry.content)).toEqual(
    ["2", "3", "4", "5", "6", "7"],
  );
  expect(messages).toHaveLength(8);
  expect(events.mock.calls.map(([event]) => event)).toEqual([
    { mode: "rules" },
    { text: "Cited answer [kb:mask]" },
  ]);
});
it.each([null, "application/json", "text/event-streaming", "text/html"])(
  "cancels a successful response with invalid media type %s",
  async (media) => {
    const cancel = vi.fn(),
      events = vi.fn();
    const response = new Response(new ReadableStream({ cancel }), {
      headers: media ? { "Content-Type": media } : {},
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => response),
    );
    await expect(
      requestChat(input, new AbortController().signal, events),
    ).rejects.toThrow("invalid response");
    expect(cancel).toHaveBeenCalledOnce();
    expect(events).not.toHaveBeenCalled();
  },
);
it.each([429, 503])(
  "cancels an HTTP %i body without reading diagnostic text",
  async (status) => {
    const cancel = vi.fn();
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(new ReadableStream({ cancel }), {
            status,
            headers: { "Content-Type": "text/event-stream" },
          }),
      ),
    );
    await expect(
      requestChat(input, new AbortController().signal, vi.fn()),
    ).rejects.toThrow("invalid response");
    expect(cancel).toHaveBeenCalledOnce();
  },
);
it("rejects a successful response with no body", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(
      async () =>
        new Response(null, {
          headers: { "Content-Type": "text/event-stream" },
        }),
    ),
  );
  await expect(
    requestChat(input, new AbortController().signal, vi.fn()),
  ).rejects.toThrow("invalid response");
});
it("does not start work after cancellation", async () => {
  const network = vi.fn();
  vi.stubGlobal("fetch", network);
  await expect(
    requestChat(input, AbortSignal.abort(), vi.fn()),
  ).rejects.toThrow();
  expect(network).not.toHaveBeenCalled();
});
it("cancels a late response body when fetch does not honor the abort signal", async () => {
  const controller = new AbortController(),
    cancel = vi.fn(),
    events = vi.fn();
  let resolve!: (response: Response) => void;
  vi.stubGlobal(
    "fetch",
    vi.fn(
      () =>
        new Promise<Response>((yes) => {
          resolve = yes;
        }),
    ),
  );
  const pending = expect(
    requestChat(input, controller.signal, events),
  ).rejects.toThrow();
  controller.abort();
  resolve(
    new Response(new ReadableStream({ cancel }), {
      headers: { "Content-Type": "text/event-stream" },
    }),
  );
  await pending;
  expect(cancel).toHaveBeenCalledOnce();
  expect(events).not.toHaveBeenCalled();
});
it("bounds stalled headers with the same deadline as the response body", async () => {
  const deadline = new AbortController();
  vi.spyOn(AbortSignal, "timeout").mockReturnValue(deadline.signal);
  vi.stubGlobal(
    "fetch",
    vi.fn(
      (_url: string, init: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init.signal?.addEventListener(
            "abort",
            () => reject(init.signal?.reason),
            { once: true },
          );
        }),
    ),
  );
  const pending = expect(
    requestChat(input, new AbortController().signal, vi.fn()),
  ).rejects.toThrow();
  deadline.abort(new DOMException("Timed out", "TimeoutError"));
  await pending;
});
it("releases a stalled reader at the original request deadline", async () => {
  const deadline = new AbortController(),
    cancel = vi.fn();
  vi.spyOn(AbortSignal, "timeout").mockReturnValue(deadline.signal);
  vi.stubGlobal(
    "fetch",
    vi.fn(
      async () =>
        new Response(new ReadableStream({ cancel }), {
          headers: { "Content-Type": "text/event-stream" },
        }),
    ),
  );
  const pending = expect(
    requestChat(input, new AbortController().signal, vi.fn()),
  ).rejects.toThrow();
  await new Promise((resolve) => setTimeout(resolve, 0));
  deadline.abort();
  await pending;
  expect(cancel).toHaveBeenCalledOnce();
});
