# Verification strategy

Run `npm ci`, `npm run lint`, `npm run typecheck`, `npm run test:coverage`, `npm run build`, `npm run test:e2e`, `npm run scan-secrets`, `npm run check-repo-size` and `npm audit`.

Coverage includes **all `src/**/*.ts` and `src/**/*.tsx` files**, including unexecuted route shells. Gates: overall lines ≥85%; every domain file group has 100% lines, statements, branches and functions. Tests cover actual error outcomes and invariants rather than mirroring implementation snapshots.

The e2e suite exercises manual data through generated rules plans, action toggles, cited chat, Hindi switching, every route's reflow and community/purifier controls on desktop and mobile. Air/AI service tests mock network responses, while `reports/live-ai.json` records one real provider-backed plan separately.

With the built server running, `node scripts/browser-audit.mjs` checks axe across five routes and three themes, records runtime errors, and produces ignored visual screenshots. `node scripts/check-contrast.mjs` checks palette pairs. `npm run check-bundle` reads actual script tags, excludes legacy `nomodule` scripts that modern browsers do not execute, deduplicates and gzips the build assets.

CI has read-only repository permissions. Its account-level execution status is reported separately from local test success.
