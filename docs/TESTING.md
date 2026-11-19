# Verification strategy

Run `npm ci`, `npm run lint`, `npm run typecheck`, `npm run test:coverage`, `npm run build`, `npm run test:e2e`, `npm run scan-secrets`, `npm run check-repo-size` and `npm audit`.

Coverage includes **all `src/**/*.ts` and `src/**/*.tsx` files**, including unexecuted route shells. Gates: overall lines ≥90%, statements ≥85%, branches ≥80% and functions ≥80%; every domain file group has 100% lines, statements, branches and functions. Tests cover actual error outcomes and invariants rather than mirroring implementation snapshots.

`npm run eval` executes 87 offline acceptance scenarios with 1,111 explicit checks, zero model calls, per-case outcomes, source identity and a dirty-working-tree indicator. `npm run test:coverage` also runs this evaluation, so the existing CI gate fails on an unsuccessful scenario. The 403 Vitest cases include these same 87 scenario cases plus 316 unit/component/API/contract tests; do not add the scenario count twice. The CLI writes `reports/scenarios.json`. These are deterministic software checks, not clinical validation or an LLM quality score.

The rubric regressions cover punctuation and Unicode retrieval, obfuscated output guards, unavailable transit/work-from-home recommendations, cancellation of pending response streams, late responses after Stop, history isolation, unmount cleanup and immediate network-free urgent guidance. The browser suite also checks urgent English text, punctuated Hindi questions and grounded fallback after a failed chat request.

The e2e suite exercises manual data through generated rules plans, action toggles, cited chat, Hindi switching, every route's reflow and community/purifier controls on desktop and mobile. Air/AI service tests mock network responses, while `reports/live-ai.json` records one real provider-backed plan separately.

With the built server running, `node scripts/browser-audit.mjs` checks axe across five routes and three themes, records runtime errors, and produces ignored visual screenshots. `node scripts/check-contrast.mjs` checks palette pairs. `npm run check-bundle` reads actual script tags, excludes legacy `nomodule` scripts that modern browsers do not execute, deduplicates and gzips the build assets.

CI has read-only repository permissions. Its account-level execution status is reported separately from local test success.

The expanded 32-test desktop/mobile suite includes validation focus and correction, storage denial, preference persistence, public-share validation, JSON export/impact agreement, malformed successful API data, provider errors and keyboard skip/Escape. Unit regressions verify that Clear, preference changes and unmount cancel plan work without late results. `tests/input-contracts.test.ts` uses independently specified product limits; parameterized cases are counted separately. `tests/efficiency.test.ts` proves single-flight coalescing, bounded outstanding work, cleanup after failures and conservative model reservations before every attempt. No paid model calls are used by these tests.
