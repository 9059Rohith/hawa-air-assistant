import { AppError } from "@/lib/errors";
const hosts = new Set([
  "api.openai.com",
  "openrouter.ai",
  "api.groq.com",
  "air-quality-api.open-meteo.com",
  "geocoding-api.open-meteo.com",
]);
export async function safeFetch(
  url: string,
  init: RequestInit = {},
  timeout = 8000,
) {
  const parsed = new URL(url);
  if (
    parsed.protocol !== "https:" ||
    !hosts.has(parsed.hostname) ||
    parsed.username ||
    parsed.password ||
    parsed.port
  )
    throw new AppError("DESTINATION", 400, "Unsupported data provider");
  // Workers supports manual redirects, but rejects redirect: "error".
  // Inspect the response without ever following an untrusted Location URL.
  const response = await fetch(url, {
    ...init,
    redirect: "manual",
    signal: AbortSignal.any([
      AbortSignal.timeout(timeout),
      ...(init.signal ? [init.signal] : []),
    ]),
  });
  if (response.status >= 300 && response.status < 400) {
    await response.body?.cancel();
    throw new AppError(
      "UPSTREAM_REDIRECT",
      502,
      "The data provider redirected unexpectedly.",
    );
  }
  return response;
}
