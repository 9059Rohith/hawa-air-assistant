// @vitest-environment node
import { expect, it } from "vitest";
import { baseProfile, cities } from "@/data/personas";
import { localPlan } from "@/lib/rules-plan";
import {
  airSnapshotsMatch,
  locationsMatch,
  planInputsMatch,
  profilesMatch,
} from "@/lib/plan-context";
import type { Air } from "@/domain/types";

const air: Air = {
  pm25: 120,
  source: "manual",
  stale: false,
  observedAt: "2026-11-27T00:00:00Z",
  fetchedAt: "2026-11-27T00:00:00Z",
  timezone: "UTC",
  hourly: [{ time: "2026-11-27T10:00", pm25: 80 }],
};
const plan = localPlan(baseProfile, cities.Delhi, air);

it("compares household values independently of key order", () => {
  const reversed = Object.fromEntries(
    Object.entries(baseProfile).reverse(),
  ) as typeof baseProfile;
  expect(profilesMatch(baseProfile, reversed)).toBe(true);
  expect(profilesMatch(baseProfile, { ...baseProfile, childAges: [4] })).toBe(
    false,
  );
  expect(profilesMatch(baseProfile, { ...baseProfile, adults: 5 })).toBe(false);
});
it("treats display changes differently from an API response for another language", () => {
  const changed = {
    ...baseProfile,
    lang: "hi" as const,
    simple: !baseProfile.simple,
  };
  expect(profilesMatch(baseProfile, changed)).toBe(false);
  expect(profilesMatch(baseProfile, changed, false)).toBe(true);
  expect(planInputsMatch(plan, changed, cities.Delhi, air)).toBe(true);
});
it.each([
  null,
  { ...cities.Delhi, lat: 0 },
  { ...cities.Delhi, lon: 0 },
  { ...cities.Delhi, name: "Another place" },
])("invalidates a plan after a location change: %#", (location) => {
  expect(planInputsMatch(plan, baseProfile, location, air)).toBe(false);
});
it("rejects missing air and changed household inputs", () => {
  expect(planInputsMatch(plan, baseProfile, cities.Delhi, null)).toBe(false);
  expect(
    planInputsMatch(plan, { ...baseProfile, km: 25 }, cities.Delhi, air),
  ).toBe(false);
  expect(locationsMatch(cities.Delhi, { ...cities.Delhi })).toBe(true);
});
it.each([
  { pm25: 1 },
  { source: "demo" as const },
  { stale: true },
  { timezone: "Asia/Kolkata" },
  { observedAt: "2026-11-28T00:00:00Z" },
  { fetchedAt: "2026-11-28T00:00:00Z" },
  { hourly: [] },
  { hourly: [{ time: "2026-11-28T10:00", pm25: 80 }] },
  { hourly: [{ time: "2026-11-27T10:00", pm25: 85 }] },
])("invalidates every material air-snapshot change: %#", (change) => {
  expect(airSnapshotsMatch(air, { ...air, ...change })).toBe(false);
  expect(
    planInputsMatch(plan, baseProfile, cities.Delhi, { ...air, ...change }),
  ).toBe(false);
});
it("accepts a schema-reordered air snapshot", () => {
  expect(
    airSnapshotsMatch(air, {
      ...Object.fromEntries(Object.entries(air).reverse()),
      hourly: air.hourly.map(({ pm25, time }) => ({ pm25, time })),
    } as Air),
  ).toBe(true);
});
