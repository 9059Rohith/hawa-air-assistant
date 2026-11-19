import { describe, it, expect } from "vitest";
import { aqi, cpcb, bestWindow, BANDS } from "@/domain/aqi";
import {
  exposure,
  planImpact,
  purifierSize,
  communityImpact,
} from "@/domain/impact";
import { urgent } from "@/domain/safety";
import { selectActions } from "@/domain/select";
import {
  ProfileSchema,
  RequestSchema,
  AirSchema,
  ActionSchema,
} from "@/domain/types";
import { baseProfile, personas, cities } from "@/data/personas";
import { knowledge } from "@/data/knowledge";
import { sources } from "@/data/sources";
describe("air indices", () => {
  for (const band of BANDS) {
    it(`interpolates ${band.label} boundaries`, () => {
      expect(aqi(band.lo).value).toBe(band.a);
      expect(aqi(band.hi).value).toBe(band.b);
    });
  }
  it("truncates, extrapolates and rejects invalid concentrations", () => {
    expect(aqi(9.09).value).toBe(50);
    expect(aqi(500).value).toBeGreaterThan(500);
    for (const n of [-1, NaN, Infinity]) expect(() => aqi(n)).toThrow();
  });
  it.each([
    [0, "Good"],
    [30, "Good"],
    [30.1, "Satisfactory"],
    [60, "Satisfactory"],
    [60.1, "Moderate"],
    [90.1, "Poor"],
    [120.1, "Very poor"],
    [250.1, "Severe"],
  ])("CPCB band %s", (n, label) => expect(cpcb(Number(n))).toBe(label));
  it("only selects future consecutive daytime windows", () => {
    expect(bestWindow([])).toBeNull();
    expect(
      bestWindow([
        { time: "2026-11-19T09:00", pm25: 1 },
        { time: "2026-11-19T10:00", pm25: 9 },
        { time: "2026-11-19T11:00", pm25: 3 },
        { time: "2026-11-19T12:00", pm25: 1 },
        { time: "2026-11-19T14:00", pm25: 0 },
      ]),
    ).toEqual({ time: "2026-11-19T11:00", mean: 2 });
  });
});
describe("transparent impact", () => {
  it.each([10, 20, 35])("sizes %s square metres", (area) => {
    expect(purifierSize(area)).toEqual({
      min: Math.round(area * 2.7 * 4),
      max: Math.round(area * 2.7 * 5),
      volume: area * 2.7,
    });
  });
  it("rejects invalid dimensions and scenarios", () => {
    for (const a of [0, -1, NaN, Infinity])
      expect(() => purifierSize(a)).toThrow();
    expect(() => purifierSize(10, 0)).toThrow();
    for (const args of [
      [-1, 1, 0.5, 0, 50, 1],
      [1, 25, 0.5, 0, 50, 1],
      [1, -1, 0.5, 0, 50, 1],
      [1, 1, -1, 0, 50, 1],
      [1, 1, 2, 0, 50, 1],
      [1, 1, 0.5, -1, 50, 1],
      [1, 1, 0.5, 0, 0, 1],
      [1, 1, 0.5, 0, 50, -1],
      [1, 1, 0.5, 0, 50, 2],
      [NaN, 1, 0.5, 0, 50, 1],
    ])
      expect(() =>
        exposure(...(args as [number, number, number, number, number, number])),
      ).toThrow();
  });
  it("matches a hand-calculated baseline", () =>
    expect(exposure(100, 2, 0.5, 0, 54)).toBe(1300));
  it("obeys monotonic filtration and concentration invariants across scenarios", () => {
    for (let i = 1; i <= 100; i++) {
      const pm = i * 3;
      expect(exposure(pm, 2, 0.5, i * 5, 54)).toBeLessThanOrEqual(
        exposure(pm, 2, 0.5, 0, 54),
      );
      expect(exposure(pm + 1, 2, 0.5, 0, 54)).toBeGreaterThan(
        exposure(pm, 2, 0.5, 0, 54),
      );
    }
  });
  it("deduplicates overlapping filters and commute alternatives", () => {
    const p = { ...baseProfile, budget: "medium" as const, wfhDays: 2 };
    const filter = { id: "f", effect: "filter" as const };
    expect(planImpact([filter, filter], p, 100)).toEqual(
      planImpact([filter], p, 100),
    );
    const total = planImpact(
      [
        { id: "a", effect: "transit" },
        { id: "b", effect: "carpool" },
        { id: "r", effect: "remote" },
        { id: "i", effect: "indoor" },
        { id: "m", effect: "mask" },
      ],
      p,
      100,
    );
    expect(total.after).toBeLessThan(total.baseline);
    expect(total.co2KgDay).toBeGreaterThan(0);
    expect(total.percent).toBeLessThanOrEqual(100);
    expect(planImpact([], p, 0).percent).toBe(0);
  });
  it.each([
    "car",
    "ev",
    "bus",
    "metro",
    "walk",
    "cycle",
    "motorcycle",
  ] as const)(
    "never increases savings with an inapplicable transport swap: %s",
    (mode) => {
      const p = {
        ...baseProfile,
        mode,
        transit: false,
        purifier: true,
        cadr: 500,
        sealing: "sealed" as const,
      };
      expect(
        planImpact([{ id: "t", effect: "transit" }], p, 100).co2KgDay,
      ).toBe(0);
    },
  );
  it("retains a stronger existing purifier and limits outdoor-hour replacement", () => {
    const p = {
      ...baseProfile,
      purifier: true,
      cadr: 1000,
      outdoorHours: 0,
      sealing: "leaky" as const,
    };
    const r = planImpact(
      [
        { id: "f", effect: "filter" },
        { id: "i", effect: "indoor" },
      ],
      p,
      10,
    );
    expect(r.after).toBe(r.baseline);
  });
  it("community scaling has explicit bounds", () => {
    expect(communityImpact(2, 100, 30)).toBe(420);
    for (const args of [
      [-1, 1, 20],
      [1, -1, 20],
      [1, 1.2, 20],
      [1, 1, -1],
      [1, 1, 101],
      [NaN, 1, 20],
    ])
      expect(() =>
        communityImpact(...(args as [number, number, number])),
      ).toThrow();
  });
});
describe("guidance and safety", () => {
  it("validates all bilingual entries and references", () => {
    expect(knowledge.length).toBeGreaterThanOrEqual(60);
    expect(new Set(knowledge.map((a) => a.id)).size).toBe(knowledge.length);
    for (const a of knowledge) {
      expect(ActionSchema.safeParse(a).success).toBe(true);
      expect(a.hi.summary.length).toBeGreaterThan(15);
      for (const source of a.sources) expect(sources).toHaveProperty(source);
    }
  });
  it.each([
    "chest pain",
    "cannot breathe",
    "severe wheeze",
    "blue lips",
    "fainted",
    "सीने में दर्द",
    "सांस लेने में दिक्कत",
    "बेहोश",
  ])("escalates %s", (s) => expect(urgent(s)).toBe(true));
  it("does not diagnose ordinary pollution questions", () =>
    expect(urgent("How should I clean a filter?")).toBe(false));
  it("prioritizes personas without duplicate groups", () => {
    for (const p of Object.values(personas)) {
      const items = selectActions(knowledge, p, 120);
      expect(items.length).toBeGreaterThanOrEqual(6);
      expect(new Set(items.map((a) => a.group)).size).toBe(items.length);
    }
    expect(selectActions(knowledge, personas.Ramesh, 120)[0]?.id).toBe(
      "coal-safety",
    );
    expect(
      selectActions(knowledge, personas.Meera, 120).some(
        (a) => a.id === "family-check",
      ),
    ).toBe(true);
    expect(
      selectActions(
        knowledge,
        {
          ...baseProfile,
          cooking: "biomass",
          budget: "medium",
          purifier: true,
        },
        120,
      ).some((a) => a.id === "clean-room"),
    ).toBe(true);
    expect(
      selectActions(knowledge, baseProfile, 5).some((a) => a.id === "mask-fit"),
    ).toBe(false);
  });
  it("rejects unexpected profile fields and invalid manual data", () => {
    expect(
      ProfileSchema.safeParse({ ...baseProfile, secret: "x" }).success,
    ).toBe(false);
    expect(
      RequestSchema.safeParse({
        profile: baseProfile,
        location: cities.Delhi,
        manualPm: -1,
      }).success,
    ).toBe(false);
    expect(AirSchema.safeParse({}).success).toBe(false);
  });
});
