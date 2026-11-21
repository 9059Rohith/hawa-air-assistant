import { expect, it } from "vitest";
import { knowledge } from "@/data/knowledge";
import { readSharedKit, shareFragment } from "@/lib/share";

const ids = knowledge.map((action) => action.id);
const first = ids[0]!;
const second = ids[1]!;
const hash = (value: unknown) =>
  `#kit=${encodeURIComponent(JSON.stringify(value))}`;

it.each(["profile", "coordinates", "apiKey", "__proto__", "constructor"])(
  "rejects unexpected %s fields instead of accepting private metadata",
  (field) => {
    expect(
      readSharedKit(
        hash({ v: 1, lang: "en", ids: [ids[0]], [field]: "private" }),
        ids,
      ),
    ).toBeNull();
  },
);
it.each([[], ["unknown-action"], Array(11).fill(ids[0])])(
  "refuses to produce an invalid action selection: %j",
  (selection) => expect(() => shareFragment(selection, "en")).toThrow(),
);
it("does not let a caller authorize an unknown catalog ID", () => {
  expect(
    readSharedKit(hash({ v: 1, lang: "en", ids: ["invented"] }), ["invented"]),
  ).toBeNull();
});
it("enforces the caller's narrower allowlist", () => {
  expect(readSharedKit(shareFragment([first], "en"), [second])).toBeNull();
});
it("round trips ten known IDs and serializes only the privacy contract", () => {
  const selected = ids.slice(0, 10);
  const fragment = shareFragment(selected, "hi");
  expect(JSON.parse(decodeURIComponent(fragment.slice(5)))).toEqual({
    v: 1,
    lang: "hi",
    ids: selected,
  });
  expect(readSharedKit(fragment, ids)).toEqual({ lang: "hi", ids: selected });
});
it("deduplicates without mutating the caller's selection", () => {
  const selected = Object.freeze([second, first, second]);
  expect(readSharedKit(shareFragment(selected, "en"), ids)?.ids).toEqual([
    ids[1],
    ids[0],
  ]);
  expect(selected).toHaveLength(3);
});
