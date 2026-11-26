# Verified quality report — 27 November 2026

Observed software evidence, not an evaluation-score or ranking prediction. The portal was inspected on 19 November 2026: **96.94/100**, rank **#32/53,969**, with **code quality 89** as the lowest category. This follow-up targets maintainability and response handling; a new official score requires owner resubmission.

## Plan consistency and submission readiness

This update preserves the existing HAWA application, public URL and repository. Changed household, location or air inputs now mark the previous plan outdated and require rebuilding through the validated wizard before export or follow-up. Community projections use only current inputs. Online responses are bound to the requested household, location and air provenance. Print, JSON and copied summaries agree on selected actions; empty outputs are disabled. Bilingual summaries retain source, timestamps, units and scenario limits, with selectable text when clipboard access fails. [Decision and regression boundaries](adr/0012-plan-context-and-output-consistency.md).

Local verification: **663/663 Vitest cases** (576 unit/component/API/contract cases plus the same 87 acceptance scenarios), **95.89% overall line coverage**, **100% domain coverage**, **70/70 desktop/mobile browser tests**, and **24 axe page/theme/plan states with zero detected violations or runtime errors**. Strict types, lint, production build, contrast and the unchanged **117,500-byte** home JavaScript gate pass; measured home scripts remain **117,494 gzip bytes**. The initial full unit run passed 662 cases; after adding a refreshed-air regression, a concurrent build/coverage run timed out before one existing city-search request began. The final complete coverage run with two workers passed all 663, retaining the same assertions and coverage thresholds.

See `reports/submission-readiness.json`, `reports/submission-local-accessibility.json` and [ready-to-copy submission fields](SUBMISSION_COPY.md). These automated checks do not establish clinical accuracy, independent assistive-technology review or a new official competition score.

Production version **19**, source `eb154df123ac2800b76564f00c6b0a2486f045bb`, passes **70/70 desktop/mobile browser tests** with zero skipped or flaky cases. All **24 production axe states** have zero detected violations and runtime errors; production home scripts remain **117,494 gzip bytes**. One unmocked production plan passed the shipped client’s schema and request-context checks, returning ten actions in mode `llm` in **6,987 ms**. This is one integration sample, not a latency or model-quality guarantee. See `reports/production-e2e.json`, `reports/submission-production-accessibility.json`, `reports/submission-production-ai.json` and `reports/deployment.json`. The existing public captioned demo still demonstrates the core app flows; the new stale-plan and export regressions are covered separately.

## Previous version 18 baseline

| Check                                        | Current release result                                                                                              |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Strict TypeScript                            | Pass                                                                                                                |
| ESLint + Prettier                            | Pass                                                                                                                |
| Unit/component/API tests                     | **620 passed (533 unit/component/API/contract + 87 acceptance cases)**                                              |
| Entire production source coverage            | **95.35% lines**, 93.99% statements, 88.47% branches, 92.72% functions                                              |
| Domain coverage                              | **100% lines, statements, branches and functions** for AQI, emissions, impact, safety, selection and schemas        |
| Production build + OpenNext Worker packaging | Pass                                                                                                                |
| Desktop/mobile end-to-end tests              | **64 production tests passed**, including urgent/Hindi chat and 320px keyboard/offline journey and script-size gate |
| axe                                          | **15 page/theme states, zero detected violations**                                                                  |
| Runtime errors in browser audit              | **0**                                                                                                               |
| Text/surface contrast                        | All 12 checked pairs exceed 4.5:1                                                                                   |
| Modern home JavaScript                       | **117,494 gzip bytes (114.7 KiB)**; budget 117,500 bytes                                                            |
| Dependency audit                             | **0 reported vulnerabilities**                                                                                      |
| Working-tree and Git-history secret patterns | **0 matches**; 656 historical blobs scanned after the application commit                                            |
| Build artifact credential scan               | **0 matches across 46 files**                                                                                       |
| Submission source                            | Approximately **1.1 MB**, below 10 MB; source-size gate is stricter at 8 MB                                         |
| Hosted CI                                    | Workflow active; GitHub account billing lock prevents job execution                                                 |

Coverage includes unexecuted route shells; low-coverage files are not hidden. Full coverage means tested code paths, not proof of medical accuracy. CI runs contrast checks before browser tests and includes the browser JavaScript-size gate.

## Six-criterion comparison update

