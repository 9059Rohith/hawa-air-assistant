# Architecture

Next.js route shells render semantic pages; small client components own interaction. `domain/` contains pure functions and contracts; `services/` contains server network IO, validation, caches and model access. API handlers remain thin. AI and geocoding use same-origin handlers. Keyless air retrieval uses Open-Meteo's public CORS endpoint directly from the visitor's browser, avoiding a shared server egress bottleneck without using a proxy or rotating identities.

`lib/browser-air.ts` caches up to 20 rounded locations in tab memory for 15 minutes, deduplicates concurrent requests and honors `Retry-After` with a minimum one-minute cooldown. It makes no automatic retries. Failed refreshes may return explicitly stale data up to three hours old; older data is rejected. The shared parser validates concentration ranges, timestamps and matching forecast arrays. Browser requests omit credentials and referrers.

Plan requests may contain a bounded `browserAir` snapshot. The server validates its schema, location match and fetch age, rejects conflicting manual inputs, recomputes staleness, and preserves the `open-meteo-browser` provenance. It does not claim independent verification of client input. The existing server air endpoint remains available for API clients but may encounter its upstream provider quota. No API key or AI secret reaches browser code.

The home route defers schema-validation code until a user searches, loads air or restores saved preferences. Chat is dynamically loaded when opened. No chart/UI framework is bundled. System fonts provide local Latin/Devanagari coverage without remote font calls; glyph appearance depends on the device.

Plans first choose feasible curated actions, then compute deterministic impacts, then optionally ask OpenAI to explain the allowed actions. Schema validation checks the exact set of IDs and limits generated text. Failed language calls use the same bilingual knowledge base. Chat retrieves four relevant entries, requests validated explanations grounded in the question, then delivers SSE chunks. **SSE delivery follows output validation; raw model tokens are not streamed to the user.** This deliberately trades some first-token speed for a guardable response.

Air responses cache for fifteen minutes; a last-good response may be served for up to three hours with an explicit stale flag. All caches are bounded and process-local. No cross-user persistent database is used. Plan cache keys hash full relevant profile input and rounded location, concentration, date, offline flag and prompt version. Plans are never publicly HTTP cached.

## Code quality and response boundaries

`npm run lint` includes a TypeScript-AST dependency check: pure domain modules cannot reach UI/server infrastructure, client entry points cannot reach server services or environment secrets, and local import cycles fail the check. Core service and library functions also enforce cyclomatic complexity ≤15, nesting depth ≤3 and at most 100 nonblank, noncomment lines. Bilingual presentation components are outside those function-size gates; this is not a claim that every component is equally small.

`lib/plan-assembly.ts` is the shared deterministic assembly boundary for online and local fallback plans. `Plan` is inferred from its runtime Zod schema. Household age/count consistency is validated at that boundary, not only in the form. Plan-cache identity also includes air provenance, staleness and the forecast window used by personalization.

`services/llm-contract.ts` owns prompt construction, language parsing and grounding. The orchestration module owns retry, timeout and token reservations. `lib/streams.ts` bounds upstream JSON bodies to 256 KiB with an eight-second body deadline; request JSON is capped at 8 KiB with a five-second body deadline. These limits supplement the existing upstream request timeout.

`hooks/useChat.ts` owns cancellation, transient history and a 30-second client deadline. `lib/chat-stream.ts` decodes fragmented UTF-8/SSE, validates event shapes, bounds event/answer/stream sizes and requires an explicit completion marker. Truncated or malformed streams switch to cited local guidance. Changing the plan or language preferences resets prior conversation context.
