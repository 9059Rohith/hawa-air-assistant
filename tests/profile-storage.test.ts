import { expect, it } from "vitest";
import { baseProfile } from "@/data/personas";
import { readProfile } from "@/lib/profile";

it.each(["en", "hi"] as const)(
  "restores recent %s language without discarding saved household inputs",
  (lang) => {
    const saved = {
      ...baseProfile,
      adults: 4,
      lang: lang === "hi" ? "en" : "hi",
    };
    expect(readProfile(JSON.stringify(saved), lang)).toEqual({
      ...saved,
      lang,
    });
  },
);
it.each([null, "", "fr", "<script>"])(
  "keeps the saved language for unsupported preference %s",
  (language) => {
    expect(
      readProfile(JSON.stringify({ ...baseProfile, lang: "hi" }), language)
        .lang,
    ).toBe("hi");
  },
);
it.each([
  "{}",
  "null",
  "[]",
  "malformed",
  JSON.stringify({ ...baseProfile, adults: 0 }),
])("rejects corrupted household data: %s", (value) => {
  expect(() => readProfile(value, "hi")).toThrow();
});
it("bounds storage before parsing and accepts the exact character limit", () => {
  const value = JSON.stringify(baseProfile).padEnd(8192, " ");
  expect(readProfile(value, null)).toEqual(baseProfile);
  expect(() => readProfile(value + " ", null)).toThrow(RangeError);
});