The comparison with Challenge 5 led to stronger cancellation ownership, immediate local urgent guidance, Unicode/punctuation matching, Unicode-aware output guards and feasible travel selection. All 620 Vitest cases pass; 87 of those are also run by an explicit offline evaluator (1,111 checks, zero model calls). Production browser tests pass 64/64. The overall coverage gates now require 90% lines, 85% statements, 80% branches and 80% functions. [Detailed comparison](CHALLENGE_COMPARISON.md).

## Ordered throttling and preference restoration

The limiter now expires buckets in accepted-write order and stops at the first live entry. It avoids scanning all clients on normal requests, rejects invalid configuration/time, preserves budgets on clock rollback, and supplies retry advice for the actual constraint. Rejected requests cannot prolong bucket lifetime. It remains per Worker isolate, not a distributed quota.

A three-sample local benchmark used 5,000 active clients and 20,000 accepted requests per sample. Median processing time changed from **1725.82 ms to 75.51 ms** (22.86× in this workload). This is a local microbenchmark, not page-load latency or a production guarantee. The prior committed implementation, method and every sample are recorded in [benchmark evidence](../reports/rate-limit-efficiency.json). A separate 10,000-request reference-model comparison checks correctness, including expiry, ordering, capacity and retry values.

Saved-profile parsing has a dedicated lazy module, an 8,192-code-unit size bound, and full schema validation. A recent language selection survives reload over an older saved profile without rewriting household information. Delayed restore errors cannot overwrite Clear. Both the limiter and saved-profile parser have **100% lines, statements, branches and functions covered**. See [ADR 0011](adr/0011-throttling-and-preference-restoration.md).

Version **18** is deployed from `6e14582e893691b991e1685e18dc8b8e7c0777db` at the unchanged public URL. **620 tests, 64 local browser checks and 64 production browser checks pass**, with no skipped or flaky browser results. Whole-source line coverage is **95.35%**. All 15 production axe states report zero detected violations and runtime errors. Home JavaScript is **117,494 gzip bytes**, inside the unchanged 117,500-byte budget. No paid model calls were needed for these changes; earlier real-AI evidence retains its timestamp.

The initial new lifecycle test matched both a notice and an output element’s implicit status role; the unused output was removed from the test fixture. A reserved test variable name was also corrected. The complete final suites pass without disabling checks. External judging scores have not been reverified.

## Previous version 17 strict sharing and speech lifecycle

Shared links now use the same strict schema when created and read: version, language and one to ten curated action IDs only. Unexpected metadata and invalid selections are rejected, closing the mismatch between the privacy assurance and permissive parsing. Valid links still round-trip; the existing Share button remains disabled when no action is selected.

A dedicated speech hook owns utterances and their callbacks. Natural completion and browser errors reset the controls. Text/language changes, Clear and unmount cancel playback; stale callbacks cannot change a newer session. Browser failures are recoverable and localized, buttons do not submit enclosing forms, and Hindi Pause/Stop labels are distinct. Both the speech hook and share module have **100% lines, statements, branches and functions covered**. Speech tests simulate browser APIs, not physical audio output. See [ADR 0010](adr/0010-share-contract-and-speech-ownership.md).

Version **17** was deployed from `719a0bceb7030827db0fcd9b743e6e74d2272dd0` at the same public URL. All **60 local and 60 production desktop/mobile tests** pass without failures, skips or flaky results. All 15 production axe states have zero detected violations and runtime errors. Home JavaScript remains **117,492 gzip bytes**, within the unchanged 117,500-byte budget. Whole-source line coverage is **95.29%**. No new paid AI call was needed for this UI/share change; previous unmocked AI evidence below retains its original release and timestamp.

The first new component-test run used a guessed Hindi read label; the observed label was corrected to “सुनें”. It also exposed identical Pause/Stop labels, which were fixed in the application. The final complete suites pass. GitHub-hosted CI remains blocked by the account billing lock; local checks and deployed browser verification are reported separately. No new external judging score has been observed.

A final specification review identified that cancelling speech does not clear the browser engine’s paused state. Restart now resumes that engine, including Pause → Stop → Read; regression doubles preserve native pause semantics. The first browser run also matched Next.js’s route announcer as well as the speech error. The selector now identifies the speech error specifically, retaining the visibility and recovery assertions.

## Previous version 16 focused guidance retrieval

Chat retrieval is separated from urgent routing and response formatting. A reusable index matches normalized whole words and explicit word variants, then retains the strongest query coverage with deterministic heading/order tie-breaking. Queries are bounded before normalization. Specific mask-fit questions no longer bring in filter-maintenance or pet guidance, and car does not match carbon. Hindi smoke spellings and the bus term remain supported. The library browsing search is unchanged.

