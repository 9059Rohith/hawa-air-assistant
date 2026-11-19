# Architecture

Next.js route shells render semantic pages; small client components own interaction. `domain/` contains pure functions and contracts; `services/` contains network IO, validation, caches and model access. API handlers remain thin. External browser requests go through same-origin handlers.

The home route defers schema-validation code until a user searches, loads air or restores saved preferences. Chat is dynamically loaded when opened. No chart/UI framework is bundled. System fonts provide local Latin/Devanagari coverage without remote font calls; glyph appearance depends on the device.

Plans first choose feasible curated actions, then compute deterministic impacts, then optionally ask OpenAI to explain the allowed actions. Schema validation checks the exact set of IDs and limits generated text. Failed language calls use the same bilingual knowledge base. Chat retrieves four relevant entries, requests validated explanations grounded in the question, then delivers SSE chunks. **SSE delivery follows output validation; raw model tokens are not streamed to the user.** This deliberately trades some first-token speed for a guardable response.

Air responses cache for fifteen minutes; a last-good response may be served for up to three hours with an explicit stale flag. All caches are bounded and process-local. No cross-user persistent database is used. Plan cache keys hash full relevant profile input and rounded location, concentration, date, offline flag and prompt version. Plans are never publicly HTTP cached.
