import {
  PlanSchema,
  type Profile,
  type Location,
  type Air,
} from "@/domain/types";
import { readJsonResponse } from "./streams";
import {
  airSnapshotsMatch,
  locationsMatch,
  profilesMatch,
} from "./plan-context";
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
  const plan = PlanSchema.parse(await readJsonResponse(response, deadline));
  if (
    !profilesMatch(plan.profile, profile) ||
    !locationsMatch(plan.location, location)
  )
    throw new Error(
      "The returned plan does not match your household or location",
    );
  validateAirContext(plan.air, air);
  return plan;
}

function validateAirContext(result: Air, input: Air) {
  const expected = input.source === "demo" ? "manual" : input.source;
  if (result.source !== expected)
    throw new Error("The returned plan changed its air-data source");
  if (input.source === "open-meteo") return;
  if (result.pm25 !== input.pm25)
    throw new Error("The returned plan changed your air reading");
  if (
    input.source === "open-meteo-browser" &&
    !airSnapshotsMatch({ ...result, stale: input.stale }, input)
  )
    throw new Error("The returned plan changed the browser's air snapshot");
}
