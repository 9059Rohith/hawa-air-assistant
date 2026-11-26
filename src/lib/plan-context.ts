import type { Air, Location, Plan, Profile } from "@/domain/types";

/** Compare values, not object insertion order; language alone does not stale a plan. */
export function profilesMatch(
  left: Profile,
  right: Profile,
  includeDisplayPreferences = true,
) {
  const keys = Object.keys(left) as (keyof Profile)[];
  return keys.every(
    (key) =>
      (!includeDisplayPreferences && (key === "lang" || key === "simple")) ||
      JSON.stringify(left[key]) === JSON.stringify(right[key]),
  );
}

/** Keep a generated plan tied to the inputs used to calculate it. */
export function planInputsMatch(
  plan: Plan,
  profile: Profile,
  location: Location | null,
  air: Air | null,
) {
  return (
    !!location &&
    !!air &&
    profilesMatch(plan.profile, profile, false) &&
    locationsMatch(plan.location, location) &&
    airSnapshotsMatch(plan.air, air)
  );
}

export function locationsMatch(left: Location, right: Location) {
  return (
    left.lat === right.lat && left.lon === right.lon && left.name === right.name
  );
}

export function airSnapshotsMatch(left: Air, right: Air) {
  return (
    left.pm25 === right.pm25 &&
    left.source === right.source &&
    left.stale === right.stale &&
    left.timezone === right.timezone &&
    left.fetchedAt === right.fetchedAt &&
    left.observedAt === right.observedAt &&
    left.hourly.length === right.hourly.length &&
    left.hourly.every(
      (hour, index) =>
        hour.time === right.hourly[index]?.time &&
        hour.pm25 === right.hourly[index]?.pm25,
    )
  );
}
