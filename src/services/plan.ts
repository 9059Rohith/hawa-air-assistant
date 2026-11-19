import { createHash } from "node:crypto";
import { RequestSchema, type Plan } from "@/domain/types";
import { knowledge } from "@/data/knowledge";
import { selectActions } from "@/domain/select";
import { planImpact } from "@/domain/impact";
import { getAir, manualAir } from "./air";
import { language, PROMPT_VERSION } from "./llm";
import { Cache } from "./cache";
import { AppError } from "@/lib/errors";
import { aqi, bestWindow } from "@/domain/aqi";
const cache = new Cache<Plan>();
export async function buildPlan(input: unknown, signal?: AbortSignal) {
  const request = RequestSchema.parse(input);
  const { profile, location } = request;
  const snapshot = request.browserAir;
  if (snapshot) {
    const age = Date.now() - Date.parse(snapshot.air.fetchedAt);
    if (
      request.manualPm !== undefined ||
      age < -60000 ||
      age > 10800000 ||
      snapshot.location.lat.toFixed(2) !== location.lat.toFixed(2) ||
      snapshot.location.lon.toFixed(2) !== location.lon.toFixed(2)
    )
      throw new AppError(
        "AIR_SNAPSHOT",
        400,
        "Refresh air data for the selected location before building a plan.",
      );
  }
  const air = snapshot
    ? {
        ...snapshot.air,
        stale:
          snapshot.air.stale ||
          Date.now() - Date.parse(snapshot.air.fetchedAt) >= 900000,
      }
    : request.manualPm === undefined
      ? await getAir(location)
      : manualAir(request.manualPm);
  const key = createHash("sha256")
    .update(
      JSON.stringify([
        profile,
        { lat: location.lat.toFixed(2), lon: location.lon.toFixed(2) },
        air.pm25,
        request.offline,
        PROMPT_VERSION,
        new Date().toISOString().slice(0, 10),
      ]),
    )
    .digest("hex");
  const saved = cache.get(key, 1800000);
  if (saved) return { ...saved, air, location };
  const actions = selectActions(knowledge, profile, air.pm25);
  const writing = request.offline
    ? null
    : await language(
        actions,
        profile,
        undefined,
        {
          tier: aqi(air.pm25).label,
          source: air.source,
          stale: air.stale,
          forecastWindow: bestWindow(air.hourly),
        },
        signal,
      );
  const plan: Plan = {
    headline:
      writing?.headline ??
      (profile.lang === "hi" ? "आज की साफ हवा योजना" : "Your smog game plan"),
    summary:
      writing?.summary ??
      (profile.lang === "hi"
        ? "घर, सफ़र और मोहल्ले के लिए छोटे कदम। अनुमान को माप या चिकित्सा सलाह न मानें।"
        : "Practical steps for your home, journey and neighbourhood. Estimates explain scenarios; they do not measure personal exposure."),
    actions: actions.map((a) => ({
      ...a,
      why:
        writing?.actions.find((w) => w.id === a.id)?.why ??
        (profile.lang === "hi" ? a.hi.summary : a.summary),
    })),
    generatedBy: writing ? "llm" : "rules",
    air,
    profile,
    location,
    impact: planImpact(actions, profile, air.pm25),
    createdAt: new Date().toISOString(),
  };
  cache.set(key, plan);
  return plan;
}
