import type { Air } from "@/domain/types";

/** Capture the observation time once, when the household selects its reading. */
export function localReading(
  pm25: number,
  source: "manual" | "demo" = "manual",
): Air {
  const timestamp = new Date().toISOString();
  return {
    pm25,
    source,
    observedAt: timestamp,
    fetchedAt: timestamp,
    hourly: [],
    stale: false,
    timezone: source === "demo" ? "Asia/Kolkata" : "UTC",
  };
}
