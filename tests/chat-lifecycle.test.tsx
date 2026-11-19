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
      ),
    ),
  );
  render(<ChatPanel plan={plan} offline={false} />);
  send("mask fitting");
  await act(async () => {
    stream.enqueue(
      new TextEncoder().encode('data: {"text":"Partial answer"}\n\n'),
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
    vi.fn().mockResolvedValue(new Response(new ReadableStream({ cancel }))),
  );
  const view = render(<ChatPanel plan={plan} offline={false} />);
  send("cooking smoke");
  await act(async () => {});
  view.unmount();
  await waitFor(() => expect(cancel).toHaveBeenCalled());
});
