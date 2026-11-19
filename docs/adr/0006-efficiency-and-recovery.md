# ADR 004: Bounded work and recoverable asynchronous plans

Status: accepted, 19 November 2026.

The first visit does not yet contain an air reading and does not use speech synthesis. Load the detailed air display only when a reading exists; keep read-aloud code in the screens that use it. The initial empty panel remains server-rendered and meaningful. This follows [Next.js 15 conditional lazy-loading guidance](https://nextjs.org/docs/15/app/guides/lazy-loading); no essential form is hidden behind a delayed mount.

Identical server air/geocode requests share one in-flight promise, with a maximum of 32 distinct operations per service per isolate. Both success and rejection remove the promise. Existing bounded TTL caches remain responsible for reuse after completion. Geocode keys normalize whitespace, compatibility characters and case. Different locations are never merged except for the existing two-decimal coordinate precision.

Each model attempt reserves UTF-8 input bytes plus framing allowance and its configured maximum output tokens. UTF-8 bytes are a conservative input-token estimate, not provider-reported usage. Retries reserve again, failures are not refunded, and reservations expire after a rolling minute. Exhaustion produces the same source-grounded rules fallback used for provider failure. The default limit is 24,000 tokens per minute, configurable with `LLM_TOKEN_BUDGET_PER_MIN`. Budgets, caches, concurrency and rate limits are process-local; they do not impose a global account spending cap across Worker isolates.

HTTP plan results must pass the runtime plan schema before rendering. Changing household/location/air state, clearing data or leaving the workspace aborts outstanding plan work. A late response cannot replace a newer state. Clear resets in-memory household and plan state even if browser storage rejects removal; the user sees a storage notice for persistent cleanup.

Evidence: independent input-contract boundaries, single-flight burst/capacity/rejection tests, rolling-token-window and retry-reservation tests, plan lifecycle regressions, desktop/mobile provider-failure and malformed-success flows. The public JavaScript check downloads the actual deployed script bodies and includes global error-handler chunks. No test uses a paid model call.
