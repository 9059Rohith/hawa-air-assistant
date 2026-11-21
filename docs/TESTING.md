# Verification strategy

Run `npm ci`, `npm run lint`, `npm run typecheck`, `npm run test:coverage`, `npm run build`, `npm run test:e2e`, `npm run scan-secrets`, `npm run check-repo-size` and `npm audit`.

Coverage includes **all `src/**/*.ts` and `src/**/*.tsx` files**, including unexecuted route shells. Gates: overall lines ≥90%, statements ≥85%, branches ≥80% and functions ≥80%; every domain file group has 100% lines, statements, branches and functions. Tests cover actual error outcomes and invariants rather than mirroring implementation snapshots.

`npm run eval` executes 87 offline acceptance scenarios with 1,111 explicit checks, zero model calls, per-case outcomes, source identity and a dirty-working-tree indicator. `npm run test:coverage` also runs this evaluation, so the existing CI gate fails on an unsuccessful scenario. The 528 Vitest cases include these same 87 scenario cases plus 441 unit/component/API/contract tests; do not add the scenario count twice. The CLI writes `reports/scenarios.json`. These are deterministic software checks, not clinical validation or an LLM quality score.

The rubric regressions cover punctuation and Unicode retrieval, obfuscated output guards, unavailable transit/work-from-home recommendations, cancellation of pending response streams, late responses after Stop, history isolation, unmount cleanup and immediate network-free urgent guidance. The browser suite also checks urgent English text, punctuated Hindi questions and grounded fallback after a failed chat request.

The e2e suite exercises manual data through generated rules plans, action toggles, cited chat, Hindi switching, every route's reflow and community/purifier controls on desktop and mobile. Air/AI service tests mock network responses, while `reports/live-ai.json` records one real provider-backed plan separately.

With the built server running, `node scripts/browser-audit.mjs` checks axe across five routes and three themes, records runtime errors, and produces ignored visual screenshots. `node scripts/check-contrast.mjs` checks palette pairs. `npm run check-bundle` reads actual script tags, excludes legacy `nomodule` scripts that modern browsers do not execute, deduplicates and gzips the build assets.

CI has read-only repository permissions. Its account-level execution status is reported separately from local test success.

The expanded 52-test desktop/mobile suite includes validation focus and correction, storage denial, preference persistence, public-share validation, JSON export/impact agreement, malformed successful API data, provider errors and keyboard skip/Escape. Unit regressions verify that Clear, preference changes and unmount cancel plan work without late results. `tests/input-contracts.test.ts` uses independently specified product limits; parameterized cases are counted separately. `tests/efficiency.test.ts` proves single-flight coalescing, bounded outstanding work, cleanup after failures and conservative model reservations before every attempt. No paid model calls are used by these tests.

The maintainability release adds fragmented UTF-8/CRLF SSE fixtures, malformed event rejection, missing completion markers, bounded bodies, cancellation, plan cache context changes, server/local assembly parity, exact JSON media types, blank-coordinate rejection and cross-field household consistency. A desktop/mobile browser regression verifies that a truncated AI reply is replaced with cited local guidance and the Send control remains usable. `reports/maintainability.json` records the same static-complexity audit before and after the changes; it is not a competition score prediction.

The next code-quality pass extends the complexity-15 gate to all source files. Regression checks exercise clipboard absence, whitespace-normalized guidance search, ceiling-height feedback, child-age synchronization and blank entries, online plan provenance for all four air sources, rejection of oversized plan bodies, response cancellation and error-body cleanup. Desktop/mobile journeys repeat clipboard absence and household-age updates against the actual page.

Discovery/correction regressions cover reordered words, punctuation and full-width text, Hindi retrieval, all six topics, no-match recovery, bounded query input, localized numeric/age errors, duplicate array issues and focus across hidden wizard steps. Desktop and mobile tests exercise correction links and combined search/topic reset.

Location reliability regressions cover delayed city/air/geolocation responses after Clear, Stop, manual entry, Escape and unmount; eight-second header/body deadlines, 256 KiB response limits, excessive/invalid locations, failed-body cleanup and cached-air expiry while refreshing. Desktop/mobile journeys verify manual recovery during stalled search and clearing/restarting lookup. See [ADR 0007](adr/0007-location-request-lifecycle.md).

Chat transport regressions cover exact SSE media types, failed-body cleanup, bounded history/context, absent bodies, pre-cancelled and late fetches, stalled headers/body deadlines and missing or contradictory response modes. Plan/chat lifecycle tests and desktop/mobile journeys switch generation mode while work is pending. Local conversation is not carried across the mode boundary. See [ADR 0008](adr/0008-chat-transport-and-mode-ownership.md).
