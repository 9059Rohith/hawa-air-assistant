import { knowledge } from "@/data/knowledge";
import type { Profile } from "@/domain/types";
import { urgent, urgentMessage } from "@/domain/safety";
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
  "my",
  "our",
  "are",
  "है",
  "हैं",
  "क्या",
  "कैसे",
  "में",
  "की",
  "का",
  "को",
]);
export function retrieveGuidance(message: string) {
  const words = scrubUserText(message)
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 2 && !ignored.has(w));
  return knowledge
    .map((item) => ({
      item,
      score: words.filter((w) =>
        `${item.id} ${item.title} ${item.summary} ${item.hi.summary} ${item.tags.join(" ")}`
          .toLowerCase()
          .includes(w),
      ).length,
    }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((x) => x.item);
}
export function localChat(message: string, profile: Profile) {
  if (urgent(message))
    return { mode: "urgent", text: urgentMessage[profile.lang] };
  const items = retrieveGuidance(message);
  if (!items.length)
    return {
      mode: "rules",
      text:
        profile.lang === "hi"
          ? "इस सवाल के लिए मेरे स्रोतों में पर्याप्त जानकारी नहीं है। हवा, घर की सफ़ाई, यात्रा या समुदाय के बारे में पूछें।"
          : "I do not have enough grounded information for that question. Ask about air, indoor sources, travel or community actions.",
    };
  return {
    mode: "rules",
    text: items
      .map(
        (a) =>
          `${profile.lang === "hi" ? a.hi.summary : a.summary} [kb:${a.id}]`,
      )
      .join("\n\n"),
  };
}
