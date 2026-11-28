// @vitest-environment node
import { afterEach, expect, it, vi } from "vitest";
import { buildPlan } from "@/services/plan";
import { language } from "@/services/llm";
import { localPlan } from "@/lib/rules-plan";
import { baseProfile, cities } from "@/data/personas";
import { manualAir } from "@/services/air";
import { PlanSchema, type Air } from "@/domain/types";
vi.mock("@/services/llm", () => ({
  PROMPT_VERSION: "cache-regression",
  language: vi.fn(async () => null),
}));
afterEach(() => {
  vi.clearAllMocks();
});
it("invalidates personalized language when forecast context or staleness changes", async () => {
  const air: Air = {
    ...manualAir(83),
    source: "open-meteo-browser",
    fetchedAt: new Date().toISOString(),
    hourly: [
      { time: "2026-11-19T10:00", pm25: 70 },
      { time: "2026-11-19T11:00", pm25: 90 },
    ],
  };
  const input = {
    profile: baseProfile,
    location: cities.Delhi,
    offline: false,
    browserAir: { location: cities.Delhi, air },
  };
  await buildPlan(input);
  await buildPlan(input);
  expect(language).toHaveBeenCalledTimes(1);
  await buildPlan({
    ...input,
    browserAir: { ...input.browserAir, air: { ...air, stale: true } },
  });
  expect(language).toHaveBeenCalledTimes(2);
  await buildPlan({
    ...input,
    browserAir: {
      ...input.browserAir,
      air: {
        ...air,
        hourly: air.hourly.map((h) => ({ ...h, pm25: h.pm25 + 10 })),
      },
    },
  });
  expect(language).toHaveBeenCalledTimes(3);
});
it("server and local fallback produce the same validated plan", async () => {
  const server = await buildPlan({
    profile: baseProfile,
    location: cities.Delhi,
    manualPm: 183,
    offline: true,
  });
  const local = localPlan(baseProfile, cities.Delhi, server.air);
  expect({ ...server, createdAt: "" }).toEqual({ ...local, createdAt: "" });
  expect(PlanSchema.safeParse(server).success).toBe(true);
});
it("keeps deterministic impact while adding validated personalized explanations", async () => {
  vi.mocked(language).mockResolvedValueOnce({
    headline: "A personal plan",
    summary: "Prioritize cleaner indoor air.",
    actions: [{ id: "unknown-unused", why: "Never rendered" }],
  });
  const plan = await buildPlan({
    profile: baseProfile,
    location: cities.Delhi,
    manualPm: 184,
    offline: false,
  });
  expect(plan.generatedBy).toBe("llm");
  expect(plan.headline).toBe("A personal plan");
  expect(plan.actions.some((a) => a.why === "Never rendered")).toBe(false);
  expect(plan.impact).toEqual(
    localPlan(baseProfile, cities.Delhi, plan.air).impact,
  );
});

it.each(["manual", "demo"] as const)(
  "retains the original %s observation on first build and cache hit",
  async (source) => {
    const localAir = {
      ...manualAir(115),
      source,
      observedAt: "2026-11-20T09:00:00Z",
    };
    const input = {
      profile: baseProfile,
      location: cities.Delhi,
      offline: true,
      localAir,
    };
    expect((await buildPlan(input)).air).toEqual(localAir);
    const updated = { ...localAir, observedAt: "2026-11-20T10:00:00Z" };
    expect((await buildPlan({ ...input, localAir: updated })).air).toEqual(
      updated,
    );
  },
);

it("preserves an illustrative forecast without promoting it to live data", async () => {
  const localAir = {
    ...manualAir(75),
    source: "demo",
    hourly: [{ time: "2026-11-20T10:00", pm25: 32 }],
  };
  const input = {
    profile: baseProfile,
    location: cities.Delhi,
    offline: true,
    localAir,
  };
  expect((await buildPlan(input)).air).toEqual(localAir);
  await expect(
    buildPlan({ ...input, localAir: { ...localAir, source: "manual" } }),
  ).rejects.toThrow();
  await expect(buildPlan({ ...input, manualPm: 0 })).rejects.toThrow(
    "one source",
  );
});
