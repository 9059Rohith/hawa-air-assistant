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
    const responsePlan = {
      ...plan,
      air: { ...air, source: source === "demo" ? "manual" : source },
    };
    const fetcher = vi.fn<
      (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>
    >(async () => Response.json(responsePlan));
    vi.stubGlobal("fetch", fetcher);
    await expect(
      requestPlan(
        baseProfile,
        cities.Delhi,
        { ...air, source },
        new AbortController().signal,
      ),
    ).resolves.toEqual(responsePlan);
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
it.each([
  { profile: { ...plan.profile, adults: 5 } },
  { profile: { ...plan.profile, childAges: [3], children: 1 } },
  { location: { ...plan.location, name: "Another city" } },
  { location: { ...plan.location, lat: 0 } },
  { location: { ...plan.location, lon: 0 } },
  { air: { ...air, source: "open-meteo" } },
  { air: { ...air, pm25: 1 } },
])(
  "rejects a valid-looking response for different requested inputs: %#",
  async (change) => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ ...plan, ...change })),
    );
    await expect(
      requestPlan(baseProfile, cities.Delhi, air, new AbortController().signal),
    ).rejects.toThrow(/returned plan/);
  },
);
it.each([
  { observedAt: "2026-01-01T00:00" },
  { fetchedAt: "2026-01-01T00:00:00Z" },
  { timezone: "Asia/Tokyo" },
  { hourly: [{ time: "2026-01-01T10:00", pm25: 30 }] },
])("rejects substituted browser-model context: %#", async (change) => {
  const input = { ...air, source: "open-meteo-browser" as const };
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => Response.json({ ...plan, air: { ...input, ...change } })),
  );
  await expect(
    requestPlan(baseProfile, cities.Delhi, input, new AbortController().signal),
  ).rejects.toThrow(/air snapshot/);
});
