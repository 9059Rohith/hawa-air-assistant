import { z } from "zod";
import type { Air, Location } from "@/domain/types";
import { AppError } from "./errors";

const timestamp = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?$/);
const payload = z.object({
  current: z.object({ pm2_5: z.number().min(0).max(10000), time: timestamp }),
  hourly: z
    .object({
      time: z.array(timestamp).max(168),
      pm2_5: z.array(z.number().min(0).max(10000).nullable()).max(168),
    })
    .refine((v) => v.time.length === v.pm2_5.length),
  timezone: z.string().min(1).max(80),
});

export function airUrl(location: Location) {
  return `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${location.lat.toFixed(2)}&longitude=${location.lon.toFixed(2)}&current=pm2_5&hourly=pm2_5&forecast_days=2&timezone=auto`;
}

/** Provider data is modelled concentration, never a fabricated sensor reading. */
export function parseAir(
  value: unknown,
  source: "open-meteo" | "open-meteo-browser",
): Air {
  const parsed = payload.safeParse(value);
  if (!parsed.success)
    throw new AppError(
      "AIR_DATA",
      502,
      "The air provider returned incomplete readings. Enter a manual reading or retry shortly.",
    );
  const data = parsed.data;
  return {
    pm25: data.current.pm2_5,
    hourly: data.hourly.time
      .flatMap((time, i) => {
        const pm25 = data.hourly.pm2_5[i];
        return pm25 !== null && pm25 !== undefined && time >= data.current.time
          ? [{ time, pm25 }]
          : [];
      })
      .slice(0, 48),
    fetchedAt: new Date().toISOString(),
    observedAt: data.current.time,
    timezone: data.timezone,
    source,
    stale: false,
  };
}
