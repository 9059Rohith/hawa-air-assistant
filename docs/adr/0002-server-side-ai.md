# ADR 2: bounded provider boundaries

Accepted. AI credentials stay in server environment variables. Plan/chat requests use same-origin APIs. Model endpoints are restricted to the configured OpenAI, OpenRouter or Groq HTTPS origins, with redirect rejection; browser users cannot choose arbitrary URLs. Output validation and deterministic fallback protect the numeric engine. The default deployed provider is OpenAI; alternate providers are configurable, not claimed live-tested.

Air readings use a keyless browser request to the single CSP-allowlisted Open-Meteo origin. This avoids shared-host IP quota exhaustion. Open-Meteo sees the browser IP and rounded coordinates; this is disclosed before use. A tab-memory cache, request deduplication and Retry-After cooldown bound requests. Plans accept only schema-validated, fresh, coordinate-matching browser estimates and retain their distinct provenance. The server does not independently authenticate those public model values.

Request bodies have strict size/type/origin/schema checks and a five-second read deadline. The replaceable sliding-window limiter is process-local, hashes client identifiers, and returns Retry-After. A trusted proxy must overwrite forwarding headers; shared/distributed enforcement is still a separate deployment concern.
