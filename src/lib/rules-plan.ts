import { selectActions } from "@/domain/select";
import { planImpact } from "@/domain/impact";
import { knowledge } from "@/data/knowledge";
import {
  ProfileSchema,
  LocationSchema,
  AirSchema,
  type Profile,
  type Location,
  type Air,
  type Plan,
} from "@/domain/types";
/** Pure local fallback; does not invent live air or contact a model/provider. */
export function localPlan(
  profile: Profile,
  location: Location,
  air: Air,
): Plan {
  ProfileSchema.parse(profile);
  LocationSchema.parse(location);
  AirSchema.parse(air);
  const hi = profile.lang === "hi";
  const actions = selectActions(knowledge, profile, air.pm25);
  return {
    profile,
    location,
    air,
    generatedBy: "rules",
    headline: hi ? "आज की साफ हवा योजना" : "Your smog game plan",
    summary: hi
      ? "आपके घर, सफ़र और मोहल्ले के लिए व्यावहारिक कदम। परिणाम अनुमान हैं, माप नहीं।"
      : "Practical steps for your home, journey and neighbourhood. Results are scenarios, not measurements.",
    actions: actions.map((a) => ({ ...a, why: hi ? a.hi.summary : a.summary })),
    impact: planImpact(actions, profile, air.pm25),
    createdAt: new Date().toISOString(),
  };
}
