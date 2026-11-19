import type { Action, Profile, Impact } from "./types";
/** Scenario factors, deliberately not claimed as India-specific measured inventories. */
export const transportFactors = {
  car: 0.17,
  bus: 0.1,
  metro: 0.035,
  cycle: 0,
  walk: 0,
  ev: 0.09,
  motorcycle: 0.1,
} as const;
export function purifierSize(area: number, height = 2.7) {
  if (
    !Number.isFinite(area) ||
    area <= 0 ||
    !Number.isFinite(height) ||
    height <= 0
  )
    throw new RangeError("Room dimensions must be positive");
  return {
    min: Math.round(area * height * 4),
    max: Math.round(area * height * 5),
    volume: area * height,
  };
}
/** Ambient-only steady-state illustration, excludes cooking particles and gases. */
export function exposure(
  pm: number,
  hours: number,
  infiltration: number,
  cadr: number,
  volume: number,
  mask = 1,
) {
  if (
    [pm, hours, infiltration, cadr, volume, mask].some(
      (n) => !Number.isFinite(n),
    ) ||
    pm < 0 ||
    hours < 0 ||
    hours > 24 ||
    infiltration < 0 ||
    infiltration > 1 ||
    cadr < 0 ||
    volume <= 0 ||
    mask < 0 ||
    mask > 1
  )
    throw new RangeError("Invalid exposure scenario");
  const indoor = pm * infiltration * (0.5 / (0.5 + cadr / volume));
  return pm * hours * mask + indoor * (24 - hours);
}
/** Apply each effect once, then recompute one combined scenario to avoid double counting. */
export function planImpact(
  actions: Pick<Action, "id" | "effect">[],
  p: Profile,
  pm: number,
): Impact {
  const effects = new Set(actions.map((a) => a.effect));
  const volume = purifierSize(p.roomArea).volume;
  const infiltration = { sealed: 0.3, typical: 0.5, leaky: 0.7 }[p.sealing];
  const cadr = p.purifier ? p.cadr : 0;
  const baseline = exposure(pm, p.outdoorHours, infiltration, cadr, volume);
  const hours = effects.has("indoor")
    ? Math.max(0, p.outdoorHours - 1)
    : p.outdoorHours;
  const after = exposure(
    pm,
    hours,
    infiltration,
    effects.has("filter") ? Math.max(cadr, volume * 4) : cadr,
    volume,
    effects.has("mask") ? 0.2 : 1,
  );
  const factor = transportFactors[p.mode];
  const baselineFactor =
    p.mode === "car" || p.mode === "ev" ? factor / p.occupancy : factor;
  const alternatives = [baselineFactor];
  if (effects.has("transit") && p.transit)
    alternatives.push(transportFactors.bus);
  if (effects.has("carpool") && p.mode === "car")
    alternatives.push(factor / Math.max(p.occupancy, 2));
  const workFraction = effects.has("remote") ? (7 - p.wfhDays) / 7 : 1;
  return {
    baseline,
    after,
    percent: baseline === 0 ? 0 : ((baseline - after) / baseline) * 100,
    co2KgDay:
      p.km * (baselineFactor - Math.min(...alternatives) * workFraction),
    cigaretteEq: (baseline - after) / 24 / 22,
    selected: [...new Set(actions.map((a) => a.id))],
  };
}
export function communityImpact(
  kg: number,
  households: number,
  adoption: number,
) {
  if (
    ![kg, households, adoption].every(Number.isFinite) ||
    kg < 0 ||
    households < 0 ||
    !Number.isInteger(households) ||
    adoption < 0 ||
    adoption > 100
  )
    throw new RangeError("Invalid community scenario");
  return (kg * 7 * households * adoption) / 100;
}
