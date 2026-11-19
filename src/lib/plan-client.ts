import {
  PlanSchema,
  type Profile,
  type Location,
  type Air,
} from "@/domain/types";
import { readJsonResponse } from "./streams";
/** Preserve provenance and bound both headers and body for online planning. */
export async function requestPlan(
  profile: Profile,
  location: Location,
  air: Air,
  signal: AbortSignal,
) {
  const deadline = AbortSignal.any([signal, AbortSignal.timeout(35000)]);
  const airInput =
    air.source === "open-meteo-browser"
      ? { browserAir: { location, air } }
      : air.source !== "open-meteo"
        ? { manualPm: air.pm25 }
        : {};
  const response = await fetch("/api/plan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ profile, location, offline: false, ...airInput }),
    signal: deadline,
  });
  if (!response.ok) {
    void response.body?.cancel().catch(() => undefined);
    throw new Error("Plan service unavailable");
  }
  return PlanSchema.parse(await readJsonResponse(response, deadline));
}
