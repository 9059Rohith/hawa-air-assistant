import { LocationSchema } from "@/domain/types";
import { readJsonResponse } from "./streams";

/** One deadline covers headers and body; untrusted city data stays bounded. */
export async function searchLocations(query: string, signal: AbortSignal) {
  signal.throwIfAborted();
  const deadline = AbortSignal.any([signal, AbortSignal.timeout(8000)]);
  const response = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`, {
    signal: deadline,
  });
  if (!response.ok) {
    void response.body?.cancel().catch(() => undefined);
    throw new Error("Location search unavailable");
  }
  return LocationSchema.array()
    .max(10)
    .parse(await readJsonResponse(response, deadline));
}
