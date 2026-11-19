// @vitest-environment node
import { expect, it } from "vitest";
import { ProfileSchema, LocationSchema, RequestSchema } from "@/domain/types";
import { baseProfile, cities } from "@/data/personas";
import { readSharedKit, shareFragment } from "@/lib/share";

// Independent UI/product limits: do not derive expectations from the schema.
const limits = [
  ["adults", 1, 20],
  ["children", 0, 15],
  ["elders", 0, 10],
  ["floor", 0, 100],
  ["ceiling", 2, 6],
  ["roomArea", 5, 150],
  ["cadr", 0, 2000],
  ["cookingHours", 0, 12],
  ["heatingHours", 0, 24],
  ["km", 0, 300],
  ["occupancy", 1, 8],
  ["outdoorHours", 0, 24],
  ["timeMinutes", 5, 180],
  ["wfhDays", 0, 7],
] as const;
for (const [field, min, max] of limits) {
  it.each([
    ["minimum", min, true],
    ["maximum", max, true],
    ["below minimum", min - 1, false],
    ["above maximum", max + 1, false],
    ["numeric string", String(min), false],
    ["nonfinite", Infinity, false],
    ["NaN", NaN, false],
  ])(`${field}: %s`, (_label, value, accepted) => {
    expect(
      ProfileSchema.safeParse({ ...baseProfile, [field]: value }).success,
    ).toBe(accepted);
  });
}
it.each([
  "adults",
  "children",
  "elders",
  "floor",
  "occupancy",
  "timeMinutes",
  "wfhDays",
])("rejects fractional count %s", (field) => {
  expect(
    ProfileSchema.safeParse({ ...baseProfile, [field]: 5.5 }).success,
  ).toBe(false);
});
it.each([
  "higherRisk",
  "pregnant",
  "pets",
  "purifier",
  "exhaust",
  "transit",
  "schoolRun",
  "exercise",
  "simple",
])("rejects string boolean %s", (field) => {
  expect(
    ProfileSchema.safeParse({ ...baseProfile, [field]: "false" }).success,
  ).toBe(false);
});
it.each([
  "sealing",
  "dwelling",
  "ventilation",
  "cooking",
  "heating",
  "mode",
  "vehicleFuel",
  "activity",
  "mask",
  "budget",
  "lang",
])("rejects unknown %s enum", (field) => {
  expect(
    ProfileSchema.safeParse({ ...baseProfile, [field]: "untrusted" }).success,
  ).toBe(false);
});
it.each([
  ["empty", [], true],
  ["age zero", [0], true],
  ["age seventeen", [17], true],
  ["adult", [18], false],
  ["negative", [-1], false],
  ["fraction", [6.5], false],
  ["string", ["6"], false],
  ["too many", Array(16).fill(5), false],
])("child ages: %s", (_name, childAges, accepted) => {
  expect(ProfileSchema.safeParse({ ...baseProfile, childAges }).success).toBe(
    accepted,
  );
});
it.each([
  ["north pole", 90, 180, true],
  ["south pole", -90, -180, true],
  ["north overflow", 90.001, 0, false],
  ["south overflow", -90.001, 0, false],
  ["east overflow", 0, 180.001, false],
  ["west overflow", 0, -180.001, false],
])("location boundary: %s", (_name, lat, lon, accepted) => {
  expect(LocationSchema.safeParse({ name: "City", lat, lon }).success).toBe(
    accepted,
  );
});
it.each([
  ["zero", 0, true],
  ["maximum", 1000, true],
  ["negative", -0.1, false],
  ["too high", 1000.1, false],
  ["string", "120", false],
  ["missing", undefined, true],
])("manual PM contract: %s", (_name, manualPm, accepted) => {
  expect(
    RequestSchema.safeParse({
      profile: baseProfile,
      location: cities.Delhi,
      manualPm,
    }).success,
  ).toBe(accepted);
});
it.each(["apiKey", "systemPrompt", "constructor", "prototype"])(
  "rejects extraneous request field %s",
  (field) => {
    expect(
      RequestSchema.safeParse({
        profile: baseProfile,
        location: cities.Delhi,
        [field]: "injected",
      }).success,
    ).toBe(false);
    expect(
      ProfileSchema.safeParse({ ...baseProfile, [field]: "injected" }).success,
    ).toBe(false);
  },
);
it.each([
  ["wrong version", { v: 2, lang: "en", ids: ["mask-fit"] }],
  ["wrong language", { v: 1, lang: "xx", ids: ["mask-fit"] }],
  ["unknown action", { v: 1, lang: "en", ids: ["fake-cure"] }],
  ["empty IDs", { v: 1, lang: "en", ids: [] }],
  ["non-array IDs", { v: 1, lang: "en", ids: "mask-fit" }],
  ["object ID", { v: 1, lang: "en", ids: [{}] }],
  ["too many IDs", { v: 1, lang: "en", ids: Array(11).fill("mask-fit") }],
])("public share rejects %s", (_name, value) => {
  expect(
    readSharedKit("#kit=" + encodeURIComponent(JSON.stringify(value)), [
      "mask-fit",
    ]),
  ).toBeNull();
});
it.each(["", "#kit=%", "#kit=null", "#kit=3", "#kit=" + "x".repeat(2001)])(
  "rejects malformed share %s",
  (hash) => {
    expect(readSharedKit(hash, ["mask-fit"])).toBeNull();
  },
);
it.each(["en", "hi"] as const)(
  "share roundtrip preserves %s and deduplicates",
  (lang) => {
    expect(
      readSharedKit(shareFragment(["mask-fit", "mask-fit"], lang), [
        "mask-fit",
      ]),
    ).toEqual({ lang, ids: ["mask-fit"] });
  },
);
