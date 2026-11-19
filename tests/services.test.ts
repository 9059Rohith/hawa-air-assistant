// @vitest-environment node
import { it, expect, vi, afterEach } from "vitest";
import { Cache } from "@/services/cache";
import {
  parseLanguage,
  language,
  SYSTEM,
  PROMPT_VERSION,
} from "@/services/llm";
import { safeFetch } from "@/services/http";
import { readBody, rateLimit } from "@/services/transport";
import { errorResponse, AppError } from "@/lib/errors";
import { getAir, manualAir, geocode } from "@/services/air";
import { buildPlan } from "@/services/plan";
import { baseProfile, cities } from "@/data/personas";
import { knowledge } from "@/data/knowledge";
import { RequestSchema } from "@/domain/types";
import { POST as planPOST } from "@/app/api/plan/route";
import { POST as chatPOST } from "@/app/api/chat/route";
import { GET as airGET } from "@/app/api/air/route";
import { GET as geoGET } from "@/app/api/geocode/route";
import { GET as healthGET } from "@/app/api/health/route";
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
it("bounds cache lifetime and size", () => {
  const c = new Cache<number>(1);
  c.set("a", 1, 0);
  expect(c.get("a", 10, 2)).toBe(1);
  c.set("b", 2, 1);
  expect(c.get("a", 10, 2)).toBeNull();
  expect(c.get("b", 10, 20)).toBeNull();
  c.set("b", 3, 2);
  expect(c.get("b", 10, 3)).toBe(3);
});
const valid = {
  headline: "A clearer day",
  summary: "Focus on cleaner spaces.",
  actions: [{ id: "a", why: "Reduce indoor smoke sources." }],
};
it("validates model IDs, uniqueness and plain prose", () => {
  expect(parseLanguage(JSON.stringify(valid), ["a"]).headline).toBe(
    valid.headline,
  );
  expect(
    parseLanguage("```json\n" + JSON.stringify(valid) + "\n```", ["a"]),
  ).toEqual(valid);
  for (const value of [
    { ...valid, extra: 1 },
    { ...valid, headline: "Save 99%" },
    { ...valid, summary: "https://evil.example" },
    { ...valid, actions: [{ id: "wrong", why: "Hello" }] },
    { ...valid, actions: [] },
    { ...valid, actions: [{ id: "a", why: "word ".repeat(40) }] },
    {
      ...valid,
      actions: [
        { id: "a", why: "x" },
        { id: "a", why: "x" },
      ],
    },
  ])
    expect(() => parseLanguage(JSON.stringify(value), ["a"])).toThrow();
  expect(() => parseLanguage("not json", ["a"])).toThrow();
  expect(PROMPT_VERSION).toBe("hawa-1.0.0");
  expect(SYSTEM).toContain("untrusted data");
});
it("blocks SSRF and redirects", async () => {
  for (const url of [
    "http://api.openai.com",
    "https://example.com",
    "https://u:p@api.openai.com",
    "https://api.openai.com:444",
  ]) {
    await expect(safeFetch(url)).rejects.toThrow();
  }
  const fetchMock = vi.fn().mockResolvedValue(new Response("{}"));
  vi.stubGlobal("fetch", fetchMock);
  await safeFetch("https://api.openai.com/v1/chat/completions");
  expect(fetchMock.mock.calls[0]?.[1].redirect).toBe("manual");
  fetchMock.mockResolvedValue(
    new Response(null, {
      status: 302,
      headers: { Location: "http://127.0.0.1/private" },
    }),
  );
  await expect(
    safeFetch("https://api.openai.com/v1/chat/completions"),
  ).rejects.toMatchObject({ code: "UPSTREAM_REDIRECT", status: 502 });
  expect(fetchMock).toHaveBeenCalledTimes(2);
});
it("caps rate buckets", () => {
  for (let i = 0; i < 12; i++) rateLimit("unit", 100);
  expect(() => rateLimit("unit", 100)).toThrow();
  expect(() => rateLimit("unit", 60101)).not.toThrow();
});
function request(body: unknown, ip = Math.random().toString()) {
  return new Request("https://hawa.test/api/plan", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify(body),
  });
}
it("bounds body bytes and enforces origin, schema and MIME", async () => {
  const body = {
    profile: baseProfile,
    location: cities.Delhi,
    manualPm: 100,
    offline: true,
  };
  expect(await readBody(request(body), RequestSchema)).toEqual(body);
  await expect(
    readBody(request({ bad: true }), RequestSchema),
  ).rejects.toThrow();
  await expect(
    readBody(request({ text: "x".repeat(8200) }), RequestSchema),
  ).rejects.toThrow();
  await expect(
    readBody(
      new Request("https://hawa.test", {
        method: "POST",
        headers: { origin: "https://evil.test" },
      }),
      RequestSchema,
    ),
  ).rejects.toThrow();
  await expect(
    readBody(
      new Request("https://hawa.test", { method: "POST" }),
      RequestSchema,
    ),
  ).rejects.toThrow();
  await expect(
    readBody(
      new Request("https://hawa.test", {
        method: "POST",
        headers: { "content-type": "application/json" },
      }),
      RequestSchema,
    ),
  ).rejects.toThrow();
});
it("redacts unknown errors", async () => {
  expect(await errorResponse(new Error("secret")).text()).not.toContain(
    "secret",
  );
  expect(errorResponse(new AppError("VALID", 400, "Check input")).status).toBe(
    400,
  );
});
it("returns useful no-key and explicit offline plans", async () => {
  vi.stubEnv("ENABLE_LLM", "false");
  const input = {
    profile: baseProfile,
    location: cities.Delhi,
    manualPm: 121,
    offline: true,
  };
  const p = await buildPlan(input);
  expect(p.generatedBy).toBe("rules");
  expect(p.actions.length).toBeGreaterThan(5);
  expect((await buildPlan(input)).createdAt).toBe(p.createdAt);
  expect(
    (
      await buildPlan({
        ...input,
        profile: { ...baseProfile, lang: "hi" },
        manualPm: 122,
      })
    ).headline,
  ).toContain("आज");
  expect((await planPOST(request(input))).status).toBe(200);
  expect((await planPOST(request({}))).status).toBe(400);
  expect(await language(knowledge.slice(0, 1), baseProfile)).toBeNull();
});
it("validates upstream air and serves stale data after a failure", async () => {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(
      JSON.stringify({
        current: { pm2_5: 120, time: "2026-11-19T10:00" },
        hourly: {
          time: [
            "2026-11-19T09:00",
            "2026-11-19T10:00",
            "2026-11-19T11:00",
            "2026-11-19T12:00",
          ],
          pm2_5: [2, 120, null, 100],
        },
        timezone: "Asia/Kolkata",
      }),
    ),
  );
  vi.stubGlobal("fetch", fetchMock);
  const a = await getAir(cities.Delhi);
  expect(a.hourly).toHaveLength(2);
  await getAir(cities.Delhi);
  expect(fetchMock).toHaveBeenCalledTimes(1);
  const now = Date.now();
  vi.spyOn(Date, "now").mockReturnValue(now + 1000000);
  fetchMock.mockResolvedValue(new Response("", { status: 500 }));
  expect((await getAir(cities.Delhi)).stale).toBe(true);
  await expect(getAir(cities.Kolkata)).rejects.toThrow();
  vi.restoreAllMocks();
  expect(manualAir(7).source).toBe("manual");
});
it("geocodes with cached minimal output", async () => {
  const mock = vi.fn().mockResolvedValue(
    new Response(
      JSON.stringify({
        results: [
          {
            name: "Delhi",
            latitude: 28.6,
            longitude: 77.2,
            country: "India",
          },
        ],
      }),
    ),
  );
  vi.stubGlobal("fetch", mock);
  expect((await geocode("Delhi"))[0]?.lat).toBe(28.6);
  await geocode("Delhi");
  expect(mock).toHaveBeenCalledTimes(1);
  mock.mockResolvedValue(new Response("{}"));
  expect(await geocode("Nowhere")).toEqual([]);
  mock.mockResolvedValue(new Response("", { status: 500 }));
  await expect(geocode("Failure")).rejects.toThrow();
});
it("rejects incomplete air readings instead of presenting a fabricated value", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          current: { pm2_5: null, time: "2026-11-19T12:00" },
          hourly: { time: [], pm2_5: [] },
          timezone: "UTC",
        }),
      ),
    ),
  );
  await expect(
    getAir({ name: "Unavailable monitor", lat: 1, lon: 1 }),
  ).rejects.toMatchObject({ code: "AIR_DATA", status: 502 });
});
it("API rejects invalid queries and health discloses only status", async () => {
  expect((await airGET(new Request("https://hawa.test/api/air"))).status).toBe(
    400,
  );
  expect(
    (await geoGET(new Request("https://hawa.test/api/geocode?q=a"))).status,
  ).toBe(400);
  vi.stubEnv("ENABLE_LLM", "false");
  expect((await (await healthGET()).json()).llm).toBe("offline");
});
it("urgent chat skips provider and rules responses include citations", async () => {
  vi.stubEnv("ENABLE_LLM", "false");
  const input = {
    profile: baseProfile,
    location: cities.Delhi,
    manualPm: 100,
    offline: true,
  };
  const r = await chatPOST(request({ ...input, message: "chest pain" }));
  expect(await r.text()).toContain("Seek urgent");
  const answer = await chatPOST(
    request({ ...input, message: "kitchen smoke" }),
  );
  expect(await answer.text()).toContain("[kb:");
  expect((await chatPOST(request({ ...input, message: "" }))).status).toBe(400);
});
it("uses validated provider language and recovers from garbage", async () => {
  vi.stubEnv("LLM_API_KEY", "test-placeholder");
  vi.stubEnv("ENABLE_LLM", "true");
  const a = knowledge[0]!;
  const good = {
    ...valid,
    actions: [{ id: a.id, why: "Keep the room smoke free." }],
  };
  vi.stubGlobal(
    "fetch",
    vi.fn().mockImplementation(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            choices: [{ message: { content: JSON.stringify(good) } }],
          }),
        ),
      ),
    ),
  );
  expect((await language([a], baseProfile))?.headline).toBe(valid.headline);
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockImplementation(() =>
        Promise.resolve(
          new Response(
            JSON.stringify({ choices: [{ message: { content: "bad" } }] }),
          ),
        ),
      ),
  );
  expect(await language([a], baseProfile)).toBeNull();
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(new Response("", { status: 401 })),
  );
  expect(await language([a], baseProfile)).toBeNull();
});
