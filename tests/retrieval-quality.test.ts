// @vitest-environment node
import { expect, it } from "vitest";
import { retrieveGuidance, localChat } from "@/lib/chat-guidance";
import { baseProfile } from "@/data/personas";
import { knowledge } from "@/data/knowledge";

const ids = (query: string) => retrieveGuidance(query).map((item) => item.id);
it.each([
  "How should a mask fit?",
  "masks fitting",
  "fit MASK",
  "ｍａｓｋ ｆｉｔ",
  "मास्क फिट",
])("keeps specific mask-fit questions focused: %s", (query) => {
  expect(ids(query)).toEqual(["mask-fit"]);
});
it.each([
  ["car", "carpool", "co-alarm"],
  ["cars", "carpool", "coal-safety"],
  ["pet", "pets", "wet-mop"],
  ["buses", "transit", "coal-safety"],
  ["बस", "transit", "coal-safety"],
  ["CO", "co-alarm", "carpool"],
  ["CO alarms", "co-alarm", "carpool"],
  ["coal indoors", "coal-safety", "co-alarm"],
  ["kitchen exhaust", "exhaust", "pets"],
  ["forecasts", "forecast", "pets"],
])("ranks relevant whole-word guidance for %s", (query, first, excluded) => {
  expect(ids(query)[0]).toBe(first);
  expect(ids(query)).not.toContain(excluded);
});
it.each([
  "constructor",
  "prototype",
  "quantum cryptocurrency",
  "",
  "how should the",
  "！！！",
])("returns no invented relevance for %s", (query) =>
  expect(ids(query)).toEqual([]),
);
it.each(["धुआँ", "धुआं", "धुएँ", "धुएं"])(
  "retains Hindi smoke inflections: %s",
  (query) => {
    expect(ids(query)).toEqual(ids("धुआँ"));
    expect(ids(query).length).toBeGreaterThan(0);
  },
);
it("is insensitive to repetition, word order and zero-width characters", () => {
  expect(ids("mask mask fit fit")).toEqual(ids("fit mask"));
  expect(ids("ma\u200bsk fit")).toEqual(ids("mask fit"));
});
it("bounds oversized input before tokenization", () => {
  expect(ids("x".repeat(800) + " mask fit")).toEqual([]);
});
it("unmatched filler does not dilute a specific supported question", () => {
  expect(ids("mask fit unknownxyz")).toEqual(["mask-fit"]);
});
it("results stay bounded, unique, deterministic and drawn from the corpus", () => {
  const original = knowledge.map((item) => item.id);
  for (const query of ["air", "smoke", "filter", "school", "धुआँ"]) {
    const result = ids(query);
    expect(result.length).toBeLessThanOrEqual(4);
    expect(new Set(result).size).toBe(result.length);
    expect(result.every((id) => original.includes(id))).toBe(true);
    expect(ids(query)).toEqual(result);
  }
  expect(knowledge.map((item) => item.id)).toEqual(original);
});
it.each(["en", "hi"] as const)(
  "local %s answers cite only the selected fit guidance",
  (lang) => {
    const response = localChat(
      lang === "hi" ? "मास्क फिट" : "How should a mask fit?",
      { ...baseProfile, lang },
    );
    expect(
      [...response.text.matchAll(/\[kb:([\w-]+)\]/g)].map((match) => match[1]),
    ).toEqual(["mask-fit"]);
    expect(response.mode).toBe("rules");
  },
);
