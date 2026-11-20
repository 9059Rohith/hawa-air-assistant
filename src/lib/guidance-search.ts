import { knowledge } from "@/data/knowledge";
import type { Action } from "@/domain/types";
export const guidanceTopics: { id: Action["category"]; hi: string }[] = [
  { id: "Routine", hi: "दिनचर्या" },
  { id: "Indoor air", hi: "घर की हवा" },
  { id: "Transport", hi: "यात्रा" },
  { id: "Cooking & heating", hi: "खाना और गर्माहट" },
  { id: "Community", hi: "समुदाय" },
  { id: "Health", hi: "स्वास्थ्य" },
];
function normalize(text: string) {
  return text
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}
const index = knowledge.map((item) => ({
  item,
  text: normalize(
    [
      item.title,
      item.summary,
      item.hi.title,
      item.hi.summary,
      ...item.tags,
    ].join(" "),
  ),
}));
/** Index once; bounded, order-independent bilingual search stays on the device. */
export function searchGuidance(query: string, topic = "all"): Action[] {
  const tokens = [
    ...new Set(normalize(query.slice(0, 200)).split(" ").filter(Boolean)),
  ];
  return index
    .filter(
      ({ item, text }) =>
        (topic === "all" || item.category === topic) &&
        tokens.every((token) => text.includes(token)),
    )
    .map(({ item }) => item);
}