The new retrieval module has **100% lines, statements, branches and functions covered**. A targeted six-case comparison against the previous committed retriever improves from **2/6 to 6/6**, without model calls. These specified regression cases are not a general precision/recall benchmark or predicted judging score. See [ADR 0009](adr/0009-focused-guidance-retrieval.md) and [case evidence](../reports/retrieval-quality.json).

Version **16** was deployed from `4df9560d75e5cac411545be75f1c8d21cf0f72ec` at the unchanged public URL. All **56 production desktop/mobile tests** pass with no failures, skips or flaky cases; all 15 production axe states have zero detected violations and runtime errors. Home JavaScript remains **117,492 gzip bytes**, within the unchanged 117,500-byte budget.

One actual production question, “How should a mask fit?”, passed through the shipped client and decoder and returned HTTP 200, mode `llm`, and only the `mask-fit` citation in **2,713 ms**. This single integration sample does not establish general model quality or a latency guarantee.

## Previous version 15 chat transport and rules-mode cancellation

Chat HTTP construction and stream validation now have a dedicated client, separate from UI state and conversation history. Non-success and incorrect-media-type bodies are cancelled. A thirty-second deadline spans headers and body. The stream must declare one mode before text and cannot relabel a partial answer. Invalid responses recover to cited local guidance. Switching rules mode aborts pending plan/chat work, releases busy controls and resets chat history; late success or failure cannot overwrite the newer result. See [ADR 0008](adr/0008-chat-transport-and-mode-ownership.md).

Version **15** is deployed from `a5e87e572958c8df4a7c0bb541335d425b875079` at the unchanged public URL. All **52 production desktop/mobile tests** passed with no failures, skips or flaky cases; all 15 production axe states passed with zero detected violations or runtime errors. The initial home bundle remains **117,492 gzip bytes**, within the unchanged 117,500-byte budget.

One unmocked production chat request passed through the shipped HTTP client and SSE decoder, returning HTTP 200, mode `llm`, and 3 citation(s) in **3,300 ms**. This is one integration sample, not a statistical model evaluation or guaranteed response time. Older plan and browser-UI AI evidence keeps its original timestamp and source revision.

## Previous version 14 location cancellation and bounded recovery

City search, approximate geolocation and live air responses now respect Clear, Stop, manual readings, query replacement and unmount. Clearing data synchronously aborts the reset signal; stale completions cannot repopulate the page. Manual recovery remains usable while a remote request is pending. City and air responses are capped at 256 KiB, with eight-second deadlines covering headers and body. Expired cached air cannot be returned after a slow failed refresh. See [ADR 0007](adr/0007-location-request-lifecycle.md).

Version **14** is deployed from `ad50aff90c85e076fa76f1aaf7eee1b16e713e34` at the same public URL. All **46 production desktop/mobile tests** passed, with no failed, skipped or flaky cases; all 15 production axe states report zero violations and runtime errors. The home payload is **117,492 gzip bytes**, within the unchanged 117,500-byte budget. One actual production AI request returned HTTP 200, `generatedBy: llm`, and 10 actions in **6,056 ms**. This is a sample, not a latency guarantee.

The first local run of the two new browser journeys counted theme dropdown options in addition to city suggestions. Selectors were scoped to the city list, retaining the same behavior assertions; the corrected full local and production suites passed. No runtime change was needed for that test correction.

## Previous version 13 guidance discovery and accessible correction

Profile errors now identify the affected field by its human-readable label, explain bounds or integer/age-count requirements, and deduplicate array failures. Activating an error link opens the correct wizard step and focuses the input after rendering. Invalid controls reference the specific error through ARIA.

The guidance library indexes bilingual source text once, normalizes Unicode compatibility characters and punctuation, and matches every query word regardless of order. Queries are bounded to 200 characters and remain on-device. A topic selector narrows results; an explicit empty state and Clear filters button restore all guidance and keyboard focus. No new runtime dependency or paid search request is added.

All **42 production desktop/mobile browser tests** passed, with no failed, skipped or flaky cases.

Version **13** is deployed from `e14363a677fef5f15b19aecb8ac9728c82315550` at the same public URL. One real production OpenAI request returned ten actions with `generatedBy: llm` in **11,262 ms**. This observed sample includes variable provider latency and is not a response-time guarantee. The public home bundle remains **117,314 gzip bytes**; all 15 production route/theme axe checks report zero detected violations and runtime errors.

