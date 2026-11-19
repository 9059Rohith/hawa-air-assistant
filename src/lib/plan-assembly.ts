import { selectActions } from "@/domain/select";
import { planImpact } from "@/domain/impact";
import { knowledge } from "@/data/knowledge";
import type { Profile, Location, Air, Plan, Action } from "@/domain/types";

export type PlanWriting = {
  headline: string;
  summary: string;
  actions: { id: string; why: string }[];
};

/** Shared deterministic assembly keeps local fallback and server results consistent. */
export function assemblePlan(
  profile: Profile,
  location: Location,
  air: Air,
  actions: Action[] = selectActions(knowledge, profile, air.pm25),
  writing?: PlanWriting | null,
): Plan {
  const hi = profile.lang === "hi";
  const explanations = new Map(
    writing?.actions.map((action) => [action.id, action.why]),
  );
  return {
    profile,
    location,
    air,
    generatedBy: writing ? "llm" : "rules",
    headline:
      writing?.headline ?? (hi ? "आज की साफ हवा योजना" : "Your smog game plan"),
    summary:
      writing?.summary ??
      (hi
        ? "आपके घर, सफ़र और मोहल्ले के लिए व्यावहारिक कदम। परिणाम अनुमान हैं, माप नहीं।"
        : "Practical steps for your home, journey and neighbourhood. Results are scenarios, not measurements."),
    actions: actions.map((action) => ({
      ...action,
      why:
        explanations.get(action.id) ??
        (hi ? action.hi.summary : action.summary),
    })),
    impact: planImpact(actions, profile, air.pm25),
    createdAt: new Date().toISOString(),
  };
}
