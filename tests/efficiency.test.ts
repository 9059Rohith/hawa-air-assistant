// @vitest-environment node
import { afterEach, expect, it, vi } from "vitest";
import { SingleFlight } from "@/services/single-flight";
import { TokenBudget, estimateReservation } from "@/services/token-budget";
import { baseProfile, cities } from "@/data/personas";
import { knowledge } from "@/data/knowledge";
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
it("coalesces a burst of fifty callers into one provider operation", async () => {
  const flight = new SingleFlight<number>();
  const work = vi.fn(async () => 42);
  expect(
    await Promise.all(
      Array.from({ length: 50 }, () => flight.run("city", work)),
    ),
  ).toEqual(Array(50).fill(42));
  expect(work).toHaveBeenCalledTimes(1);
});
it("limits distinct in-flight work but lets identical callers join", async () => {
  const flight = new SingleFlight<number>(1);
  let finish!: (n: number) => void;
  const a = flight.run(
    "a",
    () =>
      new Promise<number>((r) => {
        finish = r;
      }),
  );
  const duplicate = flight.run("a", async () => 99);
  await expect(flight.run("b", async () => 2)).rejects.toMatchObject({
    code: "UPSTREAM_BUSY",
  });
  finish(1);
  expect(await duplicate).toBe(await a);
  expect(await flight.run("b", async () => 2)).toBe(2);
});
it.each(["sync", "async"])(
  "releases a failed %s operation for retry",
  async (kind) => {
    const flight = new SingleFlight<number>(1);
    const work = () => {
      if (kind === "sync") throw new Error("failed");
      return Promise.reject(new Error("failed"));
    };
    await expect(flight.run("a", work)).rejects.toThrow("failed");
    expect(await flight.run("a", async () => 7)).toBe(7);
  },
);
it("charges every reservation and never refunds failed attempts", () => {
  const budget = new TokenBudget();
  expect(budget.reserve(400, 1000, 0)).toBe(true);
  expect(budget.reserve(400, 1000, 1)).toBe(true);
  expect(budget.reserve(400, 1000, 2)).toBe(false);
  expect(budget.reserve(200, 1000, 3)).toBe(true);
});
it("expires reservations at the rolling minute boundary", () => {
  const budget = new TokenBudget();
  expect(budget.reserve(1000, 1000, 100)).toBe(true);
  expect(budget.reserve(1, 1000, 60099)).toBe(false);
  expect(budget.reserve(1000, 1000, 60100)).toBe(true);
});
it.each([0, -1, 0.5, Infinity, NaN])(
  "rejects invalid token reservation %s",
  (tokens) => {
    expect(new TokenBudget().reserve(tokens, 1000)).toBe(false);
  },
);
it.each([0, -1, 0.5, Infinity, NaN])(
  "rejects invalid token limit %s",
  (limit) => {
    expect(new TokenBudget().reserve(1, limit)).toBe(false);
  },
);
it.each(["ASCII", "मास्क", "🌍"])(
  "cost reservation counts UTF-8 bytes for %s",
  (content) => {
    expect(estimateReservation([{ content }], 1400)).toBe(
      256 + Buffer.byteLength(content) + 1400,
    );
  },
);
it("air bursts use a single upstream request and rounded location key", async () => {
  vi.resetModules();
  const { getAir } = await import("@/services/air");
  const mock = vi.fn(async () =>
    Response.json({
      current: { pm2_5: 80, time: "2026-11-19T10:00" },
      hourly: { time: [], pm2_5: [] },
      timezone: "UTC",
    }),
  );
  vi.stubGlobal("fetch", mock);
  const values = await Promise.all(
    Array.from({ length: 50 }, () => getAir(cities.Delhi)),
  );
  expect(values.every((x) => x.pm25 === 80)).toBe(true);
  await getAir({ ...cities.Delhi, lat: 28.61001 });
  expect(mock).toHaveBeenCalledTimes(1);
});
it("geocode bursts normalize equivalent input and cache empty results", async () => {
  vi.resetModules();
  const { geocode } = await import("@/services/air");
  const mock = vi.fn(async () => Response.json({ results: [] }));
  vi.stubGlobal("fetch", mock);
  expect(
    await Promise.all([
      geocode(" Delhi "),
      geocode("DELHI"),
      geocode("Ｄｅｌｈｉ"),
    ]),
  ).toEqual([[], [], []]);
  await geocode("delhi");
  expect(mock).toHaveBeenCalledTimes(1);
});
it("budget exhaustion falls back without making a provider call", async () => {
  vi.resetModules();
  vi.stubEnv("LLM_API_KEY", "test-only");
  vi.stubEnv("LLM_TOKEN_BUDGET_PER_MIN", "256");
  const mock = vi.fn();
  vi.stubGlobal("fetch", mock);
  const { language } = await import("@/services/llm");
  expect(await language(knowledge.slice(0, 1), baseProfile)).toBeNull();
  expect(mock).not.toHaveBeenCalled();
});
it("an already cancelled caller incurs no model request", async () => {
  vi.resetModules();
  vi.stubEnv("LLM_API_KEY", "test-only");
  const mock = vi.fn();
  vi.stubGlobal("fetch", mock);
  const { language } = await import("@/services/llm");
  expect(
    await language(
      knowledge.slice(0, 1),
      baseProfile,
      undefined,
      undefined,
      AbortSignal.abort(),
    ),
  ).toBeNull();
  expect(mock).not.toHaveBeenCalled();
});
it("a retry requires its own cost reservation", async () => {
  vi.resetModules();
  vi.stubEnv("LLM_API_KEY", "test-only");
  // One request fits; two must not. Reserve uses the exact UTF-8 payload.
  vi.stubEnv("LLM_TOKEN_BUDGET_PER_MIN", "5000");
  const mock = vi.fn(async () => new Response("", { status: 503 }));
  vi.stubGlobal("fetch", mock);
  const { language } = await import("@/services/llm");
  expect(await language(knowledge.slice(0, 1), baseProfile)).toBeNull();
  expect(mock).toHaveBeenCalledTimes(1);
});
