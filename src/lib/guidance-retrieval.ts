import { knowledge } from "@/data/knowledge";
import { scrubUserText } from "./guard";

const ignored = new Set([
  "the",
  "and",
  "can",
  "how",
  "what",
  "should",
  "with",
  "for",
  "that",
  "this",
  "about",
  "have",
  "your",
  "you",
  "our",
  "are",
  "does",
  "please",
  "है",
  "हैं",
  "क्या",
  "कैसे",
  "में",
  "की",
  "का",
  "को",
]);
// Explicit variants preserve common questions without unrestricted stemming.
const variants = new Map([
  ["masks", "mask"],
  ["respirators", "respirator"],
  ["filters", "filter"],
  ["fitting", "fit"],
  ["fitted", "fit"],
  ["pets", "pet"],
  ["schools", "school"],
  ["windows", "window"],
  ["alarms", "alarm"],
  ["buses", "bus"],
  ["बस", "bus"],
  ["cars", "car"],
  ["children", "child"],
  ["forecasts", "forecast"],
  ["धुएँ", "धुआँ"],
  ["धुएं", "धुआँ"],
  ["धुआं", "धुआँ"],
]);
function terms(text: string): Set<string> {
  const words =
    text
      .normalize("NFKC")
      .toLowerCase()
      .match(/[\p{L}\p{M}\p{N}]+/gu) ?? [];
  return new Set(
    words
      .map((word) => variants.get(word) ?? word)
      .filter(
        (word) => (word.length > 2 || word === "co") && !ignored.has(word),
      ),
  );
}
const index = knowledge.map((item, order) => ({
  item,
  order,
  heading: terms(`${item.id} ${item.title}`),
  body: terms(
    `${item.id} ${item.title} ${item.summary} ${item.hi.title} ${item.hi.summary} ${item.tags.join(" ")}`,
  ),
}));

/** Indexed whole words; retain the strongest query coverage before tie-breaking. */
export function retrieveGuidance(message: string) {
  const query = [...terms(scrubUserText(message.slice(0, 800)))];
  if (!query.length) return [];
  const matches = index.map((entry) => ({
    ...entry,
    coverage: query.filter((word) => entry.body.has(word)).length,
    headingMatches: query.filter((word) => entry.heading.has(word)).length,
  }));
  const bestCoverage = Math.max(...matches.map((match) => match.coverage));
  if (!bestCoverage) return [];
  return matches
    .filter((match) => match.coverage === bestCoverage)
    .sort((a, b) => b.headingMatches - a.headingMatches || a.order - b.order)
    .slice(0, 4)
    .map((match) => match.item);
}
