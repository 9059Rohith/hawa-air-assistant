import React from "react";
import "@testing-library/jest-dom/vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import ChatPanel from "@/components/ChatPanel";
import { baseProfile, cities } from "@/data/personas";
import { localPlan } from "@/lib/rules-plan";
import { manualAir } from "@/services/air";
vi.mock("@/components/Provider", () => ({
  useHawa: () => ({
    profile: baseProfile,
    t: { ask: "Ask HAWA", stop: "Stop" },
    setNotice: vi.fn(),
  }),
}));
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
const plan = localPlan(baseProfile, cities.Delhi, manualAir(120));
function send(text: string) {
  fireEvent.change(screen.getByLabelText("Your question"), {
    target: { value: text },
  });
  fireEvent.click(screen.getByRole("button", { name: "Send" }));
}
function reply(text: string) {
  return new Response(
    `data: ${JSON.stringify({ mode: "llm" })}\n\ndata: ${JSON.stringify({ text })}\n\ndata: [DONE]\n\n`,
    { headers: { "Content-Type": "text/event-stream" } },
  );
}
it("shows urgent guidance immediately without waiting on an online provider", () => {
  const network = vi.fn();
  vi.stubGlobal("fetch", network);
  render(<ChatPanel plan={plan} offline={false} />);
  send("I have chest pain");
  expect(screen.getByRole("alert")).toHaveTextContent(
    "Seek urgent medical care now",
  );
  expect(network).not.toHaveBeenCalled();
});
it("recognizes a typographic apostrophe in urgent text", () => {
  const network = vi.fn();
  vi.stubGlobal("fetch", network);
  render(<ChatPanel plan={plan} offline={false} />);
  send("I can’t breathe");
  expect(screen.getByRole("alert")).toHaveTextContent(
    "Seek urgent medical care now",
  );
  expect(network).not.toHaveBeenCalled();
});
it("ignores a late fetch after stop and does not add it to conversation history", async () => {
  let resolveOld!: (r: Response) => void;
  const network = vi
    .fn()
    .mockImplementationOnce(
      () =>
        new Promise<Response>((r) => {
          resolveOld = r;
        }),
    )
    .mockResolvedValue(reply("Current answer"));
  vi.stubGlobal("fetch", network);
  render(<ChatPanel plan={plan} offline={false} />);
  send("old cooking question");
  fireEvent.click(screen.getByRole("button", { name: "Stop" }));
  send("new mask question");
  await screen.findByText("Current answer");
  await act(async () => {
    resolveOld(reply("Stale answer"));
  });
  expect(screen.queryByText("Stale answer")).not.toBeInTheDocument();
  expect(screen.getByText("Current answer")).toBeInTheDocument();
  network.mockResolvedValue(reply("Third answer"));
  send("third school question");
  await screen.findByText("Third answer");
  const body = JSON.parse(network.mock.calls[2]![1].body);
  expect(body.messages.map((m: { content: string }) => m.content)).toEqual([
    "new mask question",
    "Current answer",
  ]);
});
it("cancels a pending reader on Stop without waiting for the server to close", async () => {
  const cancel = vi.fn();
  let stream!: ReadableStreamDefaultController<Uint8Array>;
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(
      new Response(
        new ReadableStream({
          start(c) {
            stream = c;
          },
          cancel,
        }),
        { headers: { "Content-Type": "text/event-stream" } },
      ),
    ),
  );
  render(<ChatPanel plan={plan} offline={false} />);
  send("mask fitting");
  await act(async () => {
    stream.enqueue(
      new TextEncoder().encode(
        'data: {"mode":"llm"}\n\ndata: {"text":"Partial answer"}\n\n',
      ),
    );
  });
  await screen.findByText("Partial answer");
  fireEvent.click(screen.getByRole("button", { name: "Stop" }));
  await waitFor(() => expect(cancel).toHaveBeenCalledTimes(1));
  expect(screen.getByRole("button", { name: "Send" })).toBeEnabled();
});
it("aborts outstanding work when chat unmounts", async () => {
  const cancel = vi.fn();
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(
      new Response(new ReadableStream({ cancel }), {
        headers: { "Content-Type": "text/event-stream" },
      }),
    ),
  );
  const view = render(<ChatPanel plan={plan} offline={false} />);
  send("cooking smoke");
  await act(async () => {});
  view.unmount();
  await waitFor(() => expect(cancel).toHaveBeenCalled());
});

