import type { Air, PlanRequest } from "@/domain/types";
import { AppError } from "@/lib/errors";
import { FRESH_AIR_MS, MAX_AIR_AGE_MS } from "@/lib/air-freshness";
import { getAir, manualAir } from "./air";

/** Legacy clients send a scalar. Newer clients retain the original observation. */
export async function resolvePlanAir(request: PlanRequest): Promise<Air> {
  const { localAir, browserAir, manualPm, location } = request;
  if (
    [localAir, browserAir, manualPm].filter((input) => input !== undefined)
      .length > 1
  )
    throw new AppError("AIR_SNAPSHOT", 400, "Choose one source of air data.");
  if (localAir) return localAir;
  if (manualPm !== undefined) return manualAir(manualPm);
  if (!browserAir) return getAir(location);

  const { air, location: origin } = browserAir;
  const age = Date.now() - Date.parse(air.fetchedAt);
  if (
    age < -60_000 ||
    age > MAX_AIR_AGE_MS ||
    origin.lat.toFixed(2) !== location.lat.toFixed(2) ||
    origin.lon.toFixed(2) !== location.lon.toFixed(2)
  )
    throw new AppError(
      "AIR_SNAPSHOT",
      400,
      "Refresh air data for the selected location before building a plan.",
    );
  return { ...air, stale: air.stale || age >= FRESH_AIR_MS };
}
