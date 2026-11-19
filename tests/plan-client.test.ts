// @vitest-environment node
import { afterEach, expect, it, vi } from "vitest";
import { requestPlan } from "@/lib/plan-client";
import { baseProfile, cities } from "@/data/personas";
import { manualAir } from "@/services/air";
import { localPlan } from "@/lib/rules-plan";
const air = manualAir(130);
const plan = localPlan(baseProfile, cities.Delhi, air);
afterEach(() => vi.unstubAllGlobals());
it.each(["manual", "demo", "open-meteo", "open-meteo-browser"] as const)(
  "preserves %s request provenance",
  async (source) => {
    const fetcher = vi.fn<
      (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>
    >(async () => Response.json(plan));
    vi.stubGlobal("fetch", fetcher);
    await expect(
      requestPlan(
        baseProfile,
        cities.Delhi,
        { ...air, source },
        new AbortController().signal,
      ),
    ).resolves.toEqual(plan);
    const init = fetcher.mock.calls[0]?.[1];
    const payload = JSON.parse(String(init?.body));
    if (source === "open-meteo-browser") {
      expect(payload.browserAir.air.source).toBe(source);
      expect(payload.manualPm).toBeUndefined();
    } else if (source === "open-meteo") {
      expect(payload.manualPm).toBeUndefined();
      expect(payload.browserAir).toBeUndefined();
    } else expect(payload.manualPm).toBe(130);
  },
);
it("cancels an HTTP error body instead of consuming unbounded diagnostic text", async () => {
  const cancel = vi.fn();
  vi.stubGlobal(
    "fetch",
    vi.fn(
      async () => new Response(new ReadableStream({ cancel }), { status: 503 }),
    ),
  );
  await expect(
    requestPlan(baseProfile, cities.Delhi, air, new AbortController().signal),
  ).rejects.toThrow("unavailable");
  expect(cancel).toHaveBeenCalled();
});
it("rejects oversized successful plan data before JSON parsing", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(" ".repeat(262145))),
  );
  await expect(
    requestPlan(baseProfile, cities.Delhi, air, new AbortController().signal),
  ).rejects.toThrow("byte limit");
});
it("aborts a stalled response body when its request is cancelled", async () => {
  const cancel = vi.fn(),
    controller = new AbortController();
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(new ReadableStream({ cancel }))),
  );
  const pending = requestPlan(
    baseProfile,
    cities.Delhi,
    air,
    controller.signal,
  );
  const rejected = expect(pending).rejects.toThrow();
  await new Promise((resolve) => setTimeout(resolve, 0));
  controller.abort();
  await rejected;
  expect(cancel).toHaveBeenCalled();
});