## Previous version 12 application-wide code-quality pass

All eight remaining functions above complexity 15 were separated into focused components and helpers. The current audit reports **zero functions over 15**, and lint enforces that limit across every application TypeScript/TSX file without suppressions. This extends the earlier service/library gate; those modules also retain nesting and function-length limits. The architecture gate covers 69 modules and 23 client entry points.

Planning lifecycle and bounded response validation now have separate owners. Clipboard absence produces an actionable notice. Household age fields update when the number of children decreases, and blank age entries no longer become newborns. Library search trims surrounding spaces, and purifier feedback explains both room-area and ceiling-height bounds. These behaviors have regression tests.

All **38 production desktop/mobile browser tests** passed, with no failed, skipped or flaky cases.

Version **12** is deployed from `d42a343f837de7b59734823d9400fba61b962a3e` at the same public URL. A real production AI request returned HTTP 200, `generatedBy: llm`, and ten actions in **6,565 ms**. This is one observed sample, not a guaranteed response time. Public axe checks passed all 15 route/theme states with no detected violations or runtime errors; the home payload remains **117,314 gzip bytes**.

## Previous version 11 maintainability follow-up

The source update separates chat lifecycle from rendering, strictly decodes completed SSE messages, bounds upstream response bodies, shares local/server plan assembly and derives the Plan type from its runtime schema. Cache identity now includes source, stale state and forecast context. Exact JSON media types, empty coordinates and child-age/count consistency have regression checks.

The same static audit found 13 functions above complexity 15 before the update and 8 afterwards. Core services/libraries now enforce complexity 15, nesting 3 and 100-line functions; presentation-code exceptions remain visible in `reports/maintainability.json`. The new AST architecture gate checks 67 modules and 22 client roots for local import cycles and forbidden client/server or domain dependencies.

All **34 production browser tests passed** on desktop and mobile with zero failed, skipped or flaky cases.

Version **11** is deployed from `eeded0cadf4a5f49c7eb3612002a6a441e735517` at the unchanged public URL. The real production OpenAI check returned ten actions with `generatedBy: llm` in **6,080 ms**. This is one end-to-end sample, not a guaranteed response time. The home JavaScript payload measured **117,314 gzip bytes** and the public 15-state axe audit found zero violations and runtime errors.

## Previous version 10 testing and efficiency release

Version 10 is deployed from `0982144d016f3535b096765ee3ed5b04c71fda7b`. All **32 production desktop/mobile browser tests** pass. The **403 Vitest cases** comprise 316 unit/component/API/contract cases plus 87 independently recorded acceptance scenarios. Line coverage is **91.89%**, with 100% for the domain. Public axe checks report zero detected violations across 15 states and zero runtime errors.

The home bundle is **117,312 gzip bytes**, down 2,884 bytes from the preceding HAWA release and 338 bytes below Challenge 5. This is a small initial-bundle improvement; the larger efficiency changes are coalescing 50 identical in-flight air requests into one provider call and reserving model cost before every attempt. The home budget is now 117,500 bytes. The measurement includes global error-handler chunks that are not listed in the home/layout build manifest alone.

A real production AI request returned HTTP 200, `generatedBy: llm`, and ten actions in **6,329 ms**. This is one sample, not an under-two-second AI promise. Automated browser regressions use controlled provider responses; their durations cover entire multi-step journeys, not just page load.

New recovery tests exposed and fixed malformed successful plan responses, late responses after Clear/preferences changes, and blocked storage preventing live-state cleanup. Initial new browser selectors were corrected after inspecting failures; no assertions for product behavior were removed. The tightened bundle gate was finalized from actual HTML script accounting.

See `reports/efficiency-review.json`, `reports/production-e2e.json`, `reports/production-ai.json` and [ADR 0006](adr/0006-efficiency-and-recovery.md). Hosted CI remains blocked before any step by GitHub account billing.

## What changed in the preceding feature release

Expanded profile inputs; structured steps/caveats for all 60 bilingual guidance items; forecast chart/table and retrieval age; per-action impact explanations; weekly/adult-commuter scenarios; private-by-design shared links; school/community source checklists; fuel input-energy calculator, DIY safety guide and glossary; persisted theme/language and read-aloud pause; keyboard combobox; local rules planning/chat; bounded chat history/plan/air context; stricter unsafe-prose guards; upload cancellation/deadline; configurable provider limits; sliding-window Retry-After responses; source and history secret scans.

