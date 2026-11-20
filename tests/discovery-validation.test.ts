// @vitest-environment node
import { expect, it } from "vitest";
import { searchGuidance, guidanceTopics } from "@/lib/guidance-search";
import { profileIssues } from "@/components/profile-validation";
import { baseProfile } from "@/data/personas";
import { knowledge } from "@/data/knowledge";
it.each(["mask fit", "fit mask", "  MASK, fit!  ", "ｍａｓｋ ｆｉｔ"])(
  "library normalizes and matches all terms: %s",
  (query) => {
    expect(searchGuidance(query).some((item) => item.id === "mask-fit")).toBe(
      true,
    );
  },
);
it("library matches Hindi and excludes unknown topics", () => {
  expect(searchGuidance("मास्क").length).toBeGreaterThan(0);
  expect(searchGuidance("mask", "unrecognized")).toEqual([]);
});
it.each(guidanceTopics)("topic filter only returns $id guidance", ({ id }) => {
  const items = searchGuidance("", id);
  expect(items.length).toBeGreaterThan(0);
  expect(items.every((item) => item.category === id)).toBe(true);
});
it("empty search returns all guidance and unrecognized words return none", () => {
  expect(searchGuidance("")).toEqual(knowledge);
  expect(searchGuidance("nonexistentxyz")).toEqual([]);
  expect(searchGuidance(" ".repeat(200) + "nonexistentxyz")).toEqual(knowledge);
});
it("profile feedback names fields, bounds and their navigation step", () => {
  expect(profileIssues({ ...baseProfile, roomArea: 0 }, false)).toEqual([
    {
      key: "roomArea",
      label: "Room floor area (m²)",
      message: "Enter a number from 5 to 150.",
      step: 1,
    },
  ]);
  expect(
    profileIssues({ ...baseProfile, adults: 1.5 }, false)[0]?.message,
  ).toContain("whole number");
  expect(profileIssues(baseProfile, false)).toEqual([]);
});
it("child-age feedback deduplicates array failures and identifies count mismatches", () => {
  const ageIssues = profileIssues(
    { ...baseProfile, children: 2, childAges: [NaN, 19] },
    false,
  );
  expect(ageIssues).toHaveLength(1);
  expect(ageIssues[0]?.step).toBe(0);
  expect(ageIssues[0]?.message).toContain("0 to 17");
  expect(
    profileIssues({ ...baseProfile, children: 1, childAges: [5, 8] }, false)[0]
      ?.message,
  ).toContain("at most 1");
});
it("profile feedback is localized for bounds, fractions and child ages", () => {
  expect(profileIssues({ ...baseProfile, roomArea: 0 }, true)[0]?.label).toBe(
    "कमरा क्षेत्र (m²)",
  );
  expect(
    profileIssues({ ...baseProfile, adults: 1.5 }, true)[0]?.message,
  ).toContain("पूर्ण");
  expect(
    profileIssues({ ...baseProfile, children: 1, childAges: [NaN] }, true)[0]
      ?.message,
  ).toContain("0 से 17");
  expect(
    profileIssues({ ...baseProfile, children: 1, childAges: [5, 8] }, true)[0]
      ?.message,
  ).toContain("अधिकतम 1");
});
