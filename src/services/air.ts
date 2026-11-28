import { FRESH_AIR_MS, MAX_AIR_AGE_MS } from "@/lib/air-freshness";
import { z } from "zod";
import { readJsonResponse } from "@/lib/streams";
import { Cache } from "./cache";
import { safeFetch } from "./http";
import type { Air, Location } from "@/domain/types";
import { AppError } from "@/lib/errors";
import { airUrl, parseAir } from "@/lib/air-data";
import { SingleFlight } from "./single-flight";
const cache = new Cache<Air>();
const airFlight = new SingleFlight<Air>();
export async function getAir(location: Location): Promise<Air> {
  const lat = location.lat.toFixed(2),
    lon = location.lon.toFixed(2),
    key = `${lat},${lon}`;
  const fresh = cache.get(key, FRESH_AIR_MS);
  if (fresh) return fresh;
  return airFlight.run(key, async () => {
    try {
      const response = await safeFetch(airUrl(location));
      if (!response.ok)
        throw new AppError(
          "AIR_PROVIDER",
          502,
          `Air data is temporarily unavailable (provider ${response.status}). Enter a manual reading or retry shortly.`,
        );
      const air = parseAir(await readJsonResponse(response), "open-meteo");
      cache.set(key, air);
      return air;
    } catch (error) {
      const stale = cache.get(key, MAX_AIR_AGE_MS);
      if (stale) return { ...stale, stale: true };
      throw error;
    }
  });
}
export { localReading as manualAir } from "@/lib/local-reading";
const geo = z.object({
  results: z
    .array(
      z.object({
        name: z.string(),
        latitude: z.number(),
        longitude: z.number(),
        country: z.string().optional(),
        admin1: z.string().optional(),
      }),
    )
    .optional(),
});
const geocache = new Cache<Location[]>();
const geoFlight = new SingleFlight<Location[]>();
export async function geocode(q: string) {
  const key = q.trim().normalize("NFKC").toLowerCase();
  const cached = geocache.get(key, 86400000);
  if (cached) return cached;
  return geoFlight.run(key, async () => {
    const response = await safeFetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(key)}&count=5&language=en&format=json`,
    );
    if (!response.ok) throw new Error("Geocoding unavailable");
    const data = geo.parse(await readJsonResponse(response));
    const results = (data.results ?? []).map((r) => ({
      name: [r.name, r.admin1, r.country]
        .filter(Boolean)
        .join(", ")
        .slice(0, 100),
      lat: r.latitude,
      lon: r.longitude,
    }));
    geocache.set(key, results);
    return results;
  });
}
