// @vitest-environment node
import { afterEach, expect, it, vi } from "vitest";
import { searchLocations } from "@/lib/location-client";
import { cities } from "@/data/personas";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
it("encodes the query and validates location results", async () => {
  const fetcher = vi.fn(async () => Response.json([cities.Delhi]));
  vi.stubGlobal("fetch", fetcher);
  await expect(
    searchLocations("Delhi & nearby", new AbortController().signal),
  ).resolves.toEqual([cities.Delhi]);
  expect(fetcher).toHaveBeenCalledWith(
    "/api/geocode?q=Delhi%20%26%20nearby",
    expect.objectContaining({ signal: expect.any(AbortSignal) }),
  );
});
it.each([new Array(11).fill(cities.Delhi), [{ name: "Bad", lat: 91, lon: 0 }]])(
  "rejects invalid or excessive location results",
  async (data) => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json(data)),
    );
    await expect(
      searchLocations("Delhi", new AbortController().signal),
    ).rejects.toThrow();
  },
);
it("rejects oversized response bodies before parsing", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(" ".repeat(262145))),
  );
  await expect(
    searchLocations("Delhi", new AbortController().signal),
  ).rejects.toThrow("byte limit");
});
it("releases an HTTP error body", async () => {
  const cancel = vi.fn();
  vi.stubGlobal(
    "fetch",
    vi.fn(
      async () => new Response(new ReadableStream({ cancel }), { status: 429 }),
    ),
  );
  await expect(
    searchLocations("Delhi", new AbortController().signal),
  ).rejects.toThrow("unavailable");
  expect(cancel).toHaveBeenCalledOnce();
});
it("cancels a stalled body when the total request deadline expires", async () => {
  const deadline = new AbortController(),
    cancel = vi.fn();
  vi.spyOn(AbortSignal, "timeout").mockReturnValue(deadline.signal);
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(new ReadableStream({ cancel }))),
  );
  const pending = expect(
    searchLocations("Delhi", new AbortController().signal),
  ).rejects.toThrow();
  await new Promise((resolve) => setTimeout(resolve, 0));
  deadline.abort(new DOMException("Timed out", "TimeoutError"));
  await pending;
  expect(cancel).toHaveBeenCalledOnce();
});
it("does not fetch after cancellation before the lazy client loads", async () => {
  const fetcher = vi.fn(),
    controller = new AbortController();
  controller.abort();
  vi.stubGlobal("fetch", fetcher);
  await expect(searchLocations("Delhi", controller.signal)).rejects.toThrow();
  expect(fetcher).not.toHaveBeenCalled();
});
