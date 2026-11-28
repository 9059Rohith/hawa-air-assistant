import { createHash } from "node:crypto";
import { RequestSchema, type Plan } from "@/domain/types";
import { knowledge } from "@/data/knowledge";
import { selectActions } from "@/domain/select";
import { assemblePlan } from "@/lib/plan-assembly";
import { resolvePlanAir } from "./plan-air";
import { language, PROMPT_VERSION } from "./llm";
import { Cache } from "./cache";
import { aqi, bestWindow } from "@/domain/aqi";
const cache = new Cache<Plan>();
export async function buildPlan(input: unknown, signal?: AbortSignal) {
  const request = RequestSchema.parse(input);
  const { profile, location } = request;
  const air = await resolvePlanAir(request);
  const forecastWindow = bestWindow(air.hourly);
  const key = createHash("sha256")
    .update(
      JSON.stringify([
        profile,
        { lat: location.lat.toFixed(2), lon: location.lon.toFixed(2) },
        air.pm25,
        air.source,
        air.stale,
        forecastWindow,
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
          forecastWindow,
        },
        signal,
      );
  const plan = assemblePlan(profile, location, air, actions, writing);
  cache.set(key, plan);
  return plan;
}