it.each([
  'data: {"mode":"llm"}\n\ndata: {"text":"Truncated remote answer"}\n\n',
  'data: {"mode":"llm"}\n\ndata: {"text":17}\n\ndata: [DONE]\n\n',
])(
  "replaces an invalid or incomplete stream with cited local guidance",
  async (wire) => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(wire, {
          headers: { "Content-Type": "text/event-stream" },
        }),
      ),
    );
    render(<ChatPanel plan={plan} offline={false} />);
    send("How should a mask fit?");
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Send" })).toBeEnabled(),
    );
    expect(
      screen.queryByText("Truncated remote answer"),
    ).not.toBeInTheDocument();
    expect(
      screen
        .getAllByRole("link")
        .some((link) => link.getAttribute("href")?.startsWith("/learn#")),
    ).toBe(true);
    expect(screen.getByText(/Response mode: rules/)).toBeInTheDocument();
  },
);
it("clears prior conversation when a different plan is selected", async () => {
  const network = vi.fn().mockResolvedValue(reply("First plan answer"));
  vi.stubGlobal("fetch", network);
  const view = render(<ChatPanel plan={plan} offline={false} />);
  send("mask fitting");
  await screen.findByText("First plan answer");
  view.rerender(
    <ChatPanel
      plan={localPlan(baseProfile, cities.Delhi, manualAir(35))}
      offline={false}
    />,
  );
  expect(screen.queryByText("First plan answer")).not.toBeInTheDocument();
  network.mockResolvedValue(reply("New plan answer"));
  send("cooking smoke");
  await screen.findByText("New plan answer");
  expect(JSON.parse(network.mock.calls[1]![1].body).messages).toEqual([]);
});
it.each(["success", "failure"])(
  "switching to rules mode ignores a late online %s",
  async (outcome) => {
    let resolve!: (response: Response) => void, reject!: (error: Error) => void;
    const network = vi.fn<
      (url: string, init: RequestInit) => Promise<Response>
    >(
      () =>
        new Promise((yes, no) => {
          resolve = yes;
          reject = no;
        }),
    );
    vi.stubGlobal("fetch", network);
    const view = render(<ChatPanel plan={plan} offline={false} />);
    send("kitchen smoke");
    view.rerender(<ChatPanel plan={plan} offline={true} />);
    expect(network.mock.calls[0]?.[1].signal?.aborted).toBe(true);
    expect(screen.getByRole("button", { name: "Send" })).toBeEnabled();
    send("mask fitting");
    expect(screen.getByText(/Response mode: rules/)).toBeInTheDocument();
    await act(async () => {
      if (outcome === "success") resolve(reply("Obsolete answer"));
      else reject(new Error("Late failure"));
    });
    expect(screen.queryByText("Obsolete answer")).not.toBeInTheDocument();
    expect(screen.getByText(/Response mode: rules/)).toBeInTheDocument();
    expect(network).toHaveBeenCalledOnce();
  },
);
it("rules-mode switching cancels a partial reader and clears its answer", async () => {
  const cancel = vi.fn();
  vi.stubGlobal(
    "fetch",
    vi.fn(
      async () =>
        new Response(
          new ReadableStream({
            start(c) {
              c.enqueue(
                new TextEncoder().encode(
                  'data: {"mode":"llm"}\n\ndata: {"text":"Partial online answer"}\n\n',
                ),
              );
            },
            cancel,
          }),
          { headers: { "Content-Type": "text/event-stream" } },
        ),
    ),
  );
  const view = render(<ChatPanel plan={plan} offline={false} />);
  send("mask fitting");
  await screen.findByText("Partial online answer");
  view.rerender(<ChatPanel plan={plan} offline={true} />);
  await waitFor(() => expect(cancel).toHaveBeenCalledOnce());
  expect(screen.queryByText("Partial online answer")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Send" })).toBeEnabled();
});
it("does not carry rules-only conversation into a later online request", async () => {
  const network = vi
    .fn()
    .mockImplementation(async () => reply("Online answer"));
  vi.stubGlobal("fetch", network);
  const view = render(<ChatPanel plan={plan} offline={true} />);
  send("mask fitting");
  view.rerender(<ChatPanel plan={plan} offline={false} />);
  send("kitchen smoke");
  await screen.findByText("Online answer");
  expect(JSON.parse(network.mock.calls[0]![1].body).messages).toEqual([]);
});
