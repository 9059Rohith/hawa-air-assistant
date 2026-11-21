import type { Profile } from "@/domain/types";
import { urgent, urgentMessage } from "@/domain/safety";
import { retrieveGuidance } from "./guidance-retrieval";
export { retrieveGuidance } from "./guidance-retrieval";
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