The regression suite caught and fixed an upload-cancellation race. Live AI review also found an unsupported transit/exposure paraphrase. Transport explanations now remain curated; other explanations retain validated AI personalization. Offline browser tests build a plan, ask a grounded question and download JSON without network after the Plan route is loaded. Live-air success and HTTP 429 tests use controlled provider responses; real provider verification is reported separately.

## Reproducible evidence

- `reports/coverage.json`
- `reports/local-e2e.json`
- `reports/browser-accessibility.json`
- `reports/bundle.json`
- `reports/contrast.txt`
- `reports/dependency-audit.json`
- `reports/secret-scan.json`
- `reports/ci.json`
- `reports/production-ai.json`
- `reports/production-chat-client.json`
- `reports/production-e2e.json`
- `reports/fresh-clone.json`
- `reports/demo.json`

Production evidence is refreshed after publication in `reports/production-*.json` and `reports/deployment.json`. Reports retain their timestamps and source revision; earlier measurements are not relabelled as this release.

## Previous version 9 public verification

Version 9 is deployed from `26833dd139945eb176ea0f1e7d39c92d3b0c69c1`. All **16 production desktop/mobile browser tests** pass, including the new urgent/Hindi/failure-recovery journey. All **15 axe page/theme states** report zero detected violations and zero runtime errors. A real browser chat returned `mode: llm` with a curated citation for `mask?`; recognised urgent guidance appeared immediately. The public home bundle remains 120,196 gzip bytes.

See `reports/deployment.json`, `reports/production-e2e.json`, `reports/production-accessibility.json` and `reports/production-chat.json`. The scenario evaluator was rerun from the clean deployed source revision and records that revision with `workingTreeDirty: false`.

## Previous public release verification

Preceding release version 8, source `4acac19`, passed all **14 production browser tests** and **15 axe page/theme checks** with zero detected violations or runtime errors. A real OpenAI plan returned ten actions and retained curated transport explanations. A fresh public-repository checkout passed all 103 tests.

The final mobile Lighthouse run measured **85 performance / 100 accessibility / 81 best practices / 100 SEO**, FCP **1.38 s**, LCP **1.47 s**, TBT **563 ms**, CLS **0**. An earlier version-6 run measured 99 performance and LCP 1.69 s. These are individual lab runs, not a guaranteed loading time. The best-practices deprecation finding comes from the hosting platform’s `/cdn-cgi/challenge-platform/scripts/jsd/main.js`; platform security controls were retained.

One version-7 full browser run passed 13/14 after the mobile air-to-plan journey lost state during navigation; its cause was not established. That test passed three targeted repetitions, then the final release passed the full 14-test suite with one worker. This history is retained in `reports/production-e2e.json`; it is not proof that intermittent failures are impossible.

Real browser Open-Meteo Delhi data was separately observed at 115.9 µg/m³ (source time 2026-11-19T18:30 Asia/Kolkata). Its dated report identifies the version tested.

## External requirements and honest limits

- The public application and repository use the existing links in README. Vercel/Railway account restrictions do not block this Sites deployment.
- GitHub's billing lock must be resolved by the account owner before hosted CI can execute. Local checks are not presented as hosted CI success.
- The saved LinkedIn link describes CarbonWise, not HAWA. Replace it with a HAWA-specific post using the prepared draft. The last observed portal assessment was 96.94/100 on 19 November, with one of three attempts used. The old deep link returned an unauthenticated 404 on 27 November; the event entry still reaches sign-in. No new score or consumed attempt is claimed.
- The public captioned demo was refreshed from the deployed application (3 minutes 8 seconds), including loaded-page offline planning, community tools and calculators. It uses labelled manual data and rules mode; real AI is verified separately.
- Independent NVDA/VoiceOver and professional Hindi review are not claimed. Some source names and technical explanations remain English.
- No medical validation, empirical local calibration, full regulatory certification, or Docker runtime verification is claimed.
- Loaded-page offline use works; first visits and uncached page loads need internet. No service-worker installation claim is made.
- A key pasted into conversation should be rotated through its provider account. No key value is in committed source or packaged artifacts.

The core problem statement is implemented and verified, and submission copy is prepared. A HAWA-specific public LinkedIn URL and owner resubmission remain external steps. A new assessment is pending, and hosted CI is blocked by the account billing restriction. A 100% evaluation score or top-1% ranking is not claimed. See [traceability](TRACEABILITY.md) for the detailed brief and justified design boundaries.
