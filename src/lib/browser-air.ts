import { LocationSchema, type Air, type Location } from "@/domain/types";
import { airUrl, parseAir } from "./air-data";
import { AppError } from "./errors";

/** Tab-memory only: no persistent location history and no shared-host egress. */
export function createBrowserAirClient() {
  const cache = new Map<string, { air: Air; at: number }>();
  const pending = new Map<string, Promise<Air>>();
  let retryAt = 0;
  const unavailable = () =>
    new AppError(
      "AIR_PROVIDER",
      503,
      "Live air is temporarily unavailable. Wait before retrying or enter a manual reading.",
    );
  return async function loadAir(input: Location): Promise<Air> {
    const location = LocationSchema.parse(input);
    const key = `${location.lat.toFixed(2)},${location.lon.toFixed(2)}`;
    const saved = cache.get(key);
    const age = saved ? Date.now() - saved.at : Infinity;
    if (saved && age < 900000) return saved.air;
    if (Date.now() < retryAt) {
      if (saved && age < 10800000) return { ...saved.air, stale: true };
      throw unavailable();
    }
    const existing = pending.get(key);
    if (existing) return existing;
    const request = (async () => {
      try {
        const response = await fetch(airUrl(location), {
          mode: "cors",
          credentials: "omit",
          referrerPolicy: "no-referrer",
          redirect: "error",
          signal: AbortSignal.timeout(8000),
        });
        if (!response.ok) {
          const raw = response.headers.get("Retry-After");
          const seconds =
            raw && /^\d+$/.test(raw)
              ? Number(raw)
              : raw
                ? (Date.parse(raw) - Date.now()) / 1000
                : 0;
          retryAt =
            Date.now() +
            Math.max(60000, Number.isFinite(seconds) ? seconds * 1000 : 0);
          throw unavailable();
        }
        const air = parseAir(await response.json(), "open-meteo-browser");
        cache.delete(key);
        cache.set(key, { air, at: Date.now() });
        if (cache.size > 20) cache.delete(cache.keys().next().value!);
        return air;
      } catch (error) {
        retryAt = Math.max(retryAt, Date.now() + 60000);
        if (saved && age < 10800000) return { ...saved.air, stale: true };
        throw error;
      } finally {
        pending.delete(key);
      }
    })();
    pending.set(key, request);
    return request;
  };
}
export const loadBrowserAir = createBrowserAirClient();
