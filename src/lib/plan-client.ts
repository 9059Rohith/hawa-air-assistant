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
  const response = await fetch("/api/plan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      profile,
      location,
      offline: false,
      ...planAirInput(location, air),
    }),
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

function planAirInput(location: Location, air: Air) {
  switch (air.source) {
    case "open-meteo":
      return {};
    case "open-meteo-browser":
      return { browserAir: { location, air } };
    case "manual":
    case "demo":
      return { localAir: air };
  }
}

function validateAirContext(result: Air, input: Air) {
  if (result.source !== input.source)
    throw new Error("The returned plan changed its air-data source");
  if (input.source === "open-meteo") return; // The server fetches a current reading.
  const expected =
    input.source === "open-meteo-browser" && result.stale
      ? { ...input, stale: true }
      : input;
  if (!airSnapshotsMatch(result, expected))
    throw new Error("The returned plan changed the requested air snapshot");
}
