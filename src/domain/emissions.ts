import factors from "@/data/emission-factors.json";
import type { Profile } from "./types";
/** A dated, explicit reference scenario; never a measured current fleet average. */
export function transportFactor(
  p: Pick<Profile, "mode" | "vehicleFuel" | "occupancy">,
) {
  const key =
    p.mode === "car" ? p.vehicleFuel : p.mode === "ev" ? "electric" : p.mode;
  const entry = factors.transport[key];
  const divisor = entry.unit.includes("vehicle") ? p.occupancy : 1;
  return { ...entry, perPerson: entry.value / divisor };
}
/** Converts user-entered fuel input energy, without assuming equal useful heat. */
export function fuelCarbon(
  fuel: keyof typeof factors.fuel | "electric",
  energyKWh: number,
) {
  if (!Number.isFinite(energyKWh) || energyKWh < 0 || energyKWh > 1000)
    throw new RangeError("Invalid input energy");
  return (
    energyKWh *
    (fuel === "electric"
      ? factors.grid.kgCo2PerKWh
      : factors.fuel[fuel].kgCo2PerGJ * 0.0036)
  );
}
