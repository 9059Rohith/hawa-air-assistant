// @vitest-environment node
import { afterEach, expect, it, vi } from "vitest";
import { createBrowserAirClient } from "@/lib/browser-air";
import { parseAir } from "@/lib/air-data";
import { buildPlan } from "@/services/plan";
import { RequestSchema } from "@/domain/types";
import { baseProfile, cities } from "@/data/personas";

const provider = {
  current: { pm2_5: 91, time: "2026-11-19T18:00" },
  hourly: {
    time: ["2026-11-19T17:00", "2026-11-19T18:00", "2026-11-19T19:00"],
    pm2_5: [100, 91, null],
  },
  timezone: "Asia/Kolkata",
};
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it("deduplicates browser requests, caches readings and sends no credentials", async () => {
  const fetcher = vi.fn().mockResolvedValue(Response.json(provider));
  vi.stubGlobal("fetch", fetcher);
  const load = createBrowserAirClient();
  const [a, b] = await Promise.all([load(cities.Delhi), load(cities.Delhi)]);
  expect(a).toEqual(b);
  expect(a.source).toBe("open-meteo-browser");
  expect(a.hourly).toHaveLength(1);
  await load(cities.Delhi);
  expect(fetcher).toHaveBeenCalledTimes(1);
  expect(fetcher.mock.calls[0]?.[0]).toContain("latitude=28.61");
  expect(fetcher.mock.calls[0]?.[1]).toMatchObject({
    credentials: "omit",
    referrerPolicy: "no-referrer",
    redirect: "error",
  });
});
it("honors Retry-After across locations without automatic retries", async () => {
  const clock = vi.spyOn(Date, "now");
  const now = Date.now();
  clock.mockReturnValue(now);
  const fetcher = vi
    .fn()
    .mockResolvedValue(
      new Response("", { status: 429, headers: { "Retry-After": "120" } }),
    );
  vi.stubGlobal("fetch", fetcher);
  const load = createBrowserAirClient();
  await expect(load(cities.Delhi)).rejects.toThrow();
  clock.mockReturnValue(now + 61000);
  await expect(load(cities.Kolkata)).rejects.toThrow();
  expect(fetcher).toHaveBeenCalledTimes(1);
  clock.mockReturnValue(now + 121000);
  fetcher.mockResolvedValue(Response.json(provider));
  expect((await load(cities.Delhi)).pm25).toBe(91);
});
it("honors HTTP-date retry instructions", async () => {
  const now = Date.now();
  vi.spyOn(Date, "now").mockReturnValue(now);
  const fetcher = vi.fn().mockResolvedValue(
    new Response("", {
      status: 429,
      headers: { "Retry-After": new Date(now + 180000).toUTCString() },
    }),
  );
  vi.stubGlobal("fetch", fetcher);
  const load = createBrowserAirClient();
  await expect(load(cities.Delhi)).rejects.toThrow();
  vi.spyOn(Date, "now").mockReturnValue(now + 90000);
  await expect(load(cities.Delhi)).rejects.toThrow();
  expect(fetcher).toHaveBeenCalledTimes(1);
});
it("labels stale cached readings and refuses data older than three hours", async () => {
  const now = Date.now();
  vi.spyOn(Date, "now").mockReturnValue(now);
  const fetcher = vi.fn().mockResolvedValue(Response.json(provider));
  vi.stubGlobal("fetch", fetcher);
  const load = createBrowserAirClient();
  await load(cities.Delhi);
  vi.spyOn(Date, "now").mockReturnValue(now + 1000000);
  fetcher.mockResolvedValue(new Response("", { status: 503 }));
  expect((await load(cities.Delhi)).stale).toBe(true);
  expect((await load(cities.Delhi)).stale).toBe(true);
  expect(fetcher).toHaveBeenCalledTimes(2);
  vi.spyOn(Date, "now").mockReturnValue(now + 11000000);
  await expect(load(cities.Delhi)).rejects.toThrow();
});
it("rejects malformed, mismatched and out-of-range provider data", () => {
  for (const data of [
    { ...provider, current: { pm2_5: null, time: provider.current.time } },
    { ...provider, hourly: { time: [], pm2_5: [1] } },
    { ...provider, current: { pm2_5: 10001, time: provider.current.time } },
  ])
    expect(() => parseAir(data, "open-meteo-browser")).toThrow();
});
it("bounds browser memory while preserving independently cached locations", async () => {
  const fetcher = vi
    .fn()
    .mockImplementation(() => Promise.resolve(Response.json(provider)));
  vi.stubGlobal("fetch", fetcher);
  const load = createBrowserAirClient();
  for (let lat = 0; lat < 21; lat++) await load({ name: "City", lat, lon: 0 });
  await load({ name: "City", lat: 20, lon: 0 });
  expect(fetcher).toHaveBeenCalledTimes(21);
  await load({ name: "City", lat: 0, lon: 0 });
  expect(fetcher).toHaveBeenCalledTimes(22);
});
it("builds a plan from bounded browser air without repeating the upstream request", async () => {
  const fetcher = vi.fn();
  vi.stubGlobal("fetch", fetcher);
  const air = parseAir(provider, "open-meteo-browser");
  const plan = await buildPlan({
    profile: baseProfile,
    location: cities.Delhi,
    offline: true,
    browserAir: { location: cities.Delhi, air },
  });
  expect(plan.air).toEqual(air);
  expect(plan.actions.length).toBeGreaterThan(5);
  expect(fetcher).not.toHaveBeenCalled();
});
it("rejects conflicting, future, expired and wrong-location browser snapshots", async () => {
  const air = parseAir(provider, "open-meteo-browser");
  const input = {
    profile: baseProfile,
    location: cities.Delhi,
    offline: true,
    browserAir: { location: cities.Delhi, air },
  };
  for (const change of [
    { manualPm: 1 },
    { browserAir: { location: cities.Kolkata, air } },
    {
      browserAir: {
        location: cities.Delhi,
        air: { ...air, fetchedAt: new Date(Date.now() + 120000).toISOString() },
      },
    },
    {
      browserAir: {
        location: cities.Delhi,
        air: {
          ...air,
          fetchedAt: new Date(Date.now() - 11000000).toISOString(),
        },
      },
    },
  ])
    await expect(buildPlan({ ...input, ...change })).rejects.toMatchObject({
      code: "AIR_SNAPSHOT",
    });
  expect(
    RequestSchema.safeParse({
      ...input,
      browserAir: {
        location: cities.Delhi,
        air: { ...air, source: "open-meteo" },
      },
    }).success,
  ).toBe(false);
});
it("server recomputes staleness for client snapshots", async () => {
  const air = {
    ...parseAir(provider, "open-meteo-browser"),
    fetchedAt: new Date(Date.now() - 1800000).toISOString(),
  };
  const plan = await buildPlan({
    profile: baseProfile,
    location: cities.Delhi,
    offline: true,
    browserAir: { location: cities.Delhi, air },
  });
  expect(plan.air.stale).toBe(true);
});
